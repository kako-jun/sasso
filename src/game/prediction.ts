import type { Prediction, Operator } from '../types';
import { MAX_TIME_FACTOR, OPERATOR_PROB, OPERAND_RANGE } from '../constants';
import { calculateAttackEffect } from './attack';

/**
 * Generate next prediction
 *
 * @param elapsedTime - Time since game start (ms)
 * @param attackPower - Attack power from opponent (0 = no attack)
 */
export function generatePrediction(elapsedTime: number, attackPower = 0): Prediction {
  const timeFactor = Math.min(elapsedTime / MAX_TIME_FACTOR, 1);
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

  const rand = Math.random();
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

  const operand = Math.floor(Math.random() * maxOperand) + OPERAND_RANGE.min;

  return { operator, operand };
}
