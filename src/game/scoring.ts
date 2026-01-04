import type { ScoreParams, ScoreResult, EliminationResult } from '../types';
import {
  BASE_SCORE_PER_DIGIT,
  MAX_PREP_BONUS,
  MAX_RISK_BONUS,
  PREP_BONUS_PER_CALC,
} from '../constants';

/**
 * Calculate score and attack power
 *
 * Score = eliminated × 10 × chain × prep × risk
 *
 * - Chain: chain count (min 1)
 * - Prep bonus: 1 + (calculations since last elimination × 0.2), max 3.0
 * - Risk bonus: 1 + (digit count ÷ 10), max 2.0
 */
export function calculateScore(params: ScoreParams): ScoreResult {
  const { eliminated, chains, calculationsSinceLastElimination, digitCountBeforeElimination } =
    params;

  const baseScore = eliminated * BASE_SCORE_PER_DIGIT;
  const chainMultiplier = Math.max(chains, 1) ** 2;
  const prepBonus = Math.min(
    1 + calculationsSinceLastElimination * PREP_BONUS_PER_CALC,
    MAX_PREP_BONUS
  );
  const riskBonus = Math.min(1 + digitCountBeforeElimination / 10, MAX_RISK_BONUS);

  const totalScore = Math.floor(baseScore * chainMultiplier * prepBonus * riskBonus);
  const attackPower = totalScore;

  return {
    totalScore,
    baseScore,
    chainMultiplier,
    prepBonus,
    riskBonus,
    attackPower,
  };
}

/**
 * Check if attack should be triggered
 * - 3+ simultaneous elimination
 * - 2+ chain reactions
 */
export function shouldTriggerAttack(eliminationResult: EliminationResult): boolean {
  return eliminationResult.eliminated >= 3 || eliminationResult.chains >= 2;
}
