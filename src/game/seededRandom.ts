/**
 * Create a seeded pseudo-random number generator using Linear Congruential Generator (LCG).
 * Both players with the same seed will get identical random sequences.
 *
 * @param seed - Initial seed value
 * @returns A function that returns the next random number between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    // LCG parameters (same as glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate a random seed from current time and random entropy
 */
export function generateSeed(): number {
  return Math.floor(Date.now() * Math.random()) & 0x7fffffff;
}
