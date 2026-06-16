/**
 * useArena - Wrapper around nostr-arena package
 *
 * Uses the generic nostr-arena package with Sasso-specific types.
 * Attack handling is done through game state (attack field with timestamp).
 */

import { useRef, useMemo, useCallback } from 'react';
import { useArena as usePackageArena } from 'nostr-arena/react';
import { withRetry } from 'nostr-arena';
import type { ArenaCallbacks } from 'nostr-arena';
import type { SassoGameState, OpponentState, RoomState } from '../types/battle';
import { ROOM_EXPIRY_MS } from '../constants';
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
      roomExpiry: ROOM_EXPIRY_MS,
    }),
    []
  );

  // Callbacks for nostr-arena
  // Attack is embedded into the game state by useBattleMode (see attackToSend).
  // We only watch the opponent's state to detect new attacks via timestamp.
  const callbacks = useMemo<ArenaCallbacks<SassoGameState>>(
    () => ({
      onOpponentState: (state: SassoGameState) => {
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
        // Reset attack tracking on rematch
        lastAttackTimestampRef.current = 0;
        dispatchBattleEvent(BATTLE_EVENTS.REMATCH_START, { seed: newSeed });
      },
      onError: (error: Error) => {
        console.error('Arena error:', error.message);
        // NOTE: `detail.message` is currently unused by the UI — the in-window
        // indicator shows a fixed "Reconnecting…" string. Included for future use.
        dispatchBattleEvent(BATTLE_EVENTS.ERROR, { message: error.message });
      },
    }),
    []
  );

  // Use the package hook
  const room = usePackageArena<SassoGameState>(config, callbacks);

  // Retry join over cold relays: the first cold attempt often fails because the
  // fresh WebSocket handshakes to the relays don't complete within the package's
  // 5s fetch window. A later attempt reuses the now-warm connection (join failure
  // does NOT disconnect the client), so retrying is safe and reliable. Uses the
  // package's exponential backoff (maxAttempts 3, initialDelay 800ms, ×2 → 800ms
  // then 1600ms) to tolerate cold relay connections.
  const joinRoom = useCallback(
    (roomId: string) =>
      withRetry(() => room.joinRoom(roomId), { maxAttempts: 3, initialDelay: 800 }),
    [room.joinRoom]
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
    joinRoom,
    leaveRoom: room.leaveRoom,
    reconnect: room.reconnect,
    sendState: room.sendState,
    sendGameOver: room.sendGameOver,
    requestRematch: room.requestRematch,
    acceptRematch: room.acceptRematch,
  };
}
