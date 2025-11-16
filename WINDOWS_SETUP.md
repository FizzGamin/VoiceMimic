# Windows Installation Guide

This guide will walk you through setting up the VoiceMimic Discord Bot on Windows.

## Prerequisites Installation

### 1. Install Node.js

1. Download Node.js from https://nodejs.org/
2. Choose the LTS version (18.x or higher)
3. Run the installer
4. Verify installation:
```powershell
node --version
npm --version
```

### 2. Install FFmpeg

**Option A: Using Chocolatey (Recommended)**
```powershell
# Install Chocolatey if you don't have it
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install FFmpeg
choco install ffmpeg
```

**Option B: Manual Installation**
1. Download FFmpeg from https://ffmpeg.org/download.html#build-windows
2. Extract to `C:\ffmpeg`
3. Add to PATH:
   - Open System Properties → Advanced → Environment Variables
   - Edit "Path" under System Variables
   - Add `C:\ffmpeg\bin`
4. Restart PowerShell/Terminal

**Verify FFmpeg installation:**
```powershell
ffmpeg -version
```

### 3. Install Git (Optional but recommended)

Download from https://git-scm.com/download/win

## Bot Setup

### 1. Download/Clone the Project

**If you have Git:**
```powershell
cd C:\Users\YourUsername\Documents
git clone https://github.com/yourusername/voicemimic-discord-bot.git
cd voicemimic-discord-bot
```

**Without Git:**
Download the ZIP from GitHub and extract it

### 2. Install Dependencies

```powershell
npm install
```

This may take a few minutes. If you see warnings about optional dependencies, that's normal.

**Common Issues:**
- If `sodium-native` fails to install, that's okay - it will use a fallback
- If `@discordjs/opus` fails, try: `npm install --build-from-source`

### 3. Run Setup Wizard

```powershell
npm run setup
```

This interactive wizard will create your `.env` file.

**Or manually create `.env`:**
```powershell
copy .env.example .env
notepad .env
```

Fill in your API keys (see below for how to get them).

## Getting Your API Keys

### Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "VoiceMimic Bot")
4. Go to "Bot" tab on the left
5. Click "Add Bot"
6. Under "Privileged Gateway Intents", enable:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
7. Click "Reset Token" to get your bot token
8. Copy the token (you won't be able to see it again!)
9. Also copy your Application ID from the "General Information" tab

### OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Click your profile → "View API keys"
4. Click "Create new secret key"
5. Copy the key immediately

**Cost**: ~$5 minimum deposit required. Pay-as-you-go pricing.

### ElevenLabs API Key

1. Go to https://elevenlabs.io/
2. Sign up (free tier available)
3. Go to your Profile Settings
4. Copy your API Key

**Find Voice ID:**
```powershell
npm run list-voices
```

Choose a voice and copy its ID.

## Invite Bot to Server

1. Go back to Discord Developer Portal
2. Go to your application → "OAuth2" → "URL Generator"
3. Select scopes:
   - ✅ bot
4. Select permissions:
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity
5. Copy the generated URL
6. Paste in your browser and invite to your server

**Or use this URL (replace YOUR_CLIENT_ID):**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3165184&scope=bot
```

## Running the Bot

### Development Mode (with auto-restart on code changes)
```powershell
npm run dev
```

### Production Mode
```powershell
npm start
```

### Run in Background (keeps running when you close terminal)
```powershell
# Install pm2
npm install -g pm2

# Start bot
pm2 start src/index.js --name voicemimic-bot

# View logs
pm2 logs voicemimic-bot

# Stop bot
pm2 stop voicemimic-bot

# Restart bot
pm2 restart voicemimic-bot
```

## Testing the Bot

1. Open Discord
2. Join a voice channel
3. In any text channel, type: `!join`
4. Start talking!
5. The bot should respond with voice
6. Type `!leave` when done

## Troubleshooting

### "Cannot find module X"
```powershell
npm install
```

### "FFmpeg not found"
- Verify installation: `ffmpeg -version`
- Restart your terminal/PowerShell
- Check PATH environment variable

### "Discord token invalid"
- Verify token in `.env` file
- Make sure there are no extra spaces or quotes
- Regenerate token if needed

### "Bot can't hear me"
- Check Discord bot permissions in server settings
- Verify Privileged Intents are enabled in Developer Portal
- Make sure you're not muted or deafened
- Try `!leave` and `!join` again

### "OpenAI quota exceeded"
- Check usage at https://platform.openai.com/usage
- Add billing information
- Wait for quota reset

### "ElevenLabs API error"
- Check API key is correct
- Verify you have characters remaining in your plan
- Check voice ID is valid

### Port/firewall issues
Windows Firewall may block Node.js. Click "Allow" when prompted.

## Keeping the Bot Running

### Option 1: pm2 (Recommended for always-on)
```powershell
npm install -g pm2
pm2 start src/index.js --name voicemimic-bot
pm2 save
pm2 startup
```

### Option 2: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At startup
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\path\to\voicemimic-discord-bot\src\index.js`
7. Start in: `C:\path\to\voicemimic-discord-bot`

### Option 3: NSSM (Non-Sucking Service Manager)
```powershell
# Download NSSM from https://nssm.cc/
choco install nssm

# Install as service
nssm install VoiceMimicBot "C:\Program Files\nodejs\node.exe" "C:\path\to\bot\src\index.js"
nssm start VoiceMimicBot
```

## Updating the Bot

```powershell
# Pull latest changes (if using git)
git pull

# Install any new dependencies
npm install

# Restart the bot
pm2 restart voicemimic-bot
# or just restart your terminal
```

## Performance Tips

1. **Close unnecessary programs** while bot is running
2. **Use wired internet** for better voice quality
3. **Keep Windows updated** for best compatibility
4. **Monitor RAM usage** - bot uses ~100-200MB typically
5. **Check temp folder** - should auto-clean, but verify occasionally

## Firewall Configuration

If the bot has connection issues:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" or add it manually
4. Allow both Private and Public networks

## Next Steps

- Read README.md for detailed usage
- Customize the bot's personality in `.env`
- Join a test voice channel and experiment
- Monitor API costs on respective platforms
- Check logs for any errors

## Getting Help

1. Check this guide and README.md
2. Verify all prerequisites are installed correctly
3. Check console logs for specific errors
4. Search GitHub issues
5. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your Windows version
   - Node.js version

## Security Reminders

- ✅ Keep `.env` file private
- ✅ Never share your API keys
- ✅ Don't commit `.env` to Git
- ✅ Use `.gitignore` (already configured)
- ✅ Rotate keys if accidentally exposed

---

**Need more help?** Check the other documentation files:
- `README.md` - Full documentation
- `QUICKSTART.md` - Quick start guide  
- `PROJECT_OVERVIEW.md` - Technical architecture
