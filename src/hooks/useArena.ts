/**
 * useArena - Wrapper around nostr-arena package
 *
 * Uses the generic nostr-arena package with Sasso-specific types.
 * Attack handling is done through game state (attack field with timestamp).
 */

import { useCallback, useRef, useMemo } from 'react';
import { useArena as usePackageArena } from 'nostr-arena/react';
import type { ArenaCallbacks } from 'nostr-arena';
import type { SassoGameState, OpponentState, RoomState } from '../types/battle';
import { dispatchBattleEvent, BATTLE_EVENTS } from '../utils/battleEvents';

export interface UseArenaReturn {
  // Room state
  roomId: string | null;
  status: RoomState['status'];
  isHost: boolean;
  seed: number;
  createdAt?: number;
  rematchRequested?: boolean;

  // Opponent
  opponent: OpponentState | null;

  // Actions
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  reconnect: () => Promise<boolean>;
  sendState: (state: SassoGameState) => void;
  sendAttack: (power: number) => void;
  sendGameOver: (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
}

export function useArena(): UseArenaReturn {
  const lastAttackTimestampRef = useRef<number>(0);

  // Config for nostr-arena
  const config = useMemo(
    () => ({
      gameId: 'sasso',
      // Multiple relays for better reliability
      relays: [
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.snort.social',
        'wss://relay.primal.net',
      ],
    }),
    []
  );

  // Ref to track last sent state for attack injection
  const lastSentStateRef = useRef<SassoGameState | null>(null);
  const pendingAttackRef = useRef<{ power: number; timestamp: number } | null>(null);

  // Callbacks for nostr-arena
  const callbacks = useMemo<ArenaCallbacks<SassoGameState>>(
    () => ({
      onOpponentState: (state: SassoGameState) => {
        // Detect new attack from state
        if (state.attack && state.attack.timestamp > lastAttackTimestampRef.current) {
          lastAttackTimestampRef.current = state.attack.timestamp;
          dispatchBattleEvent(BATTLE_EVENTS.ATTACK, {
            power: state.attack.power,
            timestamp: state.attack.timestamp,
          });
        }
      },
      onOpponentGameOver: (reason: string, finalScore?: number) => {
        dispatchBattleEvent(BATTLE_EVENTS.OPPONENT_GAMEOVER, {
          reason,
          finalScore,
        });
      },
      onOpponentDisconnect: () => {
        dispatchBattleEvent(BATTLE_EVENTS.OPPONENT_DISCONNECT, {
          timestamp: Date.now(),
        });
      },
      onRematchRequested: () => {
        dispatchBattleEvent(BATTLE_EVENTS.REMATCH_REQUESTED);
      },
      onRematchStart: (newSeed: number) => {
        // Reset attack refs on rematch
        lastAttackTimestampRef.current = 0;
        pendingAttackRef.current = null;
        dispatchBattleEvent(BATTLE_EVENTS.REMATCH_START, { seed: newSeed });
      },
      onError: (error: Error) => {
        console.error('Arena error:', error.message);
      },
    }),
    []
  );

  // Use the package hook
  const room = usePackageArena<SassoGameState>(config, callbacks);

  // Send state with attack injection
  const sendState = useCallback(
    (state: SassoGameState) => {
      // Inject pending attack into state
      const stateWithAttack: SassoGameState = pendingAttackRef.current
        ? { ...state, attack: pendingAttackRef.current }
        : state;

      room.sendState(stateWithAttack);
      lastSentStateRef.current = stateWithAttack;

      // Clear pending attack after sending
      if (pendingAttackRef.current) {
        pendingAttackRef.current = null;
      }
    },
    [room]
  );

  // Queue attack to be sent with next state
  const sendAttack = useCallback((power: number) => {
    pendingAttackRef.current = { power, timestamp: Date.now() };
  }, []);

  // Wrapped sendGameOver with proper typing
  const sendGameOver = useCallback(
    (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => {
      room.sendGameOver(reason, finalScore);
    },
    [room]
  );

  // Map opponent to Sasso's OpponentState type
  const opponent: OpponentState | null = room.opponent
    ? {
        publicKey: room.opponent.publicKey,
        gameState: room.opponent.gameState,
        isConnected: room.opponent.isConnected,
        lastHeartbeat: room.opponent.lastHeartbeat,
        rematchRequested: room.opponent.rematchRequested,
      }
    : null;

  return {
    // Room state
    roomId: room.roomState.roomId,
    status: room.roomState.status,
    isHost: room.roomState.isHost,
    seed: room.roomState.seed,
    createdAt: room.roomState.createdAt,
    rematchRequested: room.roomState.rematchRequested,

    // Opponent
    opponent,

    // Actions
    createRoom: room.createRoom,
    joinRoom: room.joinRoom,
    leaveRoom: room.leaveRoom,
    reconnect: room.reconnect,
    sendState,
    sendAttack,
    sendGameOver,
    requestRematch: room.requestRematch,
    acceptRematch: room.acceptRematch,
  };
}
