# Troubleshooting Guide

Common issues and solutions for VoiceMimic Discord Bot.

## Table of Contents
- [Installation Issues](#installation-issues)
- [Connection Issues](#connection-issues)
- [Audio Issues](#audio-issues)
- [API Issues](#api-issues)
- [Performance Issues](#performance-issues)

---

## Installation Issues

### npm install fails

**Error: Cannot find module**
```powershell
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install
```

**Error: node-gyp fails (Windows)**
```powershell
# Install build tools
npm install --global windows-build-tools
npm install
```

**Error: Permission denied (Linux/Mac)**
```bash
# Don't use sudo! Fix npm permissions instead
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add to PATH: export PATH=~/.npm-global/bin:$PATH
npm install
```

### FFmpeg not found

**Windows:**
```powershell
# Verify installation
ffmpeg -version

# If not found, install with Chocolatey
choco install ffmpeg

# Or add to PATH manually
# System Properties → Environment Variables → Path → Add: C:\ffmpeg\bin
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

---

## Connection Issues

### Bot won't connect to Discord

**Error: "Invalid token"**
- Check `.env` file has correct `DISCORD_TOKEN`
- Remove any quotes or spaces around token
- Regenerate token in Discord Developer Portal
- Ensure no extra newlines in `.env`

**Error: "Missing intents"**
1. Go to Discord Developer Portal
2. Your Application → Bot
3. Enable Privileged Gateway Intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Save changes
5. Restart bot

**Error: "Disallowed intents"**
Your bot needs verification for intents if in 100+ servers.
Apply for verification in Discord Developer Portal.

### Bot joins but immediately disconnects

**Check voice permissions:**
1. Server Settings → Roles
2. Find your bot's role
3. Enable:
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity

**Check channel permissions:**
1. Right-click voice channel → Edit Channel
2. Permissions → Your bot's role
3. Allow: Connect, Speak, Use Voice Activity

**Network issues:**
```javascript
// Check connection status in logs
// Should see: "✅ Logged in as BotName"
// If you see reconnection attempts, it's a network issue
```

---

## Audio Issues

### Bot can't hear users

**1. Check intents (most common):**
Discord Developer Portal → Bot → Privileged Gateway Intents

**2. Check self_deaf setting:**
In `src/index.js`, verify:
```javascript
const connection = joinVoiceChannel({
  // ...
  selfDeaf: false,  // Must be false to hear!
  selfMute: false,
});
```

**3. Check user isn't muted:**
- User must not be server muted
- User must not be self-muted
- User must have "Use Voice Activity" enabled

**4. Verify Discord permissions:**
Bot needs "Use Voice Activity" permission in the channel.

### Bot doesn't speak back

**Check speaker permissions:**
```
Server Settings → Roles → Bot Role → Speak ✅
```

**Check audio player:**
```javascript
// Look for these in console:
// "🔊 Audio player started playing" - Good!
// If missing, audio isn't being played
```

**FFmpeg issues:**
```powershell
# Verify FFmpeg is accessible
ffmpeg -version

# Check logs for FFmpeg errors
# Look for: "Error playing audio"
```

### Poor audio quality

**Adjust volume in audioPlayer.js:**
```javascript
resource.volume?.setVolume(0.5); // Try 0.3 to 0.8
```

**Check internet connection:**
- Bot needs stable connection
- Test with: `ping discord.com -t`

**Adjust sample rate:**
Discord uses 48kHz, don't change unless necessary.

### Echo or feedback

**User's mic is picking up bot:**
- Users should use headphones
- Reduce bot volume
- Use Push-to-Talk instead of Voice Activity

**Bot picking up itself:**
Not possible - bot has `selfDeaf: false` but doesn't capture its own output.

---

## API Issues

### OpenAI Errors

**Error: "Invalid API key"**
```env
# Check .env file
OPENAI_API_KEY=sk-...  # Must start with sk-
```
Verify at: https://platform.openai.com/api-keys

**Error: "Rate limit exceeded"**
```javascript
// Add retry logic (already implemented in helpers.js)
// Or reduce usage:
// - Longer silence threshold
// - Lower max_tokens
// - Add cooldown between requests
```

**Error: "Insufficient quota"**
1. Go to https://platform.openai.com/account/billing
2. Add payment method
3. Add credits ($5 minimum)
4. Wait a few minutes for activation

**Slow transcription:**
- Whisper can take 2-5 seconds per request
- This is normal
- Can't be avoided without self-hosting Whisper

**Error: "Audio file too short"**
Whisper requires at least 0.1 seconds. Check:
```javascript
// In asrService.js
const minSamples = 48000 * 2 * 0.5; // Increase 0.5 to 1.0
```

### ElevenLabs Errors

**Error: "Invalid API key"**
```env
ELEVENLABS_API_KEY=...  # Copy from elevenlabs.io profile
```

**Error: "Invalid voice_id"**
```powershell
# List available voices
npm run list-voices

# Copy a valid voice ID to .env
```

**Error: "Quota exceeded"**
- Free tier: 10,000 characters/month
- Check usage: https://elevenlabs.io/
- Upgrade plan or wait for reset

**Slow TTS generation:**
- ElevenLabs can take 1-3 seconds
- Use shorter responses
- Consider using streaming API (advanced)

**Error: "Model not found"**
Change model in ttsService.js:
```javascript
model_id: 'eleven_monolingual_v1',  // or 'eleven_multilingual_v2'
```

### ChatGPT Errors

**Error: "Model not found"**
```env
# Use available model
AI_MODEL=gpt-3.5-turbo  # Cheaper, faster
# Or
AI_MODEL=gpt-4-turbo-preview  # Better quality
```

**Responses too long:**
```javascript
// In llmService.js, reduce max_tokens
max_tokens: 150,  // Reduce to 50-100 for shorter responses
```

**Response too slow:**
- Use gpt-3.5-turbo instead of gpt-4
- Reduce max_tokens
- Simplify system prompt

**Out of context:**
Bot might have lost conversation history:
```javascript
// Check maxHistoryLength in llmService.js
this.maxHistoryLength = 10;  // Increase if needed
```

---

## Performance Issues

### High CPU usage

**Normal usage: 5-15%**
**During processing: 20-40%**

If constantly high:
1. Check for infinite loops in logs
2. Restart bot: `pm2 restart voicemimic-bot`
3. Check for memory leaks

### High memory usage

**Normal: 100-200MB**
**Per active conversation: +50MB**

If constantly increasing:
1. Check temp file cleanup
2. Verify conversation history limits
3. Restart bot periodically

**Force garbage collection:**
```powershell
node --expose-gc src/index.js
```

### Bot responds slowly

**Expected latency: 5-10 seconds**
- ASR: 2-3 seconds
- LLM: 1-3 seconds
- TTS: 1-2 seconds
- Playback: 1-2 seconds

**Reduce latency:**
1. Use gpt-3.5-turbo
2. Reduce max_tokens (50-100)
3. Use shorter system prompts
4. Decrease silence threshold
5. Consider ElevenLabs streaming

### Temp files accumulating

**Auto-cleanup every 30 minutes**

Manual cleanup:
```powershell
# Delete old temp files
cd temp
rm *.wav *.mp3
```

**Check cleanup in conversationManager.js:**
```javascript
this.cleanupInterval = setInterval(() => {
  this.asrService.cleanupTempFiles();
  this.ttsService.cleanupTempFiles();
}, 1800000); // 30 minutes
```

---

## Error Messages Decoded

### "Error: ENOENT"
File or directory not found. Check paths in config.

### "Error: ECONNREFUSED"
Network connection failed. Check internet or API status.

### "Error: ETIMEDOUT"
Request took too long. Check internet connection.

### "Error: EADDRINUSE"
Port already in use. Kill existing process or use different port.

### "UnhandledPromiseRejectionWarning"
Uncaught async error. Check logs above for actual error.

### "DeprecationWarning"
Old API usage. Usually safe to ignore, but update dependencies eventually.

---

## Debugging Tips

### Enable debug logging

**Discord.js debug:**
```javascript
// In index.js
const client = new Client({
  intents: [...],
  // Add this:
  rest: { version: '10' },
  // Enable debug events:
});

client.on('debug', console.log);
```

**Check all logs:**
```powershell
# Run bot and save logs
npm start 2>&1 | tee bot.log
```

### Test individual components

**Test OpenAI:**
```javascript
// scripts/testOpenAI.js
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: 'your-key' });
const test = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }]
});
console.log(test.choices[0].message);
```

**Test ElevenLabs:**
```powershell
npm run list-voices
```

**Test Discord connection:**
```javascript
// Simplify index.js to just login
client.once('ready', () => console.log('Connected!'));
client.login(token);
```

### Monitor resources

**Windows:**
```powershell
# Open Task Manager
# Look for "Node.js JavaScript Runtime"
# Check CPU, Memory, Network
```

**PM2 monitoring:**
```powershell
pm2 monit
```

---

## Getting Help

### Before asking for help:

1. ✅ Check this troubleshooting guide
2. ✅ Read error messages carefully
3. ✅ Check console logs
4. ✅ Verify all API keys are correct
5. ✅ Try restarting the bot
6. ✅ Search existing GitHub issues

### When creating an issue:

Include:
- Error message (full stack trace)
- Steps to reproduce
- Your setup (OS, Node version)
- Relevant code snippets
- What you've tried already

```powershell
# Get system info
node --version
npm --version
ffmpeg -version
```

### Useful links:

- Discord.js Guide: https://discordjs.guide/
- OpenAI Status: https://status.openai.com/
- Discord Status: https://discordstatus.com/
- ElevenLabs Status: Check their website

---

## Still stuck?

1. Review logs carefully
2. Enable debug mode
3. Test components individually
4. Check API status pages
5. Create detailed GitHub issue

**Remember:** Most issues are:
- Missing API keys
- Wrong Discord intents
- FFmpeg not in PATH
- Permission issues

Double-check these first! 🔍
