import type { AttackParams } from './index';

// Sasso-specific game state (matches nostr-battle-room TGameState)
export interface SassoGameState {
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
}

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
  createdAt?: number;
  rematchRequested?: boolean;
}

// Opponent State (matches nostr-battle-room OpponentState<TGameState>)
export interface OpponentState {
  publicKey: string;
  gameState: SassoGameState | null;
  isConnected: boolean;
  lastHeartbeat?: number;
  rematchRequested?: boolean;
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
  gameState: SassoGameState;
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

export interface RematchEventContent {
  type: 'rematch';
  action: 'request' | 'accept';
  newSeed?: number;
}

export interface HeartbeatEventContent {
  type: 'heartbeat';
  timestamp: number;
}

export type BattleEventContent =
  | RoomEventContent
  | JoinEventContent
  | StateEventContent
  | KeypressEventContent
  | AttackEventContent
  | GameOverEventContent
  | RematchEventContent
  | HeartbeatEventContent;

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
