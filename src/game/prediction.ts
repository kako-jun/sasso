import type { Prediction, Operator } from '../types';
import { MAX_TIME_FACTOR, OPERATOR_PROB, OPERAND_RANGE } from '../constants';
import { calculateAttackEffect } from './attack';

/**
 * Core prediction generation logic (shared between single-player and battle modes)
 *
 * @param timeFactor - Difficulty factor (0 to 1)
 * @param attackPower - Attack power from opponent (0 = no attack)
 * @param random - Random number generator function
 */
export function generatePredictionCore(
  timeFactor: number,
  attackPower: number,
  random: () => number
): Prediction {
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
 * Generate next prediction (single-player mode)
 *
 * @param elapsedTime - Time since game start (ms)
 * @param attackPower - Attack power from opponent (0 = no attack)
 */
export function generatePrediction(elapsedTime: number, attackPower = 0): Prediction {
  const timeFactor = Math.min(elapsedTime / MAX_TIME_FACTOR, 1);
  return generatePredictionCore(timeFactor, attackPower, Math.random);
}
