// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConnectionError } from './useConnectionError';
import { BATTLE_EVENTS } from '../utils';

function fireError() {
  window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.ERROR));
}

describe('useConnectionError', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts false', () => {
    const { result } = renderHook(() => useConnectionError());
    expect(result.current).toBe(false);
  });

  it('becomes true on an error event', () => {
    const { result } = renderHook(() => useConnectionError());
    act(() => fireError());
    expect(result.current).toBe(true);
  });

  it('returns to false after the timeout elapses', () => {
    const { result } = renderHook(() => useConnectionError(4000));
    act(() => fireError());
    expect(result.current).toBe(true);

    act(() => vi.advanceTimersByTime(4000));
    expect(result.current).toBe(false);
  });

  it('a second error before the timeout resets the timer', () => {
    const { result } = renderHook(() => useConnectionError(4000));
    act(() => fireError());

    // Advance partway, then fire again — this re-arms the dismissal timer.
    act(() => vi.advanceTimersByTime(2000));
    act(() => fireError());

    // Advancing the original remainder is no longer enough to dismiss.
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(true);

    // A full timeout from the second error finally dismisses.
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current).toBe(false);
  });
});
