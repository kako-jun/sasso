import { useCallback, useEffect, useState, useRef } from 'react';
import type {
  RoomState,
  OpponentState,
  RoomEventContent,
  JoinEventContent,
  NostrEvent,
  SassoGameState,
} from '../types/battle';
import { NOSTR_EVENT_KINDS, NOSTR_TIMEOUTS } from '../constants/nostr';
import { generateSeed } from '../game';
import {
  publishToRoom,
  dispatchBattleEvent,
  BATTLE_EVENTS,
  createRoomTag,
} from '../utils/battleEvents';
import { useRoomPersistence } from './useRoomPersistence';
import { useConnectionHealth } from './useConnectionHealth';
import type { UseNostrReturn } from './useNostr';

export interface UseBattleRoomReturn extends RoomState {
  opponent: OpponentState | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  sendState: (state: SassoGameState) => void;
  sendAttack: (power: number) => void;
  sendGameOver: (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => void;
  requestRematch: () => void;
  acceptRematch: () => void;
}

const INITIAL_ROOM_STATE: RoomState = {
  roomId: null,
  status: 'idle',
  isHost: false,
  seed: 0,
};

const createInitialOpponent = (publicKey: string): OpponentState => ({
  publicKey,
  gameState: null,
  isConnected: true,
  lastHeartbeat: Date.now(),
});

export function useBattleRoom(nostr: UseNostrReturn): UseBattleRoomReturn {
  const [roomState, setRoomState] = useState<RoomState>(INITIAL_ROOM_STATE);
  const [opponent, setOpponent] = useState<OpponentState | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastStateUpdateRef = useRef<number>(0);

  // Extracted hooks
  const persistence = useRoomPersistence();

  const handleOpponentDisconnect = useCallback(() => {
    dispatchBattleEvent(BATTLE_EVENTS.OPPONENT_DISCONNECT, { timestamp: Date.now() });
  }, []);

  const connectionHealth = useConnectionHealth({
    nostr,
    roomId: roomState.roomId,
    isActive: roomState.status !== 'idle' && roomState.status !== 'finished',
    onOpponentDisconnect: handleOpponentDisconnect,
    setOpponent,
  });

  // Generate unique room ID
  const generateRoomId = useCallback(() => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Reset state for rematch (shared by initiator and receiver)
  const resetForRematch = useCallback((newSeed: number) => {
    setRoomState((prev) => ({
      ...prev,
      seed: newSeed,
      status: 'ready',
      rematchRequested: false,
    }));
    setOpponent((prev) =>
      prev
        ? {
            ...prev,
            gameState: null,
            rematchRequested: false,
          }
        : null
    );
    dispatchBattleEvent(BATTLE_EVENTS.REMATCH_START, { seed: newSeed });
  }, []);

  // Handle incoming room events
  const handleRoomEvent = useCallback(
    (event: NostrEvent) => {
      if (event.pubkey === nostr.publicKey) return;

      try {
        const content = JSON.parse(event.content);

        switch (content.type) {
          case 'join':
            setOpponent(createInitialOpponent(content.playerPubkey));
            setRoomState((prev) => ({ ...prev, status: 'ready' }));
            if (roomState.roomId) {
              persistence.saveRoom({
                roomId: roomState.roomId,
                isHost: roomState.isHost,
                seed: roomState.seed,
                createdAt: roomState.createdAt || Date.now(),
                opponentPubkey: content.playerPubkey,
              });
            }
            break;

          case 'state':
            setOpponent((prev) =>
              prev
                ? {
                    ...prev,
                    gameState: content.gameState,
                    lastHeartbeat: Date.now(),
                    isConnected: true,
                  }
                : null
            );
            break;

          case 'attack':
            dispatchBattleEvent(BATTLE_EVENTS.ATTACK, {
              power: content.power,
              timestamp: content.timestamp,
            });
            break;

          case 'gameover':
            dispatchBattleEvent(BATTLE_EVENTS.OPPONENT_GAMEOVER, {
              reason: content.reason,
              finalScore: content.finalScore,
            });
            setRoomState((prev) => ({ ...prev, status: 'finished', rematchRequested: false }));
            setOpponent((prev) => (prev ? { ...prev, rematchRequested: false } : null));
            break;

          case 'heartbeat':
            connectionHealth.updateOpponentHeartbeat(content.timestamp);
            break;

          case 'rematch':
            if (content.action === 'request') {
              setOpponent((prev) => (prev ? { ...prev, rematchRequested: true } : null));
              dispatchBattleEvent(BATTLE_EVENTS.REMATCH_REQUESTED);
            } else if (content.action === 'accept' && content.newSeed) {
              resetForRematch(content.newSeed);
            }
            break;
        }
      } catch (e) {
        console.error('Failed to parse room event:', e);
      }
    },
    [
      nostr.publicKey,
      roomState.roomId,
      roomState.isHost,
      roomState.seed,
      roomState.createdAt,
      persistence,
      connectionHealth,
      resetForRematch,
    ]
  );

  // Subscribe to room events
  const subscribeToRoom = useCallback(
    (roomId: string) => {
      const unsubscribe = nostr.subscribe(
        [{ kinds: [NOSTR_EVENT_KINDS.EPHEMERAL], '#d': [createRoomTag(roomId)] }],
        handleRoomEvent
      );
      unsubscribeRef.current = unsubscribe;
    },
    [nostr, handleRoomEvent]
  );

  // Create a new battle room
  const createRoom = useCallback(async (): Promise<string> => {
    const roomId = generateRoomId();
    const seed = generateSeed();
    const createdAt = Date.now();

    setRoomState({ roomId, status: 'waiting', isHost: true, seed, createdAt });
    persistence.saveRoom({ roomId, isHost: true, seed, createdAt });

    const content: RoomEventContent = {
      type: 'room',
      status: 'waiting',
      seed,
      hostPubkey: nostr.publicKey,
    };

    await nostr.publish({
      kind: NOSTR_EVENT_KINDS.ROOM,
      tags: [
        ['d', createRoomTag(roomId)],
        ['t', 'sasso'],
      ],
      content: JSON.stringify(content),
    });

    subscribeToRoom(roomId);
    return `${window.location.origin}/battle/${roomId}`;
  }, [nostr, generateRoomId, persistence, subscribeToRoom]);

  // Join an existing room
  const joinRoom = useCallback(
    async (roomId: string): Promise<void> => {
      setRoomState((prev) => ({ ...prev, roomId, status: 'joining', isHost: false }));

      // Fetch room info with timeout
      const roomEvents = await new Promise<NostrEvent[]>((resolve) => {
        const events: NostrEvent[] = [];
        const unsubscribe = nostr.subscribe(
          [{ kinds: [NOSTR_EVENT_KINDS.ROOM], '#d': [createRoomTag(roomId)], limit: 1 }],
          (event) => events.push(event)
        );
        setTimeout(() => {
          unsubscribe();
          resolve(events);
        }, 2000);
      });

      if (roomEvents.length === 0) {
        setRoomState((prev) => ({ ...prev, status: 'idle', roomId: null }));
        throw new Error('Room not found');
      }

      const roomContent = JSON.parse(roomEvents[0].content) as RoomEventContent;
      const roomCreatedAt = (roomEvents[0].created_at || 0) * 1000;

      if (persistence.isExpired(roomCreatedAt)) {
        setRoomState((prev) => ({ ...prev, status: 'idle', roomId: null }));
        throw new Error('Room has expired');
      }

      setRoomState((prev) => ({
        ...prev,
        seed: roomContent.seed,
        status: 'ready',
        createdAt: roomCreatedAt,
      }));
      setOpponent(createInitialOpponent(roomContent.hostPubkey));
      persistence.saveRoom({
        roomId,
        isHost: false,
        seed: roomContent.seed,
        createdAt: roomCreatedAt,
        opponentPubkey: roomContent.hostPubkey,
      });

      const joinContent: JoinEventContent = { type: 'join', playerPubkey: nostr.publicKey };
      await nostr.publish({
        kind: NOSTR_EVENT_KINDS.EPHEMERAL,
        tags: [['d', createRoomTag(roomId)]],
        content: JSON.stringify(joinContent),
      });

      subscribeToRoom(roomId);
    },
    [nostr, persistence, subscribeToRoom]
  );

  // Leave the current room
  const leaveRoom = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    persistence.clearRoom();
    setRoomState(INITIAL_ROOM_STATE);
    setOpponent(null);
  }, [persistence]);

  // Send state update (throttled)
  const sendState = useCallback(
    (state: SassoGameState) => {
      const now = Date.now();
      if (now - lastStateUpdateRef.current < NOSTR_TIMEOUTS.STATE_THROTTLE) return;
      lastStateUpdateRef.current = now;

      if (roomState.roomId) {
        publishToRoom(nostr, roomState.roomId, {
          type: 'state',
          gameState: state,
        });
      }
    },
    [nostr, roomState.roomId]
  );

  // Send attack event
  const sendAttack = useCallback(
    (power: number) => {
      if (roomState.roomId) {
        publishToRoom(nostr, roomState.roomId, { type: 'attack', power, timestamp: Date.now() });
      }
    },
    [nostr, roomState.roomId]
  );

  // Send game over event
  const sendGameOver = useCallback(
    (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => {
      if (roomState.roomId) {
        publishToRoom(nostr, roomState.roomId, {
          type: 'gameover',
          reason,
          finalScore,
          winner: opponent?.publicKey || '',
        });
        setRoomState((prev) => ({ ...prev, status: 'finished' }));
      }
    },
    [nostr, roomState.roomId, opponent]
  );

  // Request rematch
  const requestRematch = useCallback(() => {
    if (!roomState.roomId || roomState.status !== 'finished') return;

    setRoomState((prev) => ({ ...prev, rematchRequested: true }));
    publishToRoom(nostr, roomState.roomId, { type: 'rematch', action: 'request' });

    // If opponent already requested, accept immediately
    if (opponent?.rematchRequested) {
      acceptRematch();
    }
  }, [nostr, roomState.roomId, roomState.status, opponent?.rematchRequested]);

  // Accept rematch
  const acceptRematch = useCallback(() => {
    if (!roomState.roomId) return;

    const newSeed = generateSeed();
    publishToRoom(nostr, roomState.roomId, { type: 'rematch', action: 'accept', newSeed });
    resetForRematch(newSeed);
  }, [nostr, roomState.roomId, resetForRematch]);

  // Attempt reconnection on mount
  useEffect(() => {
    if (!nostr.isConnected) return;

    const storedRoom = persistence.loadRoom();
    if (!storedRoom) return;

    setRoomState({
      roomId: storedRoom.roomId,
      status: 'joining',
      isHost: storedRoom.isHost,
      seed: storedRoom.seed,
      createdAt: storedRoom.createdAt,
    });

    if (storedRoom.opponentPubkey) {
      setOpponent({
        ...createInitialOpponent(storedRoom.opponentPubkey),
        isConnected: false,
        lastHeartbeat: 0,
      });
    }

    subscribeToRoom(storedRoom.roomId);

    // Announce reconnection
    nostr.publish({
      kind: NOSTR_EVENT_KINDS.EPHEMERAL,
      tags: [['d', createRoomTag(storedRoom.roomId)]],
      content: JSON.stringify({ type: 'join', playerPubkey: nostr.publicKey }),
    });

    // Set final status after brief delay
    setTimeout(() => {
      setRoomState((prev) => ({
        ...prev,
        status: storedRoom.opponentPubkey ? 'ready' : 'waiting',
      }));
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nostr.isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return {
    ...roomState,
    opponent,
    createRoom,
    joinRoom,
    leaveRoom,
    sendState,
    sendAttack,
    sendGameOver,
    requestRematch,
    acceptRematch,
  };
}
