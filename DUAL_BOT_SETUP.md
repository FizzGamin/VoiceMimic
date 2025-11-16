# Running Two VoiceMimic Bots Simultaneously

This guide shows you how to run two separate bot instances with different prefixes and personalities.

## Setup Instructions

### Step 1: Create a Second Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" 
3. Name it (e.g., "VoiceMimic Bot 2")
4. Go to "Bot" section → Click "Add Bot"
5. **Important**: Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent
6. Copy the bot token (under "Token" - click Reset Token if needed)
7. Copy the Application ID (from "General Information")

### Step 2: Invite Second Bot to Server

Use this URL (replace YOUR_CLIENT_ID with Application ID from step 1):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3165184&scope=bot
```

Permissions needed:
- View Channels
- Send Messages
- Connect
- Speak
- Use Voice Activity

### Step 3: Configure Bot 2 Environment

Edit `.env.bot2` file and add your second bot's credentials:

```env
DISCORD_TOKEN=YOUR_SECOND_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_SECOND_BOT_CLIENT_ID_HERE
BOT_PREFIX=@
```

**Note**: Bot 2 uses `@` prefix while Bot 1 uses `!` prefix.

### Step 4: Run Both Bots

**Open TWO separate PowerShell/Terminal windows:**

**Terminal 1 (Bot 1 with ! prefix):**
```powershell
cd C:\Users\Gri10\Documents\VoiceMimic\VoiceMimic
npm start
# OR
.\start-bot1.ps1
```

**Terminal 2 (Bot 2 with @ prefix):**
```powershell
cd C:\Users\Gri10\Documents\VoiceMimic\VoiceMimic
.\start-bot2.ps1
```

## Usage

Now you have two bots in the same voice channel:

### Bot 1 Commands (prefix: !)
- `!join` - Bot 1 joins voice channel
- `!leave` - Bot 1 leaves
- `!character connor` - Switch Bot 1 to Connor
- `!character elijah` - Switch Bot 1 to Elijah
- `!character griffin` - Switch Bot 1 to Griffin
- `!character garrett` - Switch Bot 1 to Garrett

### Bot 2 Commands (prefix: @)
- `@join` - Bot 2 joins voice channel
- `@leave` - Bot 2 leaves
- `@character connor` - Switch Bot 2 to Connor
- `@character elijah` - Switch Bot 2 to Elijah
- `@character griffin` - Switch Bot 2 to Griffin
- `@character garrett` - Switch Bot 2 to Garrett

### Voice Commands (Both Bots)
Both bots will respond to voice commands like:
- "Hey Connor"
- "Hey Elijah"
- "Hey Griffin"
- "Hey Garrett"

## Important Notes

⚠️ **Audio Conflicts**: 
- Both bots will hear all voice audio in the channel
- They might both try to respond at the same time
- The "no queue" system means only one can speak at a time per bot
- This creates interesting dynamics but can be chaotic!

💡 **Tip**: Start with different characters on each bot:
```
Bot 1: !join
Bot 1: !character connor

Bot 2: @join
Bot 2: @character elijah
```

🎭 **Character Switching**: When you say "Hey Connor", both bots will switch to Connor. To avoid this, you could manually set different characters via text commands.

## Stopping the Bots

Press `Ctrl+C` in each terminal window to stop each bot.

## Troubleshooting

**Bot 2 won't start?**
- Make sure you created a new bot application in Discord Developer Portal
- Verify the token in `.env.bot2` is correct
- Check that both bots have the required permissions

**Both bots responding to same command?**
- This is expected behavior - both bots will hear all messages
- Use different prefixes: `!` for Bot 1, `@` for Bot 2
- Or run them in different voice channels

**Audio overlapping?**
- Each bot checks if IT is speaking before responding
- But both bots can speak simultaneously if they both start processing different audio
- This is intentional for multi-bot conversations!

## Advanced: Different Temp Folders

To avoid temp file conflicts, you could modify each bot to use separate temp directories. Edit `src/services/ttsService.js` and `src/services/asrService.js` to use different temp folder names based on an environment variable.
