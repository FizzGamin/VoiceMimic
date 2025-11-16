import {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
} from '@discordjs/voice';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';

class AudioPlayer {
    constructor(connection) {
        this.connection = connection;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        this.isPlaying = false;

        // Subscribe the connection to the player
        this.connection.subscribe(this.player);

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log('🔇 Audio player is now idle');
            this.isPlaying = false;
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log('🔊 Audio player started playing');
            this.isPlaying = true;
        });

        this.player.on('error', (error) => {
            console.error('Audio player error:', error);
            this.isPlaying = false;
        });
    }

    /**
     * Play an audio file in the voice channel
     */
    async play(filePath, deleteAfterPlay = true) {
        try {
            console.log(`🎵 Playing audio file: ${filePath}`);

            const resource = createAudioResource(createReadStream(filePath), {
                inlineVolume: true,
            });

            // Set volume to 50% for better quality
            resource.volume?.setVolume(0.5);

            this.player.play(resource);

            // Delete file after playing if requested
            if (deleteAfterPlay) {
                this.player.once(AudioPlayerStatus.Idle, async () => {
                    try {
                        await unlink(filePath);
                        console.log(`🗑️  Deleted audio file: ${filePath}`);
                    } catch (error) {
                        console.error('Error deleting audio file:', error);
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Error playing audio:', error);
            return false;
        }
    }

    /**
     * Stop playing audio
     */
    stop() {
        this.player.stop();
        this.isPlaying = false;
        console.log('⏹️  Audio player stopped');
    }

    /**
     * Pause audio playback
     */
    pause() {
        if (this.isPlaying) {
            this.player.pause();
            console.log('⏸️  Audio player paused');
        }
    }

    /**
     * Resume audio playback
     */
    resume() {
        if (!this.isPlaying) {
            this.player.unpause();
            console.log('▶️  Audio player resumed');
        }
    }

    /**
     * Get current player status
     */
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            playerState: this.player.state.status,
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.player.stop(true);
        console.log('🛑 Audio player destroyed');
    }
}

export default AudioPlayer;
