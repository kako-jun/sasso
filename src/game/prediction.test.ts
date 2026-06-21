import { describe, it, expect } from 'vitest';
import { generatePrediction, generatePredictionCore } from './prediction';
import { MAX_TIME_FACTOR, SPRINT_TIME_LIMIT } from '../constants';

describe('generatePredictionCore', () => {
  it('returns operator and operand within documented bounds', () => {
    // Constant rng so we can exercise multiple branches by varying input
    for (let i = 0; i < 100; i++) {
      const r = i / 100;
      const p = generatePredictionCore(0, 0, () => r);
      expect(['+', '-', '*', '/']).toContain(p.operator);
      expect(p.operand).toBeGreaterThanOrEqual(1);
      expect(p.operand).toBeLessThanOrEqual(99);
    }
  });

  it('picks "+" when the rng is below the add probability', () => {
    const p = generatePredictionCore(0, 0, () => 0.0);
    expect(p.operator).toBe('+');
  });

  it('picks "/" when the rng is at the top', () => {
    const p = generatePredictionCore(0, 0, () => 0.999_999);
    expect(p.operator).toBe('/');
  });

  it('makes operators bias toward multiplication under attack', () => {
    // For the same rng value, an attack must visibly shift the operator
    // away from "+" toward "*" (the "+" zone shrinks, "*" zone grows).
    const peaceful = generatePredictionCore(0, 0, () => 0.45);
    const underAttack = generatePredictionCore(0, 1000, () => 0.45);
    expect(peaceful.operator).toBe('-');
    expect(underAttack.operator).toBe('*');
  });

  it('expands the operand ceiling as time progresses to the deadline', () => {
    // Same (max) rng: the operand range must grow from game start (timeFactor 0)
    // to the Sprint deadline (timeFactor 1). Guards the difficulty ramp.
    const start = generatePredictionCore(0, 0, () => 0.999999);
    const deadline = generatePredictionCore(1, 0, () => 0.999999);
    expect(deadline.operand).toBeGreaterThan(start.operand);
  });
});

describe('difficulty scaling window', () => {
  it('ramps to full exactly at the Sprint deadline (no 5min/3min drift)', () => {
    // Regression: when the game was shortened from 5min to 3min, MAX_TIME_FACTOR
    // was left at 5min, capping Sprint difficulty at 60%. They must stay coupled.
    expect(MAX_TIME_FACTOR).toBe(SPRINT_TIME_LIMIT);
  });
});

describe('generatePrediction', () => {
  it('returns a valid prediction at elapsedTime=0', () => {
    const p = generatePrediction(0);
    expect(['+', '-', '*', '/']).toContain(p.operator);
    expect(p.operand).toBeGreaterThanOrEqual(1);
    expect(p.operand).toBeLessThanOrEqual(99);
  });

  it('returns a valid prediction past the max time factor', () => {
    const p = generatePrediction(10_000_000); // far past MAX_TIME_FACTOR
    expect(['+', '-', '*', '/']).toContain(p.operator);
    expect(p.operand).toBeGreaterThanOrEqual(1);
    expect(p.operand).toBeLessThanOrEqual(99);
  });
});
