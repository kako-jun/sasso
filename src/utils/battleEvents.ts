import { NOSTR_EVENT_KINDS, SASSO_TAG_PREFIX } from '../constants/nostr';
import type { UseNostrReturn } from '../hooks/useNostr';

/**
 * Creates a room tag for Nostr events.
 */
export function createRoomTag(roomId: string): string {
  return `${SASSO_TAG_PREFIX}${roomId}`;
}

/**
 * Helper to publish ephemeral events to a room.
 */
export function publishToRoom(
  nostr: UseNostrReturn,
  roomId: string,
  content: Record<string, unknown>
): void {
  nostr.publish({
    kind: NOSTR_EVENT_KINDS.EPHEMERAL,
    tags: [['d', createRoomTag(roomId)]],
    content: JSON.stringify(content),
  });
}

/**
 * Dispatches a custom battle event.
 */
export function dispatchBattleEvent<T>(eventName: string, detail?: T): void {
  window.dispatchEvent(new CustomEvent(eventName, detail ? { detail } : undefined));
}

// Battle event names
export const BATTLE_EVENTS = {
  ATTACK: 'sasso-attack',
  OPPONENT_GAMEOVER: 'sasso-opponent-gameover',
  OPPONENT_DISCONNECT: 'sasso-opponent-disconnect',
  REMATCH_REQUESTED: 'sasso-rematch-requested',
  REMATCH_START: 'sasso-rematch-start',
} as const;
