import type { AttackParams } from '../types';
import { ATTACK_THRESHOLDS } from '../constants';

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
  if (attackPower <= ATTACK_THRESHOLDS.mild) {
    return {
      difficultyLevel: '通常',
      operatorBias: 0,
      operandMultiplier: 1.0,
      stackCount: 1,
    };
  } else if (attackPower <= ATTACK_THRESHOLDS.medium) {
    return {
      difficultyLevel: '軽微',
      operatorBias: 0.1,
      operandMultiplier: 1.2,
      stackCount: 1,
    };
  } else if (attackPower <= ATTACK_THRESHOLDS.strong) {
    return {
      difficultyLevel: '中程度',
      operatorBias: 0.2,
      operandMultiplier: 1.5,
      stackCount: 1,
    };
  } else if (attackPower <= ATTACK_THRESHOLDS.devastating) {
    return {
      difficultyLevel: '強力',
      operatorBias: 0.3,
      operandMultiplier: 1.8,
      stackCount: 2,
    };
  } else {
    return {
      difficultyLevel: '壊滅的',
      operatorBias: 0.4,
      operandMultiplier: 2.0,
      stackCount: 3,
    };
  }
}
