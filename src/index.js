import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import config from './config.js';
import VoiceReceiver from './services/voiceReceiver.js';
import AudioPlayer from './services/audioPlayer.js';
import ConversationManager from './services/conversationManager.js';
import { getCharacter, listCharacters } from './characters.js';

class VoiceMimicBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        this.voiceConnections = new Map();
        this.conversationManagers = new Map();

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.once('ready', () => {
            console.log(`✅ Logged in as ${this.client.user.tag}`);
            console.log(`🎤 Voice AI Bot is ready!`);
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            if (!message.content.startsWith(config.discord.prefix)) return;

            const args = message.content.slice(config.discord.prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            try {
                switch (command) {
                    case 'join':
                        await this.handleJoinCommand(message);
                        break;
                    case 'leave':
                        await this.handleLeaveCommand(message);
                        break;
                    case 'character':
                    case 'char':
                        await this.handleCharacterCommand(message, args);
                        break;
                    case 'chat':
                        await this.handleChatCommand(message, args);
                        break;
                    case 'talkback':
                        await this.handleTalkbackCommand(message, args);
                        break;
                    case 'copycat':
                        await this.handleCopycatCommand(message, args);
                        break;
                    case 'help':
                        await this.handleHelpCommand(message);
                        break;
                    default:
                        await message.reply('Unknown command. Use `!help` for available commands.');
                }
            } catch (error) {
                console.error(`Error handling command ${command}:`, error);
                await message.reply('An error occurred while processing your command.');
            }
        });

        this.client.on('error', (error) => {
            console.error('Discord client error:', error);
        });
    }

    async handleJoinCommand(message) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            await message.reply('❌ You need to be in a voice channel first!');
            return;
        }

        if (this.voiceConnections.has(message.guild.id)) {
            await message.reply('⚠️ I\'m already in a voice channel in this server!');
            return;
        }

        try {
            await message.reply('🔗 Joining voice channel...');

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            // Wait for connection to be ready
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

            // Initialize components
            const voiceReceiver = new VoiceReceiver(connection);
            const audioPlayer = new AudioPlayer(connection);
            const defaultChar = config.discord.defaultCharacter || 'connor';
            const conversationManager = new ConversationManager(
                voiceReceiver,
                audioPlayer,
                defaultChar,
                message.guild,
                this.client // Pass bot client for avatar changes
            );

            this.voiceConnections.set(message.guild.id, {
                connection,
                voiceReceiver,
                audioPlayer,
                channelId: voiceChannel.id,
            });

            this.conversationManagers.set(message.guild.id, conversationManager);

            // Start listening
            await conversationManager.start();

            await message.reply(`✅ Joined ${voiceChannel.name} and ready to listen!`);

            // Handle disconnection
            connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (error) {
                    connection.destroy();
                    this.cleanup(message.guild.id);
                }
            });
        } catch (error) {
            console.error('Error joining voice channel:', error);
            await message.reply('❌ Failed to join voice channel. Make sure I have the proper permissions!');
        }
    }

    async handleLeaveCommand(message) {
        const guildData = this.voiceConnections.get(message.guild.id);

        if (!guildData) {
            await message.reply('❌ I\'m not in a voice channel!');
            return;
        }

        try {
            const conversationManager = this.conversationManagers.get(message.guild.id);
            if (conversationManager) {
                await conversationManager.stop();
            }

            guildData.connection.destroy();
            this.cleanup(message.guild.id);

            await message.reply('👋 Left the voice channel!');
        } catch (error) {
            console.error('Error leaving voice channel:', error);
            await message.reply('❌ Error leaving voice channel.');
        }
    }

    async handleChatCommand(message, args) {
        const manager = this.conversationManagers.get(message.guild.id);

        if (!manager) {
            await message.reply('❌ I need to be in a voice channel first! Use `!join`');
            return;
        }

        if (args.length === 0) {
            await message.reply('❌ Please provide text to speak. Usage: `!chat <text>`');
            return;
        }

        const textToSpeak = args.join(' ');

        try {
            await manager.speakText(textToSpeak);
            await message.react('✅');
        } catch (error) {
            console.error('Error in chat command:', error);
            await message.reply('❌ Failed to speak the text.');
        }
    }

    async handleTalkbackCommand(message, args) {
        const manager = this.conversationManagers.get(message.guild.id);

        if (!manager) {
            await message.reply('❌ I need to be in a voice channel first! Use `!join`');
            return;
        }

        if (args.length === 0) {
            const status = manager.isTalkbackEnabled() ? 'enabled' : 'disabled';
            await message.reply(`🔊 Talkback is currently **${status}**. Use \`!talkback enable\` or \`!talkback disable\`.`);
            return;
        }

        const action = args[0].toLowerCase();

        if (action === 'enable' || action === 'on') {
            manager.enableTalkback();
            await message.reply('✅ Talkback enabled - bot will respond to voice');
        } else if (action === 'disable' || action === 'off') {
            manager.disableTalkback();
            await message.reply('✅ Talkback disabled - bot will only respond to !chat');
        } else {
            await message.reply('❌ Invalid option. Use `!talkback enable` or `!talkback disable`');
        }
    }

    async handleCopycatCommand(message, args) {
        const manager = this.conversationManagers.get(message.guild.id);

        if (!manager) {
            await message.reply('❌ I need to be in a voice channel first! Use `!join`');
            return;
        }

        if (args.length === 0) {
            const status = manager.isCopycatEnabled() ? 'enabled' : 'disabled';
            await message.reply(`🔁 Copycat mode is currently **${status}**. Use \`!copycat enable\` or \`!copycat disable\`.`);
            return;
        }

        const action = args[0].toLowerCase();

        if (action === 'enable' || action === 'on') {
            manager.enableCopycat();
            await message.reply('✅ Copycat mode enabled - bot will repeat everything it hears');
        } else if (action === 'disable' || action === 'off') {
            manager.disableCopycat();
            await message.reply('✅ Copycat mode disabled');
        } else {
            await message.reply('❌ Invalid option. Use `!copycat enable` or `!copycat disable`');
        }
    }

    async handleHelpCommand(message) {
        const helpText = `
**VoiceMimic Bot Commands**

\`${config.discord.prefix}join\` - Join your current voice channel
\`${config.discord.prefix}leave\` - Leave the voice channel
\`${config.discord.prefix}character <name>\` - Switch bot personality (connor, elijah, or griffin)
\`${config.discord.prefix}character list\` - List all available characters
\`${config.discord.prefix}chat <text>\` - Make the bot speak your text
\`${config.discord.prefix}talkback <enable|disable>\` - Enable/disable voice responses (disabled by default)
\`${config.discord.prefix}copycat <enable|disable>\` - Enable/disable copycat mode (repeats everything)
\`${config.discord.prefix}help\` - Show this help message

**Modes:**
- **Default**: Only responds to \`!chat\` commands
- **Talkback**: Bot generates AI responses to voice
- **Copycat**: Bot repeats exactly what it hears

**How it works:**
1. Join a voice channel
2. Use \`!join\` to bring the bot into your channel
3. Use \`!chat <text>\` to make the bot speak anything you want
4. Use \`!copycat enable\` to make bot repeat what you say
5. Use \`!talkback enable\` for AI-generated responses

**Note:** The bot needs proper permissions to join voice channels and speak.
    `;

        await message.reply(helpText);
    }

    async handleCharacterCommand(message, args) {
        const manager = this.conversationManagers.get(message.guild.id);

        if (!manager) {
            await message.reply('❌ I need to be in a voice channel first! Use `!join`');
            return;
        }

        if (args.length === 0 || args[0] === 'list') {
            const chars = listCharacters();
            const charList = chars.map(c => `• **${c.name}** (ID: \`${c.id}\`)`).join('\n');
            await message.reply(`**Available Characters:**\n${charList}\n\nUse \`!character <name>\` to switch.`);
            return;
        }

        const characterName = args[0].toLowerCase();
        const character = getCharacter(characterName);

        if (!character) {
            await message.reply(`❌ Character "${characterName}" not found. Use \`!character list\` to see all characters.`);
            return;
        }

        // Update the manager with new character
        await manager.setCharacter(character);

        await message.reply(`✅ Switched to **${character.name}**! 🎭`);
    }

    cleanup(guildId) {
        this.voiceConnections.delete(guildId);
        this.conversationManagers.delete(guildId);
        console.log(`Cleaned up resources for guild ${guildId}`);
    }

    async start() {
        try {
            await this.client.login(config.discord.token);
        } catch (error) {
            console.error('Failed to login:', error);
            process.exit(1);
        }
    }
}

// Start the bot
const bot = new VoiceMimicBot();
bot.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏸️  Shutting down gracefully...');
    bot.client.destroy();
    process.exit(0);
});

export default VoiceMimicBot;
