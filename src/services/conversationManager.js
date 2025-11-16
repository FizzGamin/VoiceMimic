import VoiceReceiver from './voiceReceiver.js';
import ASRService from './asrService.js';
import LLMService from './llmService.js';
import TTSService from './ttsService.js';
import AudioPlayer from './audioPlayer.js';
import { getCharacter } from '../characters.js';
import { getRandomTick, shouldUseTick } from '../vocalTicks.js';
import { getRandomTrivia } from '../triviaQuestions.js';

class ConversationManager {
    constructor(voiceReceiver, audioPlayer, characterName = 'connor', guild = null, botClient = null) {
        this.voiceReceiver = voiceReceiver;
        this.audioPlayer = audioPlayer;
        this.guild = guild; // Store guild reference for nickname changes
        this.botClient = botClient; // Store bot client reference for avatar changes

        this.asrService = new ASRService();
        this.llmService = new LLMService();
        this.ttsService = new TTSService();

        this.isProcessing = new Set(); // Track which users are being processed
        this.isActive = false;

        // Silence and trivia tracking
        this.lastActivityTime = Date.now();
        this.silenceTimer = null;
        this.triviaAskedInCurrentSilence = false;

        // Set initial character
        this.setCharacter(getCharacter(characterName));
    }

    /**
     * Switch to a different character/personality
     */
    async setCharacter(character) {
        this.currentCharacter = character;
        this.llmService.setCharacter(character);
        this.ttsService.setVoice(character.voiceId);
        console.log(`🎭 Character set to: ${character.name}`);

        // Update bot's nickname in the server to Discord name
        if (this.guild) {
            try {
                const me = await this.guild.members.fetchMe();
                await me.setNickname(character.discordName);
                console.log(`✏️  Changed bot nickname to: ${character.discordName}`);
            } catch (error) {
                console.error('Failed to change nickname:', error.message);
            }
        }

        // Update bot's avatar if avatarUrl is provided
        if (this.botClient && character.avatarUrl) {
            try {
                await this.botClient.user.setAvatar(character.avatarUrl);
                console.log(`🖼️  Changed bot avatar for: ${character.name}`);
            } catch (error) {
                console.error('Failed to change avatar:', error.message);
            }
        }
    }    /**
     * Start listening and responding to voice
     */
    async start() {
        console.log('🚀 Conversation manager started');
        this.isActive = true;

        // Listen for audio from users
        this.voiceReceiver.on('audioReceived', async (audioData) => {
            await this.handleAudioReceived(audioData);
        });

        this.voiceReceiver.start();

        // Start silence detection for trivia questions
        this.startSilenceDetection();

        // Start cleanup interval (every 30 minutes)
        this.cleanupInterval = setInterval(() => {
            this.asrService.cleanupTempFiles();
            this.ttsService.cleanupTempFiles();
        }, 1800000);
    }

    /**
     * Start detecting silence periods for trivia questions
     */
    startSilenceDetection() {
        // Check for silence every 3 seconds
        this.silenceTimer = setInterval(() => {
            const silenceDuration = Date.now() - this.lastActivityTime;

            // If it's been 6+ seconds since last activity and we haven't asked trivia yet this silence
            if (silenceDuration > 6000 && !this.triviaAskedInCurrentSilence) {
                // 10% chance to ask trivia during silence
                if (Math.random() < 0.1) {
                    this.askRandomTrivia();
                    this.triviaAskedInCurrentSilence = true;
                }
            }
        }, 3000); // Check every 3 seconds
    }

    /**
     * Ask a random trivia question
     */
    async askRandomTrivia() {
        try {
            const trivia = getRandomTrivia();
            console.log(`🤔 Asking trivia during silence: "${trivia}"`);

            const ttsFilePath = await this.ttsService.textToSpeech(trivia);
            await this.audioPlayer.enqueue(ttsFilePath, true);
        } catch (error) {
            console.error('Error asking trivia:', error);
        }
    }

    /**
     * Reset activity tracking (called when user speaks)
     */
    resetActivity() {
        this.lastActivityTime = Date.now();
        this.triviaAskedInCurrentSilence = false;
    }

    /**
     * Handle received audio from a user
     */
    async handleAudioReceived(audioData) {
        const { userId } = audioData;

        // Prevent processing multiple requests from the same user simultaneously
        if (this.isProcessing.has(userId)) {
            console.log(`⚠️  Already processing audio for user ${userId}, skipping...`);
            return;
        }

        this.isProcessing.add(userId);

        try {
            // Step 1: Transcribe audio to text (ASR)
            console.log(`\n--- Processing audio from user ${userId} ---`);
            // Pass the entire audioData object (includes format, audioData, sampleRate, etc.)
            const transcribedText = await this.asrService.transcribe(audioData);

            // Check if transcription is empty or too short
            if (!transcribedText || transcribedText.length < 2) {
                console.log('Transcription too short or empty, ignoring...');
                return;
            }

            // ONLY reset activity timer after successful transcription
            // This prevents keyboard typing from triggering trivia questions
            this.resetActivity();
            console.log('✅ Valid conversation detected - silence timer reset');

            // Check if user is addressing a specific character with "Hey [name]"
            const characterSwitch = this.detectCharacterSwitch(transcribedText);
            if (characterSwitch) {
                const character = getCharacter(characterSwitch.characterName);
                await this.setCharacter(character);
                console.log(`🎯 Detected character switch to: ${character.name}`);

                // Use the remaining text (without "Hey [name]") for the response
                const remainingText = characterSwitch.remainingText;

                // If there's nothing left after "Hey [name]", just acknowledge with a tick
                if (!remainingText || remainingText.length < 3) {
                    const aiResponse = getRandomTick();
                    console.log(`🎲 Acknowledging with tick: "${aiResponse}"`);
                    const ttsFilePath = await this.ttsService.textToSpeech(aiResponse);
                    await this.audioPlayer.enqueue(ttsFilePath, true);
                    console.log(`✅ Character switched and acknowledged\n`);
                    return;
                }
            }

            // Step 2: Decide if we should use a vocal tick or full AI response
            let aiResponse;

            if (shouldUseTick(0.3)) { // 30% chance of using a vocal tick
                aiResponse = getRandomTick();
                console.log(`🎲 Using vocal tick: "${aiResponse}"`);
            } else {
                // Generate full AI response (LLM)
                aiResponse = await this.llmService.generateResponse(userId, transcribedText);
            }

            // Check if AI response is empty
            if (!aiResponse || aiResponse.length === 0) {
                console.log('AI response is empty, ignoring...');
                return;
            }

            // Step 3: Convert AI response to speech (TTS)
            const ttsFilePath = await this.ttsService.textToSpeech(aiResponse);

            // Step 4: Play the audio response
            await this.audioPlayer.enqueue(ttsFilePath, true);

            console.log(`✅ Successfully processed and queued response for user ${userId}\n`);
        } catch (error) {
            console.error(`Error processing audio for user ${userId}:`, error);

            // Try to play an error message
            try {
                const errorMessage = "I'm sorry, I encountered an error processing your message.";
                const errorTTSPath = await this.ttsService.textToSpeech(errorMessage);
                await this.audioPlayer.enqueue(errorTTSPath, true);
            } catch (ttsError) {
                console.error('Failed to generate error message TTS:', ttsError);
            }
        } finally {
            // Remove user from processing set
            this.isProcessing.delete(userId);
        }
    }

    /**
     * Detect if user is addressing a specific character with "Hey [name]"
     * Returns { characterName, remainingText } or null
     */
    detectCharacterSwitch(text) {
        const lowerText = text.toLowerCase();
        const patterns = [
            { regex: /^hey\s+(connor|griffin|elijah)\b[,.]?\s*/i, group: 1 },
            { regex: /^(connor|griffin|elijah)\b[,.]?\s*/i, group: 1 },
        ];

        for (const pattern of patterns) {
            const match = lowerText.match(pattern.regex);
            if (match) {
                const characterName = match[pattern.group].toLowerCase();
                const remainingText = text.substring(match[0].length).trim();
                return { characterName, remainingText };
            }
        }

        return null;
    }

    /**
     * Get conversation statistics for a user
     */
    getStats(userId) {
        return this.llmService.getStats(userId);
    }

    /**
     * Clear conversation history for a user
     */
    clearHistory(userId) {
        this.llmService.clearHistory(userId);
        console.log(`🗑️  Cleared conversation history for user ${userId}`);
    }

    /**
     * Stop the conversation manager
     */
    async stop() {
        console.log('🛑 Stopping conversation manager');
        this.isActive = false;

        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Clear silence timer
        if (this.silenceTimer) {
            clearInterval(this.silenceTimer);
        }

        // Stop components
        this.voiceReceiver.stop();
        this.audioPlayer.stop();

        // Clear processing set
        this.isProcessing.clear();

        console.log('✅ Conversation manager stopped');
    }
}

export default ConversationManager;
