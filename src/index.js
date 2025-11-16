import { Client, GatewayIntentBits } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import config from './config.js';
import VoiceReceiver from './services/voiceReceiver.js';
import AudioPlayer from './services/audioPlayer.js';
import ConversationManager from './services/conversationManager.js';

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
            const conversationManager = new ConversationManager(voiceReceiver, audioPlayer);

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

    async handleHelpCommand(message) {
        const helpText = `
**VoiceMimic Bot Commands**

\`${config.discord.prefix}join\` - Join your current voice channel
\`${config.discord.prefix}leave\` - Leave the voice channel
\`${config.discord.prefix}help\` - Show this help message

**How it works:**
1. Join a voice channel
2. Use \`!join\` to bring the bot into your channel
3. Start speaking! The bot will:
   - Listen to your voice
   - Transcribe what you say
   - Generate an AI response
   - Speak back to you with ElevenLabs voice

**Note:** The bot needs proper permissions to join voice channels and speak.
    `;

        await message.reply(helpText);
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
