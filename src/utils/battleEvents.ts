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
