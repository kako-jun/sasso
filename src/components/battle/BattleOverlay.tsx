import { QRCodeSVG } from 'qrcode.react';
import type { RoomStatus } from '../../types/battle';
import styles from './BattleOverlay.module.css';

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
    <div className={styles.battleOverlay}>
      <div className={styles.battleOverlayContent}>{children}</div>
    </div>
  );
}

// Waiting for opponent overlay
function WaitingOverlay({ roomUrl, onLeave }: { roomUrl?: string; onLeave?: () => void }) {
  return (
    <OverlayWrapper>
      <div className={styles.battleStatus}>Waiting for opponent...</div>
      {roomUrl && (
        <>
          <div className={styles.qrCode}>
            <QRCodeSVG value={roomUrl} size={120} />
          </div>
          <div className={styles.roomUrlDisplay}>
            <input
              type="text"
              className={styles.roomUrlInput}
              value={roomUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              className={styles.copyButton}
              onClick={() => navigator.clipboard.writeText(roomUrl)}
            >
              Copy
            </button>
          </div>
        </>
      )}
      <button className={styles.leaveButton} onClick={onLeave}>
        Cancel
      </button>
    </OverlayWrapper>
  );
}

// Ready to start overlay
function ReadyOverlay() {
  return (
    <OverlayWrapper>
      <div className={styles.battleStatus}>Opponent found!</div>
      <div className={styles.battleStartHint}>Press any button to start</div>
    </OverlayWrapper>
  );
}

// Joining room overlay
function JoiningOverlay() {
  return (
    <OverlayWrapper>
      <div className={styles.battleStatus}>Joining room...</div>
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
      <div className={`${styles.battleResult} ${isWinner ? styles.victory : styles.defeat}`}>
        {resultMessage}
      </div>
      <div className={styles.battleScores}>
        <div className={styles.battleScoreRow}>
          <span>You:</span>
          <span>{playerScore ?? 0}</span>
        </div>
        <div className={styles.battleScoreRow}>
          <span>Opponent:</span>
          <span>{opponentScore ?? 0}</span>
        </div>
      </div>
      {showRematchHighlight && (
        <div className={styles.rematchNotification}>Opponent wants a rematch!</div>
      )}
      <div className={styles.battleButtons}>
        {onRetry && (
          <button
            className={`${styles.retryButton} ${showRematchHighlight ? styles.highlight : ''}`}
            onClick={onRetry}
            disabled={isRematchDisabled}
          >
            {getRematchButtonLabel()}
          </button>
        )}
        <button className={styles.leaveButton} onClick={onLeave}>
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
