import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ResponseLock {
    constructor() {
        this.lockDir = path.join(path.dirname(__dirname), '..', 'temp');
        this.lockFile = path.join(this.lockDir, 'response.lock');

        // Ensure temp directory exists
        if (!fs.existsSync(this.lockDir)) {
            fs.mkdirSync(this.lockDir, { recursive: true });
        }
    }

    /**
     * Safely read lock file with error handling
     */
    _readLock() {
        try {
            if (!fs.existsSync(this.lockFile)) {
                return null;
            }
            const content = fs.readFileSync(this.lockFile, 'utf8').trim();
            if (!content) {
                return null;
            }
            return JSON.parse(content);
        } catch (error) {
            // Corrupted lock file, delete it
            console.warn('⚠️ Corrupted lock file detected, cleaning up...');
            try {
                fs.unlinkSync(this.lockFile);
            } catch (e) {
                // Ignore
            }
            return null;
        }
    }

    /**
     * Try to acquire the lock for responding to a user
     * Returns true if lock acquired, false if another bot has it
     */
    tryAcquire(userId, botId) {
        try {
            // Check if lock file exists
            const existingLock = this._readLock();

            if (existingLock) {
                // If lock is for this user and still valid (within 10 seconds)
                if (existingLock.userId === userId && (Date.now() - existingLock.timestamp) < 10000) {
                    // Another bot is processing this user
                    return false;
                }
                // Stale lock, delete it
                try {
                    fs.unlinkSync(this.lockFile);
                } catch (e) {
                    // Ignore
                }
            }

            // Add random delay (0-200ms) to make it truly random who wins
            const randomDelay = Math.random() * 200;

            // Small delay before attempting to acquire
            const start = Date.now();
            while (Date.now() - start < randomDelay) {
                // Busy wait
            }

            // Create lock file atomically using 'wx' flag (fails if file exists)
            const lockData = {
                userId,
                botId,
                timestamp: Date.now()
            };

            try {
                // Try to create file exclusively (fails if exists)
                fs.writeFileSync(this.lockFile, JSON.stringify(lockData), { flag: 'wx' });
                // Successfully acquired lock
                return true;
            } catch (error) {
                if (error.code === 'EEXIST') {
                    // Another bot got the lock first
                    return false;
                }
                // Some other error, try normal write as fallback
                fs.writeFileSync(this.lockFile, JSON.stringify(lockData));

                // Verify we have the lock
                const currentLock = this._readLock();
                return currentLock && currentLock.botId === botId && currentLock.userId === userId;
            }
        } catch (error) {
            console.error('Error acquiring lock:', error);
            return false;
        }
    }

    /**
     * Release the lock
     */
    release(userId, botId) {
        try {
            const lockData = this._readLock();

            if (lockData) {
                // Only release if we own the lock
                if (lockData.botId === botId && lockData.userId === userId) {
                    fs.unlinkSync(this.lockFile);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error releasing lock:', error);
            // Force delete if we can't read it
            try {
                fs.unlinkSync(this.lockFile);
            } catch (e) {
                // Ignore
            }
            return false;
        }
    }

    /**
     * Clean up stale locks (older than 10 seconds)
     */
    cleanStale() {
        try {
            const lockData = this._readLock();

            if (lockData && (Date.now() - lockData.timestamp > 10000)) {
                fs.unlinkSync(this.lockFile);
                console.log('🧹 Cleaned stale response lock');
            }
        } catch (error) {
            console.error('Error cleaning stale lock:', error);
        }
    }
}

export default ResponseLock;
