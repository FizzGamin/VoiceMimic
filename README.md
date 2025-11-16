# VoiceMimic Discord Bot 🎤🤖

A Discord bot that listens to voice channels, transcribes speech, generates AI responses, and speaks back using ElevenLabs text-to-speech. Perfect for creating an AI companion that can naturally converse in Discord voice channels.

## Features

- 🎙️ **Voice Capture**: Captures audio from Discord voice channels in real-time
- 📝 **Speech-to-Text**: Uses OpenAI Whisper for accurate transcription
- 🤖 **AI Responses**: Generates contextual responses using ChatGPT
- 🔊 **Text-to-Speech**: Converts AI responses to natural-sounding speech with ElevenLabs
- 💬 **Conversation Memory**: Maintains conversation history for context-aware responses
- 🎯 **Per-User Processing**: Handles multiple users speaking independently
- ⚡ **Queue System**: Manages audio playback to prevent overlapping

## Architecture

```
Discord Voice Channel
    ↓ (Opus packets)
Voice Receiver
    ↓ (PCM audio)
ASR Service (Whisper)
    ↓ (transcribed text)
LLM Service (ChatGPT)
    ↓ (AI response text)
TTS Service (ElevenLabs)
    ↓ (audio file)
Audio Player
    ↓ (Opus encoding)
Discord Voice Channel (bot speaks)
```

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **FFmpeg**: Required for audio processing
- **Discord Bot**: Bot token and permissions
- **OpenAI API Key**: For Whisper and ChatGPT
- **ElevenLabs API Key**: For text-to-speech

### Installing FFmpeg

**Windows:**
```powershell
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/voicemimic-discord-bot.git
cd voicemimic-discord-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" section and click "Add Bot"
4. Enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Under "Bot Permissions", enable:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity
6. Copy your bot token

### 4. Invite Bot to Server

Generate invite link with this URL (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3165184&scope=bot
```

### 5. Get API Keys

**OpenAI:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys
3. Create a new API key

**ElevenLabs:**
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up and go to your profile
3. Copy your API key
4. Choose a voice and copy its Voice ID

### 6. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_preferred_voice_id_here

# Bot Configuration
BOT_PREFIX=!
AI_MODEL=gpt-4-turbo-preview
AI_SYSTEM_PROMPT=You are a helpful AI assistant in a Discord voice channel. Keep responses concise and conversational.
```

### 7. Finding ElevenLabs Voice ID

Run this helper script to list available voices:
```bash
node scripts/listVoices.js
```

Or manually:
1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Choose a voice
3. Copy the Voice ID from the URL or API

## Usage

### Starting the Bot

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### Bot Commands

Once the bot is running and in your server:

- **`!join`** - Bot joins your current voice channel and starts listening
- **`!leave`** - Bot leaves the voice channel
- **`!help`** - Display help information

### How to Use

1. Join a voice channel in your Discord server
2. Type `!join` in any text channel
3. Start speaking! The bot will:
   - Listen to your voice
   - Transcribe what you say
   - Generate an AI response
   - Speak back to you in the voice channel
4. Have a natural conversation with the AI
5. Type `!leave` when done

## Configuration Options

You can customize the bot's behavior by editing `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_PREFIX` | Command prefix | `!` |
| `AI_MODEL` | OpenAI model to use | `gpt-4-turbo-preview` |
| `AI_SYSTEM_PROMPT` | AI personality/instructions | See `.env.example` |
| `MAX_RECORDING_DURATION` | Max recording length (ms) | `30000` |
| `SILENCE_THRESHOLD` | Silence detection (ms) | `500` |

## Project Structure

```
voicemimic-discord-bot/
├── src/
│   ├── index.js                 # Main bot file
│   ├── config.js                # Configuration loader
│   └── services/
│       ├── voiceReceiver.js     # Captures Discord audio
│       ├── asrService.js        # Speech-to-text (Whisper)
│       ├── llmService.js        # AI response generation (ChatGPT)
│       ├── ttsService.js        # Text-to-speech (ElevenLabs)
│       ├── audioPlayer.js       # Plays audio in Discord
│       └── conversationManager.js # Orchestrates the pipeline
├── temp/                        # Temporary audio files (auto-generated)
├── package.json
├── .env.example
├── .env                         # Your configuration (not in git)
└── README.md
```

## Troubleshooting

### Bot can't hear anyone

- Make sure the bot has "Connect" and "Use Voice Activity" permissions
- Check that Discord's "Privileged Gateway Intents" are enabled
- Verify users aren't muted or deafened

### Audio quality issues

- Check your internet connection
- Lower the `MAX_RECORDING_DURATION` in `.env`
- Adjust ElevenLabs voice settings in `ttsService.js`

### API quota errors

**OpenAI:**
- Check your usage at [OpenAI Usage](https://platform.openai.com/usage)
- Consider using `gpt-3.5-turbo` instead of `gpt-4`

**ElevenLabs:**
- Check your character limit at [ElevenLabs](https://elevenlabs.io/)
- Free tier has limited characters per month

### FFmpeg not found

Make sure FFmpeg is installed and in your system PATH:
```bash
ffmpeg -version
```

### Bot disconnects randomly

- Check your bot's rate limits
- Ensure stable internet connection
- Monitor Discord API status: https://discordstatus.com/

## Performance Tips

1. **Reduce Latency:**
   - Use shorter AI responses (`max_tokens` in `llmService.js`)
   - Consider using ElevenLabs streaming API
   - Use faster AI models (gpt-3.5-turbo)

2. **Handle Multiple Users:**
   - Bot processes users independently
   - Audio is queued to prevent overlapping
   - Consider implementing cooldowns

3. **Cost Management:**
   - Set usage limits per user
   - Implement cooldowns between requests
   - Monitor API usage regularly

## API Costs (Approximate)

- **OpenAI Whisper**: ~$0.006 per minute of audio
- **OpenAI GPT-4**: ~$0.03 per 1K tokens
- **OpenAI GPT-3.5**: ~$0.002 per 1K tokens
- **ElevenLabs**: ~$0.30 per 1K characters (varies by plan)

**Example:** 1 hour of active conversation might cost $2-5 depending on usage.

## Advanced Configuration

### Custom System Prompts

Edit the `AI_SYSTEM_PROMPT` in `.env` to change the AI's personality:

```env
AI_SYSTEM_PROMPT=You are a pirate captain with a thick accent. Keep responses short and nautical-themed.
```

### Voice Settings

Customize ElevenLabs voice in `src/services/ttsService.js`:

```javascript
voice_settings: {
  stability: 0.5,        // 0-1: Lower = more expressive
  similarity_boost: 0.75, // 0-1: Higher = closer to original
  style: 0.0,            // 0-1: Style exaggeration
  use_speaker_boost: true
}
```

### Conversation History Length

Change `maxHistoryLength` in `src/services/llmService.js`:

```javascript
this.maxHistoryLength = 10; // Keep last 10 messages
```

## Security Best Practices

- ✅ Never commit `.env` to version control
- ✅ Use environment variables for all secrets
- ✅ Rotate API keys regularly
- ✅ Implement rate limiting for production
- ✅ Monitor API usage and set spending limits
- ✅ Use read-only tokens where possible

## Known Limitations

- Single-guild focus (bot processes one server at a time)
- No noise cancellation (background noise may be transcribed)
- Text-based commands only (no slash commands yet)
- No user authentication/authorization beyond Discord permissions
- ElevenLabs has character limits based on your plan

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Slash commands support
- [ ] Multi-guild support
- [ ] Voice activity detection (VAD) for better speech detection
- [ ] User authentication and permissions
- [ ] Analytics dashboard
- [ ] Custom wake words
- [ ] Multiple language support
- [ ] Streaming TTS for lower latency
- [ ] Noise reduction and audio enhancement

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API library
- [OpenAI](https://openai.com/) - Whisper and ChatGPT APIs
- [ElevenLabs](https://elevenlabs.io/) - Text-to-speech API
- [FFmpeg](https://ffmpeg.org/) - Audio processing

## Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

**Made with ❤️ for Discord communities**
