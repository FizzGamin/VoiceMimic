import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
    console.log('🤖 VoiceMimic Discord Bot Setup\n');
    console.log('This wizard will help you configure your bot.\n');

    // Check if .env already exists
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            console.log('Setup cancelled.');
            rl.close();
            return;
        }
    }

    console.log('\n📝 Please provide the following information:\n');

    // Discord Token
    const discordToken = await question('Discord Bot Token: ');
    const discordClientId = await question('Discord Client ID: ');

    // OpenAI Key
    const openaiKey = await question('OpenAI API Key: ');

    // ElevenLabs
    const elevenLabsKey = await question('ElevenLabs API Key: ');
    const elevenLabsVoiceId = await question('ElevenLabs Voice ID (press Enter to set later): ');

    // Optional settings
    console.log('\n⚙️ Optional settings (press Enter for defaults):\n');
    const botPrefix = await question('Bot command prefix (default: !): ') || '!';
    const aiModel = await question('AI Model (default: gpt-4-turbo-preview): ') || 'gpt-4-turbo-preview';

    // Create .env content
    const envContent = `# Discord Configuration
DISCORD_TOKEN=${discordToken}
DISCORD_CLIENT_ID=${discordClientId}

# OpenAI Configuration (for Whisper ASR and ChatGPT)
OPENAI_API_KEY=${openaiKey}

# ElevenLabs Configuration
ELEVENLABS_API_KEY=${elevenLabsKey}
ELEVENLABS_VOICE_ID=${elevenLabsVoiceId}

# Bot Configuration
BOT_PREFIX=${botPrefix}
VOICE_CHANNEL_ID=

# AI Configuration
AI_MODEL=${aiModel}
AI_SYSTEM_PROMPT=You are a helpful AI assistant in a Discord voice channel. Keep responses concise and conversational.

# Audio Configuration
SAMPLE_RATE=48000
CHANNELS=2
BIT_DEPTH=16

# Performance
MAX_RECORDING_DURATION=30000
SILENCE_THRESHOLD=500
`;

    // Write .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Configuration saved to .env\n');

    if (!elevenLabsVoiceId) {
        console.log('💡 To find your ElevenLabs Voice ID, run:');
        console.log('   node scripts/listVoices.js\n');
    }

    console.log('📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Invite your bot to a Discord server');
    console.log('3. Run: npm start');
    console.log('4. Join a voice channel and type: !join\n');

    console.log('📚 For more information, see README.md or QUICKSTART.md\n');

    rl.close();
}

setup().catch(error => {
    console.error('Error during setup:', error);
    rl.close();
    process.exit(1);
});
