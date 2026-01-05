import type { AttackParams } from '../types';
import { ATTACK_THRESHOLDS } from '../constants';

/**
 * Attack level configuration table
 * Shifted so any elimination has effect
 */
const ATTACK_LEVELS: Array<{
  threshold: number;
  params: AttackParams;
}> = [
  {
    threshold: ATTACK_THRESHOLDS.mild,
    params: { difficultyLevel: 'Mild', operatorBias: 0.1, operandMultiplier: 1.2, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.medium,
    params: { difficultyLevel: 'Medium', operatorBias: 0.2, operandMultiplier: 1.5, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.strong,
    params: { difficultyLevel: 'Strong', operatorBias: 0.3, operandMultiplier: 1.8, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.devastating,
    params: {
      difficultyLevel: 'Devastating',
      operatorBias: 0.4,
      operandMultiplier: 2.0,
      stackCount: 1,
    },
  },
];

const MAX_ATTACK_PARAMS: AttackParams = {
  difficultyLevel: 'Extreme',
  operatorBias: 0.5,
  operandMultiplier: 2.5,
  stackCount: 1,
};

/**
 * Calculate attack effect parameters based on attack power
 *
 * Attack power ranges and effects:
 * - 0-50:    Mild (+10% multiply, 1.2x numbers)
 * - 51-150:  Medium (+20% multiply, 1.5x numbers)
 * - 151-300: Strong (+30% multiply, 1.8x numbers)
 * - 301-500: Devastating (+40% multiply, 2.0x numbers)
 * - 501+:    Extreme (+50% multiply, 2.5x numbers)
 */
export function calculateAttackEffect(attackPower: number): AttackParams {
  const level = ATTACK_LEVELS.find((l) => attackPower <= l.threshold);
  return level ? level.params : MAX_ATTACK_PARAMS;
}
