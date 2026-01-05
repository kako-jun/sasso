import type { Prediction, AttackEffect } from '../types';
import { calculateAttackEffect } from './attack';
import { createSeededRandom } from './seededRandom';
import { generatePredictionCore } from './prediction';

/**
 * Create a battle prediction generator with a shared seed.
 * Both players with the same seed will get identical prediction sequences.
 *
 * @param seed - Shared seed for deterministic generation
 * @returns Object with methods to generate predictions
 */
export function createBattlePredictionGenerator(seed: number) {
  const random = createSeededRandom(seed);
  let predictionCount = 0;

  // Use prediction count instead of time for deterministic difficulty scaling
  // ~30 predictions per minute at 10s intervals = 300 predictions in 10 minutes
  const MAX_PREDICTIONS_FOR_SCALING = 300;

  /**
   * Generate next prediction using seeded random
   *
   * @param attackPower - Attack power from opponent (0 = no attack)
   */
  function generatePrediction(attackPower = 0): Prediction {
    predictionCount++;
    const timeFactor = Math.min(predictionCount / MAX_PREDICTIONS_FOR_SCALING, 1);
    return generatePredictionCore(timeFactor, attackPower, random);
  }

  /**
   * Generate predictions after receiving an attack (supports multiple predictions)
   */
  function generateAttackPredictions(attackPower: number): AttackEffect {
    const effect = calculateAttackEffect(attackPower);

    const predictions: Prediction[] = [];
    for (let i = 0; i < effect.stackCount; i++) {
      predictions.push(generatePrediction(attackPower));
    }

    return {
      predictions,
      difficultyLevel: effect.difficultyLevel,
      operatorBias: effect.operatorBias,
      operandMultiplier: effect.operandMultiplier,
    };
  }

  /**
   * Reset the prediction count (for new game)
   */
  function resetCount() {
    predictionCount = 0;
  }

  return {
    generatePrediction,
    generateAttackPredictions,
    resetCount,
  };
}

export type BattlePredictionGenerator = ReturnType<typeof createBattlePredictionGenerator>;
