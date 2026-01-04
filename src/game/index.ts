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
