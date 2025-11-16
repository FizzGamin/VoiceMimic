import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TTSService {
    constructor() {
        this.apiKey = config.elevenlabs.apiKey;
        this.voiceId = config.elevenlabs.voiceId;
        this.baseUrl = 'https://api.elevenlabs.io/v1';

        // Create temp directory if it doesn't exist
        this.tempDir = path.join(path.dirname(__dirname), '..', 'temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Set voice ID for TTS
     */
    setVoice(voiceId) {
        this.voiceId = voiceId;
        console.log(`🎤 TTS voice set to: ${voiceId}`);
    }

    /**
     * Convert text to speech using ElevenLabs
     */
    async textToSpeech(text) {
        try {
            console.log(`🔊 Converting text to speech: "${text}"`);

            const url = `${this.baseUrl}/text-to-speech/${this.voiceId}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            // Get audio data as buffer
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            // Save to temporary file
            const tempFilePath = path.join(this.tempDir, `tts_${Date.now()}.mp3`);
            fs.writeFileSync(tempFilePath, audioBuffer);

            console.log(`✅ TTS audio saved to: ${tempFilePath}`);

            return tempFilePath;
        } catch (error) {
            console.error('Error in text-to-speech:', error);
            throw error;
        }
    }

    /**
     * Convert text to speech with streaming (for lower latency)
     */
    async textToSpeechStream(text) {
        try {
            console.log(`🔊 Streaming TTS for: "${text}"`);

            const url = `${this.baseUrl}/text-to-speech/${this.voiceId}/stream`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            return response.body;
        } catch (error) {
            console.error('Error in streaming text-to-speech:', error);
            throw error;
        }
    }

    /**
     * Get available voices
     */
    async getVoices() {
        try {
            const url = `${this.baseUrl}/voices`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.status}`);
            }

            const data = await response.json();
            return data.voices;
        } catch (error) {
            console.error('Error fetching voices:', error);
            throw error;
        }
    }

    /**
     * List available voices (with details)
     */
    async listVoices() {
        try {
            const voices = await this.getVoices();

            console.log('\n📢 Available ElevenLabs Voices:');
            voices.forEach(voice => {
                console.log(`  - ${voice.name} (ID: ${voice.voice_id})`);
                console.log(`    Category: ${voice.category || 'N/A'}`);
                console.log(`    Description: ${voice.description || 'N/A'}\n`);
            });

            return voices;
        } catch (error) {
            console.error('Error listing voices:', error);
            return [];
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
                if (!file.startsWith('tts_') || !file.endsWith('.mp3')) {
                    return;
                }

                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);
                const age = now - stats.mtimeMs;

                // Delete files older than 1 hour
                if (age > 3600000) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Cleaned up old TTS file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }

    /**
     * Delete a specific TTS file
     */
    deleteTTSFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Deleted TTS file: ${filePath}`);
            }
        } catch (error) {
            console.error('Error deleting TTS file:', error);
        }
    }
}

// Add node-fetch for compatibility if needed
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

export default TTSService;
