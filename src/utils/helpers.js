/**
 * Utility functions for audio processing
 */

/**
 * Convert milliseconds to human-readable time
 */
export function msToTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Calculate audio duration from buffer size
 */
export function calculateDuration(bufferSize, sampleRate, channels, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const totalSamples = bufferSize / (channels * bytesPerSample);
    const durationSeconds = totalSamples / sampleRate;
    return durationSeconds;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate audio buffer
 */
export function isValidAudioBuffer(buffer, minSize = 1000) {
    return buffer && Buffer.isBuffer(buffer) && buffer.length >= minSize;
}

/**
 * Sleep/delay utility
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const delay = baseDelay * Math.pow(2, i);
            console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
            await sleep(delay);
        }
    }
}

export default {
    msToTime,
    calculateDuration,
    formatBytes,
    isValidAudioBuffer,
    sleep,
    retry,
};
