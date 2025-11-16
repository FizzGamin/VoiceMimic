/**
 * Vocal Ticks/Quick Reactions
 * 
 * These are short, casual responses that the bot will randomly use
 * instead of generating a full AI response
 */

export const vocalTicks = [
    'L',
    'Lolz',
    'wetard alert',
    'kneegar',
    'join',
    'r.n.',
    'oh?',
    'im in',
    'bet',
    'fr',
    'bruh',
    'real',
    'ayyyyyyyyy',
    'sheeeeeeeeeeesh',
];

/**
 * Get a random vocal tick
 */
export function getRandomTick() {
    return vocalTicks[Math.floor(Math.random() * vocalTicks.length)];
}

/**
 * Check if should use a vocal tick instead of AI response
 * @param {number} chance - Probability (0-1) of using a tick
 */
export function shouldUseTick(chance = 0.1) {
    return Math.random() < chance;
}

export default vocalTicks;
