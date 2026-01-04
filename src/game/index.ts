// Elimination
export {
  findEliminationIndices,
  eliminateMatches,
  processElimination,
  checkOverflow,
  getDigitCount,
  generateInitialState,
} from './elimination';

// Scoring
export { calculateScore, shouldTriggerAttack } from './scoring';

// Attack
export { calculateAttackEffect } from './attack';

// Prediction
export { generatePrediction, generateAttackPredictions } from './prediction';

// Battle Prediction (seeded)
export { createBattlePredictionGenerator } from './battlePrediction';
export type { BattlePredictionGenerator } from './battlePrediction';

// Seeded Random
export { createSeededRandom, generateSeed } from './seededRandom';
