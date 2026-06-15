// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSeededPrediction } from './useSeededPrediction';
import { COUNTDOWN_TIME } from '../constants';

/**
 * Determinism is the heart of battle sync: two hook instances seeded with the
 * same value must yield byte-identical prediction series, while different seeds
 * must diverge. The values are pinned against the real seededRandom/LCG series
 * (not a tautology) so a regression in the generator wiring is caught.
 */
describe('useSeededPrediction', () => {
  it('produces the pinned real prediction series for a known seed (snapshot of the LCG)', () => {
    const { result } = renderHook(() => useSeededPrediction());

    act(() => result.current.initWithSeed(12345));
    expect(result.current.prediction).toEqual({ operator: '*', operand: 4 });

    act(() => result.current.generateNextPrediction());
    expect(result.current.prediction).toEqual({ operator: '*', operand: 12 });

    act(() => result.current.generateNextPrediction());
    expect(result.current.prediction).toEqual({ operator: '*', operand: 9 });

    act(() => result.current.generateNextPrediction());
    expect(result.current.prediction).toEqual({ operator: '+', operand: 11 });
  });

  it('two instances seeded identically yield the same series (both players in sync)', () => {
    const a = renderHook(() => useSeededPrediction());
    const b = renderHook(() => useSeededPrediction());

    act(() => a.result.current.initWithSeed(987654321));
    act(() => b.result.current.initWithSeed(987654321));
    expect(a.result.current.prediction).toEqual(b.result.current.prediction);

    for (let i = 0; i < 20; i++) {
      act(() => a.result.current.generateNextPrediction());
      act(() => b.result.current.generateNextPrediction());
      expect(a.result.current.prediction).toEqual(b.result.current.prediction);
    }
  });

  it('different seeds diverge somewhere in the series', () => {
    const a = renderHook(() => useSeededPrediction());
    const b = renderHook(() => useSeededPrediction());

    act(() => a.result.current.initWithSeed(111));
    act(() => b.result.current.initWithSeed(222));

    const seriesA: string[] = [];
    const seriesB: string[] = [];
    const snap = (p: ReturnType<typeof JSON.parse> | null) => JSON.stringify(p);
    seriesA.push(snap(a.result.current.prediction));
    seriesB.push(snap(b.result.current.prediction));
    for (let i = 0; i < 15; i++) {
      act(() => a.result.current.generateNextPrediction());
      act(() => b.result.current.generateNextPrediction());
      seriesA.push(snap(a.result.current.prediction));
      seriesB.push(snap(b.result.current.prediction));
    }
    expect(seriesA).not.toEqual(seriesB);
  });

  it('initWithSeed sets the countdown and a start time', () => {
    const { result } = renderHook(() => useSeededPrediction());
    expect(result.current.countdown).toBe(0);
    expect(result.current.gameStartTime).toBeNull();

    act(() => result.current.initWithSeed(5));
    expect(result.current.countdown).toBe(COUNTDOWN_TIME);
    expect(typeof result.current.gameStartTime).toBe('number');
  });

  it('resetPrediction clears prediction, countdown, and start time', () => {
    const { result } = renderHook(() => useSeededPrediction());
    act(() => result.current.initWithSeed(5));
    expect(result.current.prediction).not.toBeNull();

    act(() => result.current.resetPrediction());
    expect(result.current.prediction).toBeNull();
    expect(result.current.countdown).toBe(0);
    expect(result.current.gameStartTime).toBeNull();
  });

  it('generateNextPrediction is a no-op before a seed is set', () => {
    const { result } = renderHook(() => useSeededPrediction());
    act(() => result.current.generateNextPrediction());
    expect(result.current.prediction).toBeNull();
  });

  it('re-seeding restarts the series from the beginning', () => {
    const { result } = renderHook(() => useSeededPrediction());

    act(() => result.current.initWithSeed(12345));
    const first = result.current.prediction;
    act(() => result.current.generateNextPrediction());
    act(() => result.current.generateNextPrediction());

    act(() => result.current.initWithSeed(12345));
    expect(result.current.prediction).toEqual(first);
  });
});
