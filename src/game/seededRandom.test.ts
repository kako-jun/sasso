import { describe, it, expect } from 'vitest';
import { createSeededRandom } from './seededRandom';

describe('createSeededRandom', () => {
  it('produces a deterministic sequence for a given seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createSeededRandom(1);
    const b = createSeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('returns values in [0, 1)', () => {
    const rng = createSeededRandom(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  // Snapshot of the LCG output for seed=42 — the constants (1103515245, 12345, 0x7fffffff)
  // are documented as glibc-compatible in docs/battle-mode.md and battle saves rely on
  // both players advancing the same way. If this changes, prediction sync silently breaks.
  it('produces the documented glibc-compatible sequence for seed=42', () => {
    const rng = createSeededRandom(42);
    const seq = Array.from({ length: 5 }, () => rng());
    expect(seq).toMatchInlineSnapshot(`
      [
        0.5823075899771916,
        0.5198186638391664,
        0.9149397615878563,
        0.698715567914171,
        0.7530812028576999,
      ]
    `);
  });
});
