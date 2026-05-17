import { describe, it, expect } from 'vitest';
import { calculateAttackEffect } from './attack';

describe('calculateAttackEffect', () => {
  it('returns Mild at the bottom of the range (0)', () => {
    expect(calculateAttackEffect(0).difficultyLevel).toBe('Mild');
  });

  it('returns Mild at exactly the threshold (50)', () => {
    expect(calculateAttackEffect(50).difficultyLevel).toBe('Mild');
  });

  it('promotes to Medium just above the Mild threshold', () => {
    expect(calculateAttackEffect(51).difficultyLevel).toBe('Medium');
  });

  it('returns Strong in the 151–300 band', () => {
    expect(calculateAttackEffect(200).difficultyLevel).toBe('Strong');
  });

  it('returns Devastating in the 301–500 band', () => {
    expect(calculateAttackEffect(400).difficultyLevel).toBe('Devastating');
  });

  it('returns Extreme above all named thresholds', () => {
    const e = calculateAttackEffect(10_000);
    expect(e.difficultyLevel).toBe('Extreme');
    expect(e.operandMultiplier).toBe(2.5);
    expect(e.operatorBias).toBe(0.5);
  });

  it('escalates operand multiplier monotonically', () => {
    const m = [
      calculateAttackEffect(0).operandMultiplier,
      calculateAttackEffect(100).operandMultiplier,
      calculateAttackEffect(200).operandMultiplier,
      calculateAttackEffect(400).operandMultiplier,
      calculateAttackEffect(1000).operandMultiplier,
    ];
    for (let i = 1; i < m.length; i++) {
      expect(m[i]).toBeGreaterThanOrEqual(m[i - 1]);
    }
  });
});
