import { describe, it, expect } from 'vitest';
import { calculateScore, shouldTriggerAttack } from './scoring';

describe('calculateScore', () => {
  it('applies the documented Base × Chain² × Prep × Risk formula', () => {
    // 2 eliminated, 1 chain, 0 prep, 3 digits → 2×10 × 1² × 1.0 × (1 + 3/10) = 20 × 1 × 1 × 1.3 = 26
    const r = calculateScore({
      eliminated: 2,
      chains: 1,
      calculationsSinceLastElimination: 0,
      digitCountBeforeElimination: 3,
    });
    expect(r.baseScore).toBe(20);
    expect(r.chainMultiplier).toBe(1);
    expect(r.prepBonus).toBeCloseTo(1.0);
    expect(r.riskBonus).toBeCloseTo(1.3);
    expect(r.totalScore).toBe(Math.floor(20 * 1 * 1.0 * 1.3));
  });

  it('squares the chain count', () => {
    const r = calculateScore({
      eliminated: 2,
      chains: 3,
      calculationsSinceLastElimination: 0,
      digitCountBeforeElimination: 5,
    });
    expect(r.chainMultiplier).toBe(9);
  });

  it('treats chains < 1 as 1 (defensive)', () => {
    const r = calculateScore({
      eliminated: 1,
      chains: 0,
      calculationsSinceLastElimination: 0,
      digitCountBeforeElimination: 1,
    });
    expect(r.chainMultiplier).toBe(1);
  });

  it('caps prep bonus at MAX_PREP_BONUS (3.0)', () => {
    const r = calculateScore({
      eliminated: 1,
      chains: 1,
      calculationsSinceLastElimination: 100,
      digitCountBeforeElimination: 1,
    });
    expect(r.prepBonus).toBe(3.0);
  });

  it('caps risk bonus at MAX_RISK_BONUS (2.0)', () => {
    const r = calculateScore({
      eliminated: 1,
      chains: 1,
      calculationsSinceLastElimination: 0,
      digitCountBeforeElimination: 50,
    });
    expect(r.riskBonus).toBe(2.0);
  });

  it('exposes attackPower equal to totalScore', () => {
    const r = calculateScore({
      eliminated: 4,
      chains: 2,
      calculationsSinceLastElimination: 3,
      digitCountBeforeElimination: 9,
    });
    expect(r.attackPower).toBe(r.totalScore);
  });

  it('floors the final score', () => {
    const r = calculateScore({
      eliminated: 1,
      chains: 1,
      calculationsSinceLastElimination: 1,
      digitCountBeforeElimination: 1,
    });
    // 10 × 1 × 1.2 × 1.1 = 13.2 → 13
    expect(r.totalScore).toBe(13);
  });
});

describe('shouldTriggerAttack', () => {
  it('returns true when any digits were eliminated', () => {
    expect(shouldTriggerAttack({ eliminated: 1, chains: 1, result: '0' })).toBe(true);
  });

  it('returns false when nothing was eliminated', () => {
    expect(shouldTriggerAttack({ eliminated: 0, chains: 0, result: '123' })).toBe(false);
  });
});
