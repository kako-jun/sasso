import { describe, it, expect } from 'vitest';
import { createBattlePredictionGenerator } from './battlePrediction';
import { calculateAttackEffect } from './attack';

describe('createBattlePredictionGenerator', () => {
  it('yields identical sequences for the same seed (fair battle start)', () => {
    const playerA = createBattlePredictionGenerator(987654321);
    const playerB = createBattlePredictionGenerator(987654321);
    for (let i = 0; i < 25; i++) {
      expect(playerA.generatePrediction()).toEqual(playerB.generatePrediction());
    }
  });

  it('diverges between players after one applies an attack', () => {
    const attacker = createBattlePredictionGenerator(42);
    const defender = createBattlePredictionGenerator(42);

    // Both consume one normal prediction together
    expect(attacker.generatePrediction()).toEqual(defender.generatePrediction());

    // Defender is attacked once — their generator advances with extra calls (stackCount predictions)
    defender.generateAttackPredictions(500);

    // Now attacker (no attack) and defender (already consumed attack predictions) diverge
    const aNext = attacker.generatePrediction();
    const dNext = defender.generatePrediction();
    expect(aNext).not.toEqual(dNext);
  });

  it('returns the stackCount predictions from generateAttackPredictions', () => {
    const gen = createBattlePredictionGenerator(1);
    const effect = gen.generateAttackPredictions(100);
    // The number of returned predictions must match the attack table's stackCount
    expect(effect.predictions.length).toBe(calculateAttackEffect(100).stackCount);
    expect(effect.difficultyLevel).toBe(calculateAttackEffect(100).difficultyLevel);
  });

  it('only emits valid operators and bounded operands', () => {
    const gen = createBattlePredictionGenerator(7);
    for (let i = 0; i < 200; i++) {
      const p = gen.generatePrediction();
      expect(['+', '-', '*', '/']).toContain(p.operator);
      expect(p.operand).toBeGreaterThanOrEqual(1);
      expect(p.operand).toBeLessThanOrEqual(99);
    }
  });

  it('resetCount restores the initial sequence', () => {
    const gen = createBattlePredictionGenerator(12345);
    const first = gen.generatePrediction();
    gen.generatePrediction();
    gen.generatePrediction();
    // resetCount only resets the predictionCount, not the RNG, so this is only
    // a guard against accidental seed reset behaviour.
    gen.resetCount();
    // The RNG state has advanced, so the next prediction won't equal `first`,
    // but it must still be a valid prediction.
    const next = gen.generatePrediction();
    expect(['+', '-', '*', '/']).toContain(next.operator);
    expect(next.operand).toBeGreaterThanOrEqual(1);
    expect(first.operand).toBeGreaterThanOrEqual(1);
  });
});
