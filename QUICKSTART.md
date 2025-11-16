# Quick Start Guide

## 1. Install Dependencies

```powershell
npm install
```

## 2. Setup Environment

```powershell
# Copy example environment file
cp .env.example .env
```

Then edit `.env` with your API keys.

## 3. Get Your API Keys

### Discord Bot Token
1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to "Bot" → "Add Bot"
4. Copy the token

### OpenAI API Key
1. Go to https://platform.openai.com/
2. Navigate to API Keys
3. Create a new key

### ElevenLabs API Key & Voice ID
1. Go to https://elevenlabs.io/
2. Sign up and copy your API key
3. Run `node scripts/listVoices.js` to see available voices
4. Copy your preferred Voice ID

## 4. Invite Bot to Your Server

Replace `YOUR_CLIENT_ID` with your Discord Application ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3165184&scope=bot
```

## 5. Run the Bot

```powershell
npm start
```

## 6. Use the Bot

1. Join a voice channel in Discord
2. Type `!join` in any text channel
3. Start talking!
4. Type `!leave` when done

## Troubleshooting

### "FFmpeg not found"
Install FFmpeg:
```powershell
choco install ffmpeg
```

### "Invalid API Key"
- Check your `.env` file has the correct keys
- Make sure there are no extra spaces
- Verify keys are active on respective platforms

### "Bot can't hear me"
- Check Discord bot permissions (Connect, Speak, Use Voice Activity)
- Enable Privileged Gateway Intents in Discord Developer Portal
- Make sure you're not muted/deafened

### "API quota exceeded"
- Check usage at platform.openai.com/usage
- Check ElevenLabs character limits
- Consider using gpt-3.5-turbo instead of gpt-4

## Configuration Tips

Edit `.env` to customize:

```env
# Use faster/cheaper model
AI_MODEL=gpt-3.5-turbo

# Custom bot personality
AI_SYSTEM_PROMPT=You are a friendly robot assistant. Keep responses very short.

# Change command prefix
BOT_PREFIX=?
```

## Next Steps

- Read the full README.md for advanced features
- Customize voice settings in `src/services/ttsService.js`
- Adjust conversation history length in `src/services/llmService.js`
- Monitor your API usage to manage costs

## Support

For issues, check:
1. README.md troubleshooting section
2. GitHub issues
3. API status pages (Discord, OpenAI, ElevenLabs)
