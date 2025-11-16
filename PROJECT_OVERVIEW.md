# VoiceMimic Discord Bot - Project Overview

## What This Bot Does

This Discord bot creates an AI voice assistant that can:
- **Listen** to users speaking in Discord voice channels
- **Understand** what they say using speech recognition
- **Think** and generate intelligent responses using AI
- **Speak** back to users with natural-sounding voice

## The Complete Pipeline

```
User speaks → Discord captures audio → Bot receives audio →
Whisper transcribes → ChatGPT generates response →
ElevenLabs creates voice → Bot plays audio → User hears response
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Platform | Node.js 18+ | Runtime environment |
| Discord API | discord.js v14 | Bot framework |
| Voice Handling | @discordjs/voice | Voice connections |
| Audio Processing | FFmpeg, prism-media | Audio encoding/decoding |
| Speech-to-Text | OpenAI Whisper | Transcription |
| AI Brain | OpenAI GPT-4/3.5 | Response generation |
| Text-to-Speech | ElevenLabs | Voice synthesis |

## Project Structure Explained

```
VoiceMimic/
│
├── src/
│   ├── index.js                    # Main bot entry point
│   │                                 - Initializes Discord client
│   │                                 - Handles commands (!join, !leave)
│   │                                 - Manages bot lifecycle
│   │
│   ├── config.js                   # Configuration loader
│   │                                 - Loads environment variables
│   │                                 - Provides typed config
│   │
│   ├── services/
│   │   ├── voiceReceiver.js        # Captures audio from Discord
│   │   │                             - Subscribes to user voice streams
│   │   │                             - Decodes Opus to PCM
│   │   │                             - Detects silence/end of speech
│   │   │
│   │   ├── asrService.js           # Speech-to-text
│   │   │                             - Converts PCM to WAV
│   │   │                             - Calls OpenAI Whisper API
│   │   │                             - Returns transcribed text
│   │   │
│   │   ├── llmService.js           # AI response generation
│   │   │                             - Manages conversation history
│   │   │                             - Calls ChatGPT API
│   │   │                             - Generates contextual responses
│   │   │
│   │   ├── ttsService.js           # Text-to-speech
│   │   │                             - Calls ElevenLabs API
│   │   │                             - Downloads audio files
│   │   │                             - Handles voice settings
│   │   │
│   │   ├── audioPlayer.js          # Plays audio in Discord
│   │   │                             - Creates audio resources
│   │   │                             - Manages playback queue
│   │   │                             - Handles cleanup
│   │   │
│   │   └── conversationManager.js  # Orchestrates everything
│   │                                 - Connects all services
│   │                                 - Manages the full pipeline
│   │                                 - Handles errors
│   │
│   └── utils/
│       └── helpers.js              # Utility functions
│
├── scripts/
│   ├── setup.js                    # Interactive setup wizard
│   └── listVoices.js               # List ElevenLabs voices
│
├── temp/                           # Auto-generated temporary audio files
│
├── .env                            # Your configuration (DO NOT COMMIT)
├── .env.example                    # Configuration template
├── package.json                    # Dependencies and scripts
├── README.md                       # Full documentation
├── QUICKSTART.md                   # Quick start guide
└── LICENSE                         # MIT License

```

## How Each Service Works

### 1. Voice Receiver (`voiceReceiver.js`)
- Listens for "speaking" events from Discord
- Creates audio stream for each user
- Decodes Opus codec to raw PCM audio
- Buffers audio until silence detected
- Emits complete audio chunks for processing

### 2. ASR Service (`asrService.js`)
- Receives PCM audio buffer
- Converts stereo to mono
- Adds WAV headers
- Uploads to OpenAI Whisper
- Returns transcribed text

### 3. LLM Service (`llmService.js`)
- Maintains per-user conversation history
- Adds context from previous messages
- Calls ChatGPT with conversation context
- Returns AI-generated response
- Limits history to prevent token overflow

### 4. TTS Service (`ttsService.js`)
- Takes text response
- Calls ElevenLabs API with voice settings
- Downloads MP3 audio
- Saves to temporary file
- Returns file path

### 5. Audio Player (`audioPlayer.js`)
- Creates Discord audio resource from file
- Encodes to Opus format
- Plays in voice channel
- Manages playback queue
- Cleans up files after playing

### 6. Conversation Manager (`conversationManager.js`)
- Coordinates all services
- Receives audio → ASR → LLM → TTS → Player
- Handles errors gracefully
- Prevents multiple simultaneous processing per user
- Manages cleanup

## Data Flow Example

1. **User says**: "What's the weather like?"

2. **Voice Receiver**: Captures 3 seconds of audio (PCM buffer)

3. **ASR Service**: 
   - Converts to WAV
   - Sends to Whisper
   - Returns: "What's the weather like?"

4. **LLM Service**:
   - Adds to conversation history
   - Sends to ChatGPT with context
   - Returns: "I don't have access to real-time weather data, but I can help you with other questions!"

5. **TTS Service**:
   - Sends text to ElevenLabs
   - Downloads audio
   - Returns: `/temp/tts_1234567890.mp3`

6. **Audio Player**:
   - Loads audio file
   - Encodes to Opus
   - Plays in Discord
   - Deletes temp file

## Key Features

### Conversation Memory
- Each user has their own conversation history
- Bot remembers context from previous messages
- History limited to last 10 messages to manage tokens

### Audio Quality
- 48kHz sample rate (Discord standard)
- Opus codec for efficient transmission
- Automatic volume adjustment

### Error Handling
- Graceful degradation on API failures
- Fallback responses
- Automatic cleanup of temp files
- User feedback on errors

### Performance
- Per-user processing to avoid conflicts
- Audio queueing to prevent overlaps
- Automatic file cleanup
- Efficient buffer management

## Configuration Options

All configurable via `.env`:

```env
# Discord
DISCORD_TOKEN=             # Your bot token
DISCORD_CLIENT_ID=         # Your application ID

# OpenAI
OPENAI_API_KEY=            # For Whisper + ChatGPT
AI_MODEL=                  # gpt-4-turbo-preview or gpt-3.5-turbo
AI_SYSTEM_PROMPT=          # Bot personality

# ElevenLabs
ELEVENLABS_API_KEY=        # Your API key
ELEVENLABS_VOICE_ID=       # Choose from 100+ voices

# Audio
SAMPLE_RATE=48000          # Discord uses 48kHz
CHANNELS=2                 # Stereo
MAX_RECORDING_DURATION=    # Max voice capture time (ms)
SILENCE_THRESHOLD=         # Silence detection (ms)
```

## API Costs

Estimated costs for 1 hour of active conversation:

| Service | Usage | Cost |
|---------|-------|------|
| Whisper | ~60 min audio | ~$0.36 |
| GPT-4 | ~100 responses | ~$2.00 |
| GPT-3.5 | ~100 responses | ~$0.15 |
| ElevenLabs | ~5000 chars | ~$1.50 |
| **Total (GPT-4)** | | **~$3.86** |
| **Total (GPT-3.5)** | | **~$2.01** |

## Security Considerations

- Never commit `.env` to version control
- Use read-only API keys where possible
- Implement rate limiting for production
- Monitor API usage regularly
- Set spending limits on API platforms

## Extending the Bot

### Add New Commands
Edit `src/index.js` and add new command handlers

### Change AI Personality
Modify `AI_SYSTEM_PROMPT` in `.env`

### Adjust Voice Settings
Edit voice_settings in `src/services/ttsService.js`

### Add Custom Features
- Wake word detection
- Multi-language support
- Voice cloning
- Custom models
- Analytics dashboard

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Bot can't hear users | Enable voice receive permissions, check intents |
| Poor transcription | Check audio quality, adjust silence threshold |
| Slow responses | Use gpt-3.5-turbo, reduce max_tokens |
| High costs | Implement cooldowns, use cheaper models |
| Audio playback issues | Check FFmpeg installation, verify audio format |

## Development Tips

1. **Test locally first**: Use development mode with `npm run dev`
2. **Monitor console**: All services log their actions
3. **Check temp folder**: Verify audio files are being created/deleted
4. **Use list-voices script**: Find the perfect voice for your bot
5. **Start with short responses**: Keep max_tokens low initially
6. **Test with one user**: Before inviting others

## Production Checklist

- [ ] All API keys configured
- [ ] FFmpeg installed
- [ ] Bot invited with correct permissions
- [ ] Intents enabled in Discord portal
- [ ] Rate limiting implemented
- [ ] Error logging setup
- [ ] Cost monitoring enabled
- [ ] Backup configuration saved
- [ ] Documentation updated
- [ ] Test in private server first

## Resources

- [Discord.js Guide](https://discordjs.guide/)
- [OpenAI Documentation](https://platform.openai.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## Support

- Check README.md for detailed setup
- See QUICKSTART.md for fast setup
- Review this file for architecture understanding
- Open GitHub issues for bugs
- Check API status pages for outages

---

**Built with**: Node.js, Discord.js, OpenAI, ElevenLabs, and FFmpeg

**License**: MIT

**Version**: 1.0.0
