import type { RoomStatus } from '../../types/battle';

interface BattleOverlayProps {
  status: RoomStatus;
  roomUrl?: string;
  isWinner: boolean | null;
  isSurrender: boolean;
  isGameStarted: boolean;
  opponentScore?: number;
  playerScore?: number;
  rematchRequested?: boolean;
  opponentRematchRequested?: boolean;
  onRetry?: () => void;
  onLeave?: () => void;
}

// Shared overlay wrapper
function OverlayWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="battle-overlay">
      <div className="battle-overlay-content">{children}</div>
    </div>
  );
}

// Waiting for opponent overlay
function WaitingOverlay({ roomUrl, onLeave }: { roomUrl?: string; onLeave?: () => void }) {
  return (
    <OverlayWrapper>
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
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(roomUrl)}>
            Copy
          </button>
        </div>
      )}
      <button className="leave-button" onClick={onLeave}>
        Cancel
      </button>
    </OverlayWrapper>
  );
}

// Ready to start overlay
function ReadyOverlay() {
  return (
    <OverlayWrapper>
      <div className="battle-status">Opponent found!</div>
      <div className="battle-start-hint">Press any button to start</div>
    </OverlayWrapper>
  );
}

// Joining room overlay
function JoiningOverlay() {
  return (
    <OverlayWrapper>
      <div className="battle-status">Joining room...</div>
    </OverlayWrapper>
  );
}

// Game finished overlay
function FinishedOverlay({
  isWinner,
  isSurrender,
  playerScore,
  opponentScore,
  rematchRequested,
  opponentRematchRequested,
  onRetry,
  onLeave,
}: {
  isWinner: boolean | null;
  isSurrender: boolean;
  playerScore?: number;
  opponentScore?: number;
  rematchRequested?: boolean;
  opponentRematchRequested?: boolean;
  onRetry?: () => void;
  onLeave?: () => void;
}) {
  const resultMessage =
    isWinner === null ? 'DRAW' : isWinner ? 'VICTORY!' : isSurrender ? 'SURRENDER' : 'DEFEAT';

  const getRematchButtonLabel = () => {
    if (rematchRequested && opponentRematchRequested) return 'Starting...';
    if (rematchRequested) return 'Waiting...';
    if (opponentRematchRequested) return 'Accept Rematch';
    return 'Rematch';
  };

  const isRematchDisabled = rematchRequested && !opponentRematchRequested;
  const showRematchHighlight = opponentRematchRequested && !rematchRequested;

  return (
    <OverlayWrapper>
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
      {showRematchHighlight && (
        <div className="rematch-notification">Opponent wants a rematch!</div>
      )}
      <div className="battle-buttons">
        {onRetry && (
          <button
            className={`retry-button ${showRematchHighlight ? 'highlight' : ''}`}
            onClick={onRetry}
            disabled={isRematchDisabled}
          >
            {getRematchButtonLabel()}
          </button>
        )}
        <button className="leave-button" onClick={onLeave}>
          Leave
        </button>
      </div>
    </OverlayWrapper>
  );
}

/**
 * Battle overlay for various states:
 * - Waiting for opponent
 * - Ready to start
 * - Joining room
 * - Game finished (Victory/Defeat)
 */
export function BattleOverlay({
  status,
  roomUrl,
  isWinner,
  isSurrender,
  isGameStarted,
  opponentScore,
  playerScore,
  rematchRequested,
  opponentRematchRequested,
  onRetry,
  onLeave,
}: BattleOverlayProps) {
  switch (status) {
    case 'waiting':
      return <WaitingOverlay roomUrl={roomUrl} onLeave={onLeave} />;

    case 'ready':
      if (!isGameStarted) return <ReadyOverlay />;
      return null;

    case 'joining':
      return <JoiningOverlay />;

    case 'finished':
      return (
        <FinishedOverlay
          isWinner={isWinner}
          isSurrender={isSurrender}
          playerScore={playerScore}
          opponentScore={opponentScore}
          rematchRequested={rematchRequested}
          opponentRematchRequested={opponentRematchRequested}
          onRetry={onRetry}
          onLeave={onLeave}
        />
      );

    default:
      return null;
  }
}
