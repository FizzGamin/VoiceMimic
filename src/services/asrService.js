import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import fetch from 'node-fetch';
import FormData from 'form-data';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ASRService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
            timeout: 60000, // 60 second timeout
            maxRetries: 2,
        });

        // Create temp directory if it doesn't exist
        this.tempDir = path.join(path.dirname(__dirname), '..', 'temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Convert PCM audio to WAV format
     */
    pcmToWav(pcmData, sampleRate, channels, bitDepth) {
        const byteRate = sampleRate * channels * (bitDepth / 8);
        const blockAlign = channels * (bitDepth / 8);

        const wavHeader = Buffer.alloc(44);

        // "RIFF" chunk descriptor
        wavHeader.write('RIFF', 0);
        wavHeader.writeUInt32LE(36 + pcmData.length, 4);
        wavHeader.write('WAVE', 8);

        // "fmt " sub-chunk
        wavHeader.write('fmt ', 12);
        wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
        wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
        wavHeader.writeUInt16LE(channels, 22);
        wavHeader.writeUInt32LE(sampleRate, 24);
        wavHeader.writeUInt32LE(byteRate, 28);
        wavHeader.writeUInt16LE(blockAlign, 32);
        wavHeader.writeUInt16LE(bitDepth, 34);

        // "data" sub-chunk
        wavHeader.write('data', 36);
        wavHeader.writeUInt32LE(pcmData.length, 40);

        return Buffer.concat([wavHeader, pcmData]);
    }

    /**
     * Convert stereo to mono by averaging channels
     */
    stereoToMono(buffer) {
        const samples = buffer.length / 4; // 16-bit stereo = 4 bytes per sample pair
        const monoBuffer = Buffer.alloc(samples * 2);

        for (let i = 0; i < samples; i++) {
            const left = buffer.readInt16LE(i * 4);
            const right = buffer.readInt16LE(i * 4 + 2);
            const mono = Math.floor((left + right) / 2);
            monoBuffer.writeInt16LE(mono, i * 2);
        }

        return monoBuffer;
    }

    /**
     * Convert Opus audio to WAV using FFmpeg
     */
    async opusToWav(opusData, sampleRate = 48000) {
        return new Promise((resolve, reject) => {
            // Save Opus data to a temp file first since it's raw Opus packets from Discord
            const tempOpusPath = path.join(this.tempDir, `opus_${Date.now()}.ogg`);

            // Create an Ogg Opus container manually
            // For simplicity, we'll let FFmpeg handle raw s16le PCM from Discord's Opus stream
            // Discord sends Opus packets, but we need to decode them differently

            // Actually, let's use prism-media's opus decoder approach via stdin
            const ffmpeg = spawn(ffmpegPath, [
                '-f', 's16le',          // Input is raw PCM signed 16-bit little-endian
                '-ar', sampleRate.toString(),
                '-ac', '2',             // Stereo input
                '-i', 'pipe:0',         // Read from stdin
                '-ar', '16000',         // Whisper prefers 16kHz
                '-ac', '1',             // Mono output
                '-f', 'wav',            // Output format
                'pipe:1'                // Write to stdout
            ]);

            const chunks = [];

            ffmpeg.stdout.on('data', (chunk) => {
                chunks.push(chunk);
            });

            ffmpeg.stderr.on('data', (data) => {
                // FFmpeg logs go to stderr
                const message = data.toString();
                if (message.includes('Error') || message.includes('Invalid')) {
                    console.error('FFmpeg:', message);
                }
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve(Buffer.concat(chunks));
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            ffmpeg.on('error', (err) => {
                reject(err);
            });

            ffmpeg.stdin.write(opusData);
            ffmpeg.stdin.end();
        });
    }

    /**
     * Transcribe audio using OpenAI Whisper
     * @param {Object|Buffer} audioData - Audio data (Buffer for PCM, or object with format info)
     * @param {number} sampleRate - Sample rate (for PCM)
     * @param {number} channels - Number of channels (for PCM)
     * @param {number} bitDepth - Bit depth (for PCM)
     * @returns {Promise<string>} Transcribed text
     */
    async transcribe(audioData, sampleRate = 48000, channels = 2, bitDepth = 16) {
        try {
            let wavData;

            // Check if audioData is an object with format info (from voice receiver)
            if (audioData && typeof audioData === 'object' && !Buffer.isBuffer(audioData) && audioData.audioData) {
                console.log(`🎵 Processing ${audioData.format || 'PCM'} audio...`);

                let processedData = audioData.audioData;
                let processedChannels = audioData.channels;

                if (audioData.channels === 2) {
                    processedData = this.stereoToMono(audioData.audioData);
                    processedChannels = 1;
                }

                wavData = this.pcmToWav(processedData, audioData.sampleRate, processedChannels, audioData.bitDepth);
            } else {
                // Legacy format: raw PCM buffer
                console.log('🎵 Processing PCM audio (legacy format)...');
                let processedData = audioData;
                let processedChannels = channels;

                if (channels === 2) {
                    processedData = this.stereoToMono(audioData);
                    processedChannels = 1;
                }

                wavData = this.pcmToWav(processedData, sampleRate, processedChannels, bitDepth);
            }

            // Save to temporary file
            const tempFilePath = path.join(this.tempDir, `audio_${Date.now()}.wav`);
            fs.writeFileSync(tempFilePath, wavData);

            console.log(`🎵 Transcribing audio file: ${tempFilePath} (${wavData.length} bytes)`);

            // Use raw fetch instead of OpenAI SDK for better network compatibility
            let transcription;
            let lastError;
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Create FormData for multipart upload
                    const formData = new FormData();
                    formData.append('file', fs.createReadStream(tempFilePath), {
                        filename: 'audio.wav',
                        contentType: 'audio/wav',
                    });
                    formData.append('model', 'whisper-1');
                    formData.append('language', 'en');
                    formData.append('response_format', 'json');

                    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${config.openai.apiKey}`,
                            ...formData.getHeaders(),
                        },
                        body: formData,
                        timeout: 60000, // 60 second timeout
                    });

                    if (!response.ok) {
                        const error = new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
                        error.status = response.status;
                        throw error;
                    }

                    transcription = await response.json();
                    break; // Success, exit retry loop
                } catch (error) {
                    lastError = error;
                    const shouldRetry = (
                        error.code === 'ECONNRESET' ||
                        error.type === 'request-timeout' ||
                        error.status === 429 ||
                        error.status >= 500 ||
                        error.message?.includes('429')
                    );

                    if (attempt < maxRetries && shouldRetry) {
                        const waitTime = error.status === 429 ? 5000 * attempt : 2000 * attempt;
                        console.log(`⚠️  Attempt ${attempt} failed (${error.message}), retrying in ${waitTime / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    } else {
                        throw error; // Give up
                    }
                }
            }

            if (!transcription) {
                throw lastError;
            }

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            const text = transcription.text.trim();
            console.log(`📝 Transcription: "${text}"`);

            return text;
        } catch (error) {
            console.error('Error transcribing audio:', error);

            // Clean up temp file on error
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                if (file.startsWith('audio_') && file.endsWith('.wav')) {
                    try {
                        fs.unlinkSync(path.join(this.tempDir, file));
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            });

            throw error;
        }
    }

    /**
     * Clean up old temporary files
     */
    cleanupTempFiles() {
        try {
            const files = fs.readdirSync(this.tempDir);
            const now = Date.now();

            files.forEach(file => {
                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;

                // Delete files older than 1 hour
                if (age > 3600000) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
}

export default ASRService;
