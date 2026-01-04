import type { Prediction, AttackEffect, Operator } from '../types';
import { OPERATOR_PROB, OPERAND_RANGE } from '../constants';
import { calculateAttackEffect } from './attack';
import { createSeededRandom } from './seededRandom';

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
    const attackEffect = calculateAttackEffect(attackPower);

    // Adjust probabilities based on time and attack
    const mulBoost = timeFactor * 0.15 + attackEffect.operatorBias;
    const addProb = Math.max(
      OPERATOR_PROB.add - timeFactor * 0.15 - attackEffect.operatorBias * 0.5,
      0.1
    );
    const subProb = Math.max(
      OPERATOR_PROB.sub - timeFactor * 0.05 - attackEffect.operatorBias * 0.3,
      0.1
    );
    const mulProb = Math.min(OPERATOR_PROB.mul + mulBoost, 0.6);

    const rand = random();
    let operator: Operator;

    if (rand < addProb) {
      operator = '+';
    } else if (rand < addProb + subProb) {
      operator = '-';
    } else if (rand < addProb + subProb + mulProb) {
      operator = '*';
    } else {
      operator = '/';
    }

    // Calculate operand range
    const baseMax = OPERAND_RANGE.baseMax + timeFactor * OPERAND_RANGE.timeScaling;
    const maxOperand = Math.min(
      Math.floor(baseMax * attackEffect.operandMultiplier),
      OPERAND_RANGE.max
    );

    const operand = Math.floor(random() * maxOperand) + OPERAND_RANGE.min;

    return { operator, operand };
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
