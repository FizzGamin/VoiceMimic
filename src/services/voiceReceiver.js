import { EndBehaviorType } from '@discordjs/voice';
import { EventEmitter } from 'events';
import prism from 'prism-media';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

class VoiceReceiver extends EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
        this.receiver = connection.receiver;
        this.activeStreams = new Map();
        this.silenceTimers = new Map();
        this.userBuffers = new Map();
    }

    start() {
        console.log('🎤 Voice receiver started');

        this.receiver.speaking.on('start', (userId) => {
            this.handleSpeakingStart(userId);
        });

        this.receiver.speaking.on('end', (userId) => {
            this.handleSpeakingEnd(userId);
        });
    }

    handleSpeakingStart(userId) {
        if (this.activeStreams.has(userId)) {
            return; // Already listening to this user
        }

        console.log(`👤 User ${userId} started speaking`);

        // Clear any existing silence timer
        if (this.silenceTimers.has(userId)) {
            clearTimeout(this.silenceTimers.get(userId));
            this.silenceTimers.delete(userId);
        }

        // Create audio stream for this user
        const audioStream = this.receiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 500, // 500ms of silence before ending (faster response)
            },
        });

        // Initialize buffer for this user
        if (!this.userBuffers.has(userId)) {
            this.userBuffers.set(userId, []);
        }

        const buffer = this.userBuffers.get(userId);

        // Create Opus decoder using prism-media
        const opusDecoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });

        this.activeStreams.set(userId, { audioStream, opusDecoder });

        // Pipe the audio stream through the Opus decoder
        audioStream.pipe(opusDecoder);

        // Collect decoded PCM data
        opusDecoder.on('data', (chunk) => {
            try {
                if (chunk && chunk.length > 0) {
                    buffer.push(chunk);
                }
            } catch (error) {
                console.error('Error collecting audio:', error);
            }
        });

        opusDecoder.on('error', (error) => {
            console.error(`Error in Opus decoder for user ${userId}:`, error);
        });

        opusDecoder.on('error', (error) => {
            console.error(`Error in Opus decoder for user ${userId}:`, error);
        });

        audioStream.on('end', () => {
            opusDecoder.end();
        });

        opusDecoder.on('end', () => {
            this.handleStreamEnd(userId);
        });

        audioStream.on('error', (error) => {
            console.error(`Error in audio stream for user ${userId}:`, error);
            this.cleanup(userId);
        });
    }

    handleSpeakingEnd(userId) {
        console.log(`👤 User ${userId} stopped speaking`);

        // Set a timer to process the audio after a short delay
        // This ensures we capture the complete utterance
        const timer = setTimeout(() => {
            this.processUserAudio(userId);
            this.silenceTimers.delete(userId);
        }, 250); // Wait 0.25 seconds after speaking stops

        this.silenceTimers.set(userId, timer);
    }

    handleStreamEnd(userId) {
        console.log(`🔇 Audio stream ended for user ${userId}`);

        // Give a small delay before processing to ensure all data is captured
        setTimeout(() => {
            if (this.userBuffers.has(userId) && this.userBuffers.get(userId).length > 0) {
                this.processUserAudio(userId);
            }
        }, 500);
    }

    processUserAudio(userId) {
        const buffer = this.userBuffers.get(userId);

        if (!buffer || buffer.length === 0) {
            console.log(`No audio data to process for user ${userId}`);
            this.cleanup(userId);
            return;
        }

        // Concatenate all PCM chunks
        const totalLength = buffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const audioData = Buffer.concat(buffer, totalLength);

        // Check if we have enough audio (at least 0.5 seconds of PCM to filter out keyboard noises)
        const minSamples = 48000 * 2 * 2 * 0.5; // 48kHz * 2 channels * 2 bytes * 0.5 seconds
        if (audioData.length < minSamples) {
            console.log(`Audio too short for user ${userId} (${audioData.length} bytes), ignoring`);
            this.cleanup(userId);
            return;
        }

        // Calculate average volume to filter out quiet background noises
        const avgVolume = this.calculateAverageVolume(audioData);
        const minVolume = 400; // Minimum volume threshold (adjust as needed)

        if (avgVolume < minVolume) {
            console.log(`Audio too quiet for user ${userId} (avg volume: ${avgVolume}), ignoring`);
            this.cleanup(userId);
            return;
        }

        console.log(`📦 Captured ${audioData.length} bytes of PCM audio from user ${userId} (avg volume: ${avgVolume})`);

        // Emit the PCM audio data for processing
        this.emit('audioReceived', {
            userId,
            audioData,
            sampleRate: 48000,
            channels: 2,
            bitDepth: 16,
            format: 'pcm',
        });

        // Cleanup this user's data
        this.cleanup(userId);
    }

    /**
     * Calculate average volume/amplitude of audio data
     */
    calculateAverageVolume(audioData) {
        let sum = 0;
        // Read 16-bit PCM samples
        for (let i = 0; i < audioData.length - 1; i += 2) {
            const sample = audioData.readInt16LE(i);
            sum += Math.abs(sample);
        }
        return sum / (audioData.length / 2);
    }

    cleanup(userId) {
        // Clear buffer
        if (this.userBuffers.has(userId)) {
            this.userBuffers.set(userId, []);
        }

        // Clear stream and decoder
        if (this.activeStreams.has(userId)) {
            const { audioStream, opusDecoder } = this.activeStreams.get(userId);
            try {
                audioStream.destroy();
                if (opusDecoder) {
                    opusDecoder.destroy();
                }
            } catch (error) {
                // Ignore cleanup errors
            }
            this.activeStreams.delete(userId);
        }

        // Clear timer
        if (this.silenceTimers.has(userId)) {
            clearTimeout(this.silenceTimers.get(userId));
            this.silenceTimers.delete(userId);
        }
    }

    stop() {
        console.log('🛑 Stopping voice receiver');

        // Cleanup all users
        for (const userId of this.activeStreams.keys()) {
            this.cleanup(userId);
        }

        this.activeStreams.clear();
        this.silenceTimers.clear();
        this.userBuffers.clear();
    }
}

export default VoiceReceiver;
