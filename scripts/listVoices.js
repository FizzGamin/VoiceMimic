import TTSService from '../src/services/ttsService.js';

async function listVoices() {
    console.log('🔍 Fetching available ElevenLabs voices...\n');

    const ttsService = new TTSService();

    try {
        const voices = await ttsService.listVoices();

        if (voices.length === 0) {
            console.log('❌ No voices found. Check your API key in .env file.');
            return;
        }

        console.log(`\n✅ Found ${voices.length} voices`);
        console.log('\nCopy one of the Voice IDs above to your .env file as ELEVENLABS_VOICE_ID');
    } catch (error) {
        console.error('❌ Error fetching voices:', error.message);
        console.log('\nMake sure:');
        console.log('1. You have created a .env file from .env.example');
        console.log('2. Your ELEVENLABS_API_KEY is set correctly in .env');
        console.log('3. Your API key is valid and active');
    }
}

listVoices();
