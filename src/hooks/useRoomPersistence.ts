import { useCallback } from 'react';
import { NOSTR_TIMEOUTS } from '../constants/nostr';

const ROOM_STORAGE_KEY = 'sasso-battle-room';

export interface StoredRoomData {
  roomId: string;
  isHost: boolean;
  seed: number;
  createdAt: number;
  opponentPubkey?: string;
}

interface UseRoomPersistenceReturn {
  saveRoom: (data: StoredRoomData) => void;
  loadRoom: () => StoredRoomData | null;
  clearRoom: () => void;
  isExpired: (createdAt: number) => boolean;
}

/**
 * Manages room persistence in localStorage for reconnection support.
 */
export function useRoomPersistence(): UseRoomPersistenceReturn {
  const saveRoom = useCallback((data: StoredRoomData) => {
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(data));
  }, []);

  const loadRoom = useCallback((): StoredRoomData | null => {
    const stored = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!stored) return null;

    try {
      const data: StoredRoomData = JSON.parse(stored);

      // Check if room has expired
      if (Date.now() - data.createdAt > NOSTR_TIMEOUTS.ROOM_EXPIRY) {
        localStorage.removeItem(ROOM_STORAGE_KEY);
        return null;
      }

      return data;
    } catch {
      localStorage.removeItem(ROOM_STORAGE_KEY);
      return null;
    }
  }, []);

  const clearRoom = useCallback(() => {
    localStorage.removeItem(ROOM_STORAGE_KEY);
  }, []);

  const isExpired = useCallback((createdAt: number): boolean => {
    return Date.now() - createdAt > NOSTR_TIMEOUTS.ROOM_EXPIRY;
  }, []);

  return { saveRoom, loadRoom, clearRoom, isExpired };
}
