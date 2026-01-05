// Sasso-specific game state (matches nostr-battle-room TGameState)
export interface SassoGameState {
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
  /** Attack event (timestamp used to detect new attacks) */
  attack?: { power: number; timestamp: number };
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
