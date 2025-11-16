import dotenv from 'dotenv';

dotenv.config();

export default {
    // Discord
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        prefix: process.env.BOT_PREFIX || '!',
        voiceChannelId: process.env.VOICE_CHANNEL_ID || null,
    },

    // OpenAI
    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
        systemPrompt: process.env.AI_SYSTEM_PROMPT || 'You are a helpful AI assistant in a Discord voice channel. Keep responses concise and conversational.',
    },

    // ElevenLabs
    elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY,
        voiceId: process.env.ELEVENLABS_VOICE_ID,
    },

    // Audio settings
    audio: {
        sampleRate: parseInt(process.env.SAMPLE_RATE) || 48000,
        channels: parseInt(process.env.CHANNELS) || 2,
        bitDepth: parseInt(process.env.BIT_DEPTH) || 16,
        maxRecordingDuration: parseInt(process.env.MAX_RECORDING_DURATION) || 30000,
        silenceThreshold: parseInt(process.env.SILENCE_THRESHOLD) || 500,
    },
};
