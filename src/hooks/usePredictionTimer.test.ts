// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePredictionTimer } from './usePredictionTimer';
import type { Prediction } from '../types';
import type { UseEliminationReturn } from './useElimination';

// The timer ticks every 100ms and, when the countdown reaches <=100, applies the
// current prediction (display update + history) and asks for the next one,
// folding in pendingAttackPower. This is the minimal driver coverage — the
// determinism contract proper is verified in useSeededPrediction.test.ts.
function setup(opts: {
  prediction: Prediction | null;
  countdown: number;
  isActive: boolean;
  pendingAttackPower?: number;
}) {
  const setCountdown = vi.fn();
  const clearCountdown = vi.fn();
  const predictionHook = {
    prediction: opts.prediction,
    countdown: opts.countdown,
    setCountdown,
    clearCountdown,
  };

  const eliminationHook = {
    startEliminationChain: vi.fn(),
  } as unknown as UseEliminationReturn;

  const displayRef = { current: '5' };

  const callbacks = {
    onDisplayUpdate: vi.fn(),
    onOverflow: vi.fn(),
    onAttack: vi.fn(),
    onCalculationHistory: vi.fn(),
    generateNextPrediction: vi.fn(),
    finalizePendingCalculation: vi.fn(() => null),
  };

  const onAttackApplied = vi.fn();

  const hook = renderHook(() =>
    usePredictionTimer({
      predictionHook,
      eliminationHook,
      displayRef,
      isActive: opts.isActive,
      callbacks,
      pendingAttackPower: opts.pendingAttackPower ?? 0,
      onAttackApplied,
    })
  );

  return { hook, setCountdown, callbacks, onAttackApplied, displayRef };
}

describe('usePredictionTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not tick the countdown while inactive', () => {
    const { setCountdown } = setup({
      prediction: { operator: '+', operand: 1 },
      countdown: 10000,
      isActive: false,
    });

    act(() => vi.advanceTimersByTime(500));
    expect(setCountdown).not.toHaveBeenCalled();
  });

  it('ticks the countdown every 100ms while active', () => {
    const { setCountdown } = setup({
      prediction: { operator: '+', operand: 1 },
      countdown: 10000,
      isActive: true,
    });

    act(() => vi.advanceTimersByTime(300));
    expect(setCountdown).toHaveBeenCalledTimes(3);

    // The updater decrements by 100 until <=100
    const updater = setCountdown.mock.calls[0][0] as (prev: number) => number;
    expect(updater(10000)).toBe(9900);
  });

  it('applies the prediction (display + history) and requests the next when the countdown expires', () => {
    const { setCountdown, callbacks } = setup({
      prediction: { operator: '+', operand: 1 },
      countdown: 100,
      isActive: true,
    });

    act(() => vi.advanceTimersByTime(100));

    // Drive the reducer updater with a value that has reached the threshold
    const updater = setCountdown.mock.calls[0][0] as (prev: number) => number;
    act(() => {
      updater(100); // <=100 -> applyPrediction runs, returns COUNTDOWN_TIME
    });

    expect(callbacks.onDisplayUpdate).toHaveBeenCalledWith('6'); // 5 + 1
    expect(callbacks.onCalculationHistory).toHaveBeenCalled();
    expect(callbacks.generateNextPrediction).toHaveBeenCalledWith(0);
  });

  it('folds pendingAttackPower into the next prediction and notifies onAttackApplied', () => {
    const { setCountdown, callbacks, onAttackApplied } = setup({
      prediction: { operator: '+', operand: 1 },
      countdown: 100,
      isActive: true,
      pendingAttackPower: 250,
    });

    act(() => vi.advanceTimersByTime(100));
    const updater = setCountdown.mock.calls[0][0] as (prev: number) => number;
    act(() => {
      updater(100);
    });

    expect(callbacks.generateNextPrediction).toHaveBeenCalledWith(250);
    expect(onAttackApplied).toHaveBeenCalledTimes(1);
  });

  it('does nothing on apply when there is no prediction', () => {
    const { setCountdown, callbacks } = setup({
      prediction: null,
      countdown: 100,
      isActive: true,
    });

    act(() => vi.advanceTimersByTime(100));
    const updater = setCountdown.mock.calls[0][0] as (prev: number) => number;
    act(() => {
      updater(100);
    });

    expect(callbacks.onDisplayUpdate).not.toHaveBeenCalled();
    expect(callbacks.generateNextPrediction).not.toHaveBeenCalled();
  });
});
