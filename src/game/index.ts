// Elimination
export {
  findEliminationIndices,
  eliminateMatches,
  checkOverflow,
  getDigitCount,
  generateInitialState,
} from './elimination';

// Scoring
export { calculateScore, shouldTriggerAttack } from './scoring';

// Attack
export { calculateAttackEffect } from './attack';

// Prediction
export { generatePrediction } from './prediction';

// Battle Prediction (seeded)
export { createBattlePredictionGenerator } from './battlePrediction';
export type { BattlePredictionGenerator } from './battlePrediction';

// Seeded Random
export { createSeededRandom } from './seededRandom';
