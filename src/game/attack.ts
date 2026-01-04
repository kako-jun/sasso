import type { AttackParams } from '../types';
import { ATTACK_THRESHOLDS } from '../constants';

/**
 * Attack level configuration table
 */
const ATTACK_LEVELS: Array<{
  threshold: number;
  params: AttackParams;
}> = [
  {
    threshold: ATTACK_THRESHOLDS.mild,
    params: { difficultyLevel: '通常', operatorBias: 0, operandMultiplier: 1.0, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.medium,
    params: { difficultyLevel: '軽微', operatorBias: 0.1, operandMultiplier: 1.2, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.strong,
    params: { difficultyLevel: '中程度', operatorBias: 0.2, operandMultiplier: 1.5, stackCount: 1 },
  },
  {
    threshold: ATTACK_THRESHOLDS.devastating,
    params: { difficultyLevel: '強力', operatorBias: 0.3, operandMultiplier: 1.8, stackCount: 2 },
  },
];

const MAX_ATTACK_PARAMS: AttackParams = {
  difficultyLevel: '壊滅的',
  operatorBias: 0.4,
  operandMultiplier: 2.0,
  stackCount: 3,
};

/**
 * Calculate attack effect parameters based on attack power
 *
 * Attack power ranges and effects:
 * - 0-50:    Normal (no effect)
 * - 51-150:  Mild (+10% multiply, 1.2x numbers)
 * - 151-300: Medium (+20% multiply, 1.5x numbers)
 * - 301-500: Strong (+30% multiply, 1.8x numbers, 2 predictions)
 * - 501+:    Devastating (+40% multiply, 2.0x numbers, 3 predictions)
 */
export function calculateAttackEffect(attackPower: number): AttackParams {
  const level = ATTACK_LEVELS.find((l) => attackPower <= l.threshold);
  return level ? level.params : MAX_ATTACK_PARAMS;
}
