// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBattleAttack } from './useBattleAttack';
import { BATTLE_EVENTS } from '../utils';

describe('useBattleAttack', () => {
  it('starts clear', () => {
    const { result } = renderHook(() => useBattleAttack());
    expect(result.current.isUnderAttack).toBe(false);
    expect(result.current.pendingAttackPower).toBe(0);
    expect(result.current.outgoingAttack).toBeNull();
  });

  it('raises pendingAttackPower / isUnderAttack on an incoming ATTACK event', () => {
    const { result } = renderHook(() => useBattleAttack());

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.ATTACK, { detail: { power: 300 } }));
    });

    expect(result.current.isUnderAttack).toBe(true);
    expect(result.current.pendingAttackPower).toBe(300);
  });

  it('onIncomingAttackApplied resets the incoming attack to 0 / false', () => {
    const { result } = renderHook(() => useBattleAttack());

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.ATTACK, { detail: { power: 300 } }));
    });
    act(() => result.current.onIncomingAttackApplied());

    expect(result.current.isUnderAttack).toBe(false);
    expect(result.current.pendingAttackPower).toBe(0);
  });

  it('queueOutgoingAttack sets {power, timestamp}; clearOutgoingAttack nulls it', () => {
    const { result } = renderHook(() => useBattleAttack());

    act(() => result.current.queueOutgoingAttack(150));
    expect(result.current.outgoingAttack?.power).toBe(150);
    expect(typeof result.current.outgoingAttack?.timestamp).toBe('number');

    act(() => result.current.clearOutgoingAttack());
    expect(result.current.outgoingAttack).toBeNull();
  });

  it('reset clears both incoming and outgoing attack state', () => {
    const { result } = renderHook(() => useBattleAttack());

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.ATTACK, { detail: { power: 300 } }));
    });
    act(() => result.current.queueOutgoingAttack(150));

    act(() => result.current.reset());
    expect(result.current.isUnderAttack).toBe(false);
    expect(result.current.pendingAttackPower).toBe(0);
    expect(result.current.outgoingAttack).toBeNull();
  });

  it('stops responding to ATTACK events after unmount (listener cleanup)', () => {
    const { result, unmount } = renderHook(() => useBattleAttack());
    unmount();

    act(() => {
      window.dispatchEvent(new CustomEvent(BATTLE_EVENTS.ATTACK, { detail: { power: 999 } }));
    });
    // result.current is the last rendered value; it must not have advanced
    expect(result.current.pendingAttackPower).toBe(0);
  });
});
