import type { AttackParams } from './index';

// Room States
export type RoomStatus =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'ready'
  | 'playing'
  | 'finished';

export interface RoomState {
  roomId: string | null;
  status: RoomStatus;
  isHost: boolean;
  seed: number;
}

// Opponent State
export interface OpponentState {
  publicKey: string;
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
  isConnected: boolean;
}

// Nostr Event Contents
export interface RoomEventContent {
  type: 'room';
  status: 'waiting' | 'playing' | 'finished';
  seed: number;
  hostPubkey: string;
}

export interface JoinEventContent {
  type: 'join';
  playerPubkey: string;
}

export interface StateEventContent {
  type: 'state';
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
}

export interface KeypressEventContent {
  type: 'keypress';
  key: string;
  timestamp: number;
}

export interface AttackEventContent {
  type: 'attack';
  power: number;
  timestamp: number;
}

export interface GameOverEventContent {
  type: 'gameover';
  reason: 'overflow' | 'surrender' | 'disconnect';
  finalScore: number;
  winner: string;
}

export type BattleEventContent =
  | RoomEventContent
  | JoinEventContent
  | StateEventContent
  | KeypressEventContent
  | AttackEventContent
  | GameOverEventContent;

// Battle Mode State
export interface BattleState {
  room: RoomState;
  opponent: OpponentState | null;
  incomingAttack: AttackParams | null;
  isUnderAttack: boolean;
  pendingAttackCount: number;
}

// Nostr Filter for subscriptions
export interface NostrFilter {
  kinds?: number[];
  authors?: string[];
  '#d'?: string[];
  '#t'?: string[];
  since?: number;
  until?: number;
  limit?: number;
}

// Nostr Event structure
export interface NostrEvent {
  id?: string;
  pubkey?: string;
  created_at?: number;
  kind: number;
  tags: string[][];
  content: string;
  sig?: string;
}
