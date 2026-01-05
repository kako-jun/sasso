import type { ScoreResult, Prediction } from './index';

// Sasso-specific game state (matches nostr-arena TGameState)
export interface SassoGameState {
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
  /** Attack event (timestamp used to detect new attacks) */
  attack?: { power: number; timestamp: number };
  /** Current prediction challenge */
  prediction?: Prediction | null;
  /** Countdown timer (ms remaining) */
  countdown?: number;
  /** Last score breakdown for popup */
  lastScoreBreakdown?: ScoreResult | null;
  /** Whether currently under attack effect */
  isUnderAttack?: boolean;
  /** Last pressed key for button animation */
  lastKey?: string | null;
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

// Opponent State (matches nostr-arena OpponentState<TGameState>)
export interface OpponentState {
  publicKey: string;
  gameState: SassoGameState | null;
  isConnected: boolean;
  lastHeartbeat?: number;
  rematchRequested?: boolean;
}
