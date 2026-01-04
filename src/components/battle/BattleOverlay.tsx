import type { RoomStatus } from '../../types/battle';

interface BattleOverlayProps {
  status: RoomStatus;
  roomUrl?: string;
  isWinner: boolean | null;
  isSurrender: boolean;
  isGameStarted: boolean;
  opponentScore?: number;
  playerScore?: number;
  onRetry?: () => void;
  onLeave?: () => void;
}

/**
 * Battle overlay for various states:
 * - Waiting for opponent
 * - Victory/Defeat
 * - Disconnect
 */
export function BattleOverlay({
  status,
  roomUrl,
  isWinner,
  isSurrender,
  isGameStarted,
  opponentScore,
  playerScore,
  onRetry,
  onLeave,
}: BattleOverlayProps) {
  // Waiting for opponent
  if (status === 'waiting') {
    return (
      <div className="battle-overlay">
        <div className="battle-overlay-content">
          <div className="battle-status">Waiting for opponent...</div>
          {roomUrl && (
            <div className="room-url-display">
              <div className="room-url-label">Share this URL:</div>
              <input
                type="text"
                className="room-url-input"
                value={roomUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(roomUrl)}
              >
                Copy
              </button>
            </div>
          )}
          <button className="leave-button" onClick={onLeave}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Ready to start (but game not yet started)
  if (status === 'ready' && !isGameStarted) {
    return (
      <div className="battle-overlay">
        <div className="battle-overlay-content">
          <div className="battle-status">Opponent found!</div>
          <div className="battle-start-hint">Press any button to start</div>
        </div>
      </div>
    );
  }

  // Game finished
  if (status === 'finished') {
    const resultMessage =
      isWinner === null ? 'DRAW' : isWinner ? 'VICTORY!' : isSurrender ? 'SURRENDER' : 'DEFEAT';

    return (
      <div className="battle-overlay">
        <div className="battle-overlay-content">
          <div className={`battle-result ${isWinner ? 'victory' : 'defeat'}`}>{resultMessage}</div>
          <div className="battle-scores">
            <div className="battle-score-row">
              <span>You:</span>
              <span>{playerScore ?? 0}</span>
            </div>
            <div className="battle-score-row">
              <span>Opponent:</span>
              <span>{opponentScore ?? 0}</span>
            </div>
          </div>
          <div className="battle-buttons">
            {onRetry && (
              <button className="retry-button" onClick={onRetry}>
                Rematch
              </button>
            )}
            <button className="leave-button" onClick={onLeave}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Joining room
  if (status === 'joining') {
    return (
      <div className="battle-overlay">
        <div className="battle-overlay-content">
          <div className="battle-status">Joining room...</div>
        </div>
      </div>
    );
  }

  return null;
}
