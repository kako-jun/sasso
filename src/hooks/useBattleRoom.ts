import { useCallback, useEffect, useState, useRef } from 'react';
import type {
  RoomState,
  OpponentState,
  RoomEventContent,
  JoinEventContent,
  NostrEvent,
} from '../types/battle';
import { NOSTR_EVENT_KINDS, SASSO_TAG_PREFIX, NOSTR_TIMEOUTS } from '../constants/nostr';
import { generateSeed } from '../game';
import type { UseNostrReturn } from './useNostr';

export interface UseBattleRoomReturn extends RoomState {
  opponent: OpponentState | null;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  sendState: (display: string, score: number, chains: number, calculationHistory: string) => void;
  sendAttack: (power: number) => void;
  sendGameOver: (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => void;
}

export function useBattleRoom(nostr: UseNostrReturn): UseBattleRoomReturn {
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: null,
    status: 'idle',
    isHost: false,
    seed: 0,
  });
  const [opponent, setOpponent] = useState<OpponentState | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastStateUpdateRef = useRef<number>(0);

  // Generate unique room ID
  const generateRoomId = useCallback(() => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new battle room
  const createRoom = useCallback(async (): Promise<string> => {
    const roomId = generateRoomId();
    const seed = generateSeed();

    setRoomState({
      roomId,
      status: 'waiting',
      isHost: true,
      seed,
    });

    // Publish room creation event
    const content: RoomEventContent = {
      type: 'room',
      status: 'waiting',
      seed,
      hostPubkey: nostr.publicKey,
    };

    await nostr.publish({
      kind: NOSTR_EVENT_KINDS.ROOM,
      tags: [
        ['d', `${SASSO_TAG_PREFIX}${roomId}`],
        ['t', 'sasso'],
      ],
      content: JSON.stringify(content),
    });

    // Subscribe to room events
    const unsubscribe = nostr.subscribe(
      [
        {
          kinds: [NOSTR_EVENT_KINDS.EPHEMERAL],
          '#d': [`${SASSO_TAG_PREFIX}${roomId}`],
        },
      ],
      (event: NostrEvent) => handleRoomEvent(event)
    );
    unsubscribeRef.current = unsubscribe;

    return `${window.location.origin}/battle/${roomId}`;
  }, [nostr, generateRoomId]);

  // Join an existing room
  const joinRoom = useCallback(
    async (roomId: string): Promise<void> => {
      setRoomState((prev) => ({
        ...prev,
        roomId,
        status: 'joining',
        isHost: false,
      }));

      // First, fetch the room info
      const roomEvents = await new Promise<NostrEvent[]>((resolve) => {
        const events: NostrEvent[] = [];
        const unsubscribe = nostr.subscribe(
          [
            {
              kinds: [NOSTR_EVENT_KINDS.ROOM],
              '#d': [`${SASSO_TAG_PREFIX}${roomId}`],
              limit: 1,
            },
          ],
          (event) => {
            events.push(event);
          }
        );

        // Wait a bit for events to arrive
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

      setRoomState((prev) => ({
        ...prev,
        seed: roomContent.seed,
        status: 'ready',
      }));

      // Set opponent (the host)
      setOpponent({
        publicKey: roomContent.hostPubkey,
        display: '0',
        score: 0,
        chains: 0,
        calculationHistory: '',
        isConnected: true,
      });

      // Send join event
      const joinContent: JoinEventContent = {
        type: 'join',
        playerPubkey: nostr.publicKey,
      };

      await nostr.publish({
        kind: NOSTR_EVENT_KINDS.EPHEMERAL,
        tags: [['d', `${SASSO_TAG_PREFIX}${roomId}`]],
        content: JSON.stringify(joinContent),
      });

      // Subscribe to room events
      const unsubscribe = nostr.subscribe(
        [
          {
            kinds: [NOSTR_EVENT_KINDS.EPHEMERAL],
            '#d': [`${SASSO_TAG_PREFIX}${roomId}`],
          },
        ],
        (event: NostrEvent) => handleRoomEvent(event)
      );
      unsubscribeRef.current = unsubscribe;
    },
    [nostr]
  );

  // Handle incoming room events
  const handleRoomEvent = useCallback(
    (event: NostrEvent) => {
      // Ignore own events
      if (event.pubkey === nostr.publicKey) return;

      try {
        const content = JSON.parse(event.content);

        switch (content.type) {
          case 'join':
            // Someone joined our room
            setOpponent({
              publicKey: content.playerPubkey,
              display: '0',
              score: 0,
              chains: 0,
              calculationHistory: '',
              isConnected: true,
            });
            setRoomState((prev) => ({
              ...prev,
              status: 'ready',
            }));
            break;

          case 'state':
            // Update opponent state
            setOpponent((prev) =>
              prev
                ? {
                    ...prev,
                    display: content.display,
                    score: content.score,
                    chains: content.chains,
                    calculationHistory: content.calculationHistory,
                  }
                : null
            );
            break;

          case 'attack':
            // Handle incoming attack - this will be processed by useBattleMode
            // For now, just emit a custom event
            window.dispatchEvent(
              new CustomEvent('sasso-attack', {
                detail: { power: content.power, timestamp: content.timestamp },
              })
            );
            break;

          case 'gameover':
            // Opponent lost, so we won
            window.dispatchEvent(
              new CustomEvent('sasso-opponent-gameover', {
                detail: { reason: content.reason, finalScore: content.finalScore },
              })
            );
            setRoomState((prev) => ({
              ...prev,
              status: 'finished',
            }));
            break;
        }
      } catch (e) {
        console.error('Failed to parse room event:', e);
      }
    },
    [nostr.publicKey]
  );

  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setRoomState({
      roomId: null,
      status: 'idle',
      isHost: false,
      seed: 0,
    });
    setOpponent(null);
  }, []);

  // Send state update (throttled)
  const sendState = useCallback(
    (display: string, score: number, chains: number, calculationHistory: string) => {
      const now = Date.now();
      if (now - lastStateUpdateRef.current < NOSTR_TIMEOUTS.STATE_THROTTLE) {
        return;
      }
      lastStateUpdateRef.current = now;

      if (!roomState.roomId) return;

      nostr.publish({
        kind: NOSTR_EVENT_KINDS.EPHEMERAL,
        tags: [['d', `${SASSO_TAG_PREFIX}${roomState.roomId}`]],
        content: JSON.stringify({
          type: 'state',
          display,
          score,
          chains,
          calculationHistory,
        }),
      });
    },
    [nostr, roomState.roomId]
  );

  // Send attack event
  const sendAttack = useCallback(
    (power: number) => {
      if (!roomState.roomId) return;

      nostr.publish({
        kind: NOSTR_EVENT_KINDS.EPHEMERAL,
        tags: [['d', `${SASSO_TAG_PREFIX}${roomState.roomId}`]],
        content: JSON.stringify({
          type: 'attack',
          power,
          timestamp: Date.now(),
        }),
      });
    },
    [nostr, roomState.roomId]
  );

  // Send game over event
  const sendGameOver = useCallback(
    (reason: 'overflow' | 'surrender' | 'disconnect', finalScore: number) => {
      if (!roomState.roomId) return;

      nostr.publish({
        kind: NOSTR_EVENT_KINDS.EPHEMERAL,
        tags: [['d', `${SASSO_TAG_PREFIX}${roomState.roomId}`]],
        content: JSON.stringify({
          type: 'gameover',
          reason,
          finalScore,
          winner: opponent?.publicKey || '',
        }),
      });

      setRoomState((prev) => ({
        ...prev,
        status: 'finished',
      }));
    },
    [nostr, roomState.roomId, opponent]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
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
  };
}
