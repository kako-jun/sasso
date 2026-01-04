import { useCallback, useEffect, useRef } from 'react';
import { NOSTR_TIMEOUTS } from '../constants/nostr';
import { publishToRoom } from '../utils/battleEvents';
import type { UseNostrReturn } from './useNostr';
import type { OpponentState } from '../types/battle';

interface UseConnectionHealthOptions {
  nostr: UseNostrReturn;
  roomId: string | null;
  isActive: boolean;
  onOpponentDisconnect: () => void;
  setOpponent: React.Dispatch<React.SetStateAction<OpponentState | null>>;
}

interface UseConnectionHealthReturn {
  updateOpponentHeartbeat: (timestamp: number) => void;
}

/**
 * Manages connection health via heartbeat sending and disconnect detection.
 */
export function useConnectionHealth({
  nostr,
  roomId,
  isActive,
  onOpponentDisconnect,
  setOpponent,
}: UseConnectionHealthOptions): UseConnectionHealthReturn {
  const heartbeatIntervalRef = useRef<number | null>(null);
  const disconnectCheckIntervalRef = useRef<number | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const onDisconnectRef = useRef(onOpponentDisconnect);

  // Keep refs in sync
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    onDisconnectRef.current = onOpponentDisconnect;
  }, [onOpponentDisconnect]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = window.setInterval(() => {
      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) return;

      publishToRoom(nostr, currentRoomId, {
        type: 'heartbeat',
        timestamp: Date.now(),
      });
    }, NOSTR_TIMEOUTS.HEARTBEAT_INTERVAL);
  }, [nostr]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Start disconnect detection
  const startDisconnectCheck = useCallback(() => {
    if (disconnectCheckIntervalRef.current) return;

    disconnectCheckIntervalRef.current = window.setInterval(() => {
      setOpponent((prev) => {
        if (!prev || !prev.lastHeartbeat) return prev;

        const timeSinceLastHeartbeat = Date.now() - prev.lastHeartbeat;
        if (timeSinceLastHeartbeat > NOSTR_TIMEOUTS.DISCONNECT_THRESHOLD) {
          if (prev.isConnected) {
            onDisconnectRef.current();
            return { ...prev, isConnected: false };
          }
        }
        return prev;
      });
    }, 1000);
  }, [setOpponent]);

  // Stop disconnect detection
  const stopDisconnectCheck = useCallback(() => {
    if (disconnectCheckIntervalRef.current) {
      clearInterval(disconnectCheckIntervalRef.current);
      disconnectCheckIntervalRef.current = null;
    }
  }, []);

  // Update opponent heartbeat timestamp
  const updateOpponentHeartbeat = useCallback(
    (timestamp: number) => {
      setOpponent((prev) =>
        prev ? { ...prev, lastHeartbeat: timestamp, isConnected: true } : null
      );
    },
    [setOpponent]
  );

  // Manage heartbeat lifecycle
  useEffect(() => {
    if (isActive && roomId) {
      startHeartbeat();
      startDisconnectCheck();
    } else {
      stopHeartbeat();
      stopDisconnectCheck();
    }

    return () => {
      stopHeartbeat();
      stopDisconnectCheck();
    };
  }, [isActive, roomId, startHeartbeat, stopHeartbeat, startDisconnectCheck, stopDisconnectCheck]);

  return { updateOpponentHeartbeat };
}
