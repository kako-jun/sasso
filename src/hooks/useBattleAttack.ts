import { useCallback, useEffect, useState } from 'react';
import { BATTLE_EVENTS } from '../utils';

export interface UseBattleAttackReturn {
  // Incoming attack state (defense side)
  isUnderAttack: boolean;
  pendingAttackPower: number;
  // Called after a pending (incoming) attack has been applied to the next prediction
  onIncomingAttackApplied: () => void;

  // Outgoing attack (offense side) - sent with next state update, then cleared
  outgoingAttack: { power: number; timestamp: number } | null;
  queueOutgoingAttack: (power: number) => void;
  clearOutgoingAttack: () => void;

  // Clear all attack state (used by resetGameState)
  reset: () => void;
}

/**
 * Attack I/O for battle mode.
 *
 * - Receives BATTLE_EVENTS.ATTACK from the room and exposes the pending power
 *   so the prediction timer can fold it into the next prediction.
 * - Queues an outgoing attack to be embedded in the next broadcast state.
 *
 * Pure extraction from useBattleMode: behavior is unchanged.
 */
export function useBattleAttack(): UseBattleAttackReturn {
  const [isUnderAttack, setIsUnderAttack] = useState(false);
  const [pendingAttackPower, setPendingAttackPower] = useState(0);
  // Outgoing attack - sent with next state update, then cleared
  const [attackToSend, setAttackToSend] = useState<{
    power: number;
    timestamp: number;
  } | null>(null);

  // Listen for incoming attack events from the room
  useEffect(() => {
    const handleAttack = (e: CustomEvent<{ power: number }>) => {
      setPendingAttackPower(e.detail.power);
      setIsUnderAttack(true);
    };

    window.addEventListener(BATTLE_EVENTS.ATTACK, handleAttack as EventListener);

    return () => {
      window.removeEventListener(BATTLE_EVENTS.ATTACK, handleAttack as EventListener);
    };
  }, []);

  const onIncomingAttackApplied = useCallback(() => {
    setPendingAttackPower(0);
    setIsUnderAttack(false);
  }, []);

  const queueOutgoingAttack = useCallback((power: number) => {
    setAttackToSend({ power, timestamp: Date.now() });
  }, []);

  const clearOutgoingAttack = useCallback(() => {
    setAttackToSend(null);
  }, []);

  const reset = useCallback(() => {
    setPendingAttackPower(0);
    setIsUnderAttack(false);
    setAttackToSend(null);
  }, []);

  return {
    isUnderAttack,
    pendingAttackPower,
    onIncomingAttackApplied,
    outgoingAttack: attackToSend,
    queueOutgoingAttack,
    clearOutgoingAttack,
    reset,
  };
}
