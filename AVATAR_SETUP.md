# Discord Bot Avatar Setup Guide

The bot can now automatically change its avatar icon when switching between characters!

## How to Add Avatar URLs

1. **Upload your avatar images** to an image hosting service (recommended options):
   - [Imgur](https://imgur.com) - Free, no account required
   - Discord CDN - Upload to a Discord channel, right-click → Copy Link
   - [imgbb](https://imgbb.com) - Free image hosting
   - GitHub - Add to a public repo and use the raw URL

2. **Get the direct image URL** (must end in .png, .jpg, .jpeg, or .gif)

3. **Add the URLs to `src/characters.js`**:

```javascript
export const characters = {
    connor: {
        name: 'Connor',
        discordName: 'KomradKonnor',
        voiceId: 'lyiPMkdMbLt0nKed2Ykr',
        avatarUrl: 'https://i.imgur.com/YOUR_IMAGE.png', // Add your URL here
        // ... rest of config
    },
    
    elijah: {
        name: 'Elijah',
        discordName: 'QuantumEel',
        voiceId: 'yDWiHm0cihLY0TqsBrqL',
        avatarUrl: 'https://i.imgur.com/YOUR_IMAGE.png', // Add your URL here
        // ... rest of config
    },
    
    griffin: {
        name: 'Griffin',
        discordName: 'Fizz',
        voiceId: 'HJkmvRu5j8gO1ulxFDHa',
        avatarUrl: 'https://i.imgur.com/YOUR_IMAGE.png', // Add your URL here
        // ... rest of config
    },
};
```

## Image Requirements

- **Format**: PNG, JPG, JPEG, or GIF
- **Size**: At least 128x128 pixels (recommended: 512x512 or 1024x1024)
- **File size**: Under 10MB
- **Shape**: Square images work best (Discord will crop to circle)

## How It Works

When you switch characters using:
- `!character connor` (or elijah, griffin)
- Voice command: "Hey Connor" (or Elijah, Griffin)

The bot will automatically:
1. ✅ Change its nickname (e.g., "KomradKonnor")
2. ✅ Change its voice (ElevenLabs voice ID)
3. ✅ Change its personality (system prompt)
4. 🖼️ **Change its avatar** (if avatarUrl is provided)

## Discord API Rate Limits

⚠️ **Important**: Discord limits avatar changes to **2 times per hour** per bot.

If you switch characters too frequently, you may see:
```
Failed to change avatar: You are changing your avatar too fast. Try again later.
```

The bot will continue working normally - only the avatar change will be skipped.

## Testing

1. Add avatar URLs to your characters in `src/characters.js`
2. Restart the bot: `npm start`
3. Join voice channel: `!join`
4. Switch character: `!character elijah`
5. Check Discord - the bot's avatar should update!

## Troubleshooting

### Avatar not changing?
- Make sure the URL is a **direct image link** (ends in .png, .jpg, etc.)
- Test the URL in a browser - it should display the image directly
- Check console logs for error messages
- Verify you haven't hit Discord's 2/hour rate limit

### Using Discord CDN links?
Right-click on an image in Discord → "Copy Link" should give you a URL like:
```
https://cdn.discordapp.com/attachments/CHANNEL_ID/MESSAGE_ID/image.png
```

This will work as an avatarUrl!
