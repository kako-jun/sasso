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
  onStart?: () => void;
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
function ReadyOverlay({ onStart }: { onStart?: () => void }) {
  return (
    <div className={styles.battleOverlay} onClick={onStart}>
      <div className={styles.battleOverlayContent}>
        <div className={styles.battleStatus}>Opponent found!</div>
        <div className={styles.battleStartHint}>Tap to start</div>
      </div>
    </div>
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

interface BattleFinishedOverlayProps {
  isWinner: boolean | null;
  isSurrender: boolean;
  rematchRequested?: boolean;
  opponentRematchRequested?: boolean;
  onRetry?: () => void;
  onLeave?: () => void;
}

/**
 * Battle finished overlay - displayed inside the calculator window
 * Similar to single-player GameOverOverlay
 */
export function BattleFinishedOverlay({
  isWinner,
  isSurrender,
  rematchRequested,
  opponentRematchRequested,
  onRetry,
  onLeave,
}: BattleFinishedOverlayProps) {
  const resultMessage =
    isWinner === null ? 'DRAW' : isWinner ? 'VICTORY' : isSurrender ? 'SURRENDER' : 'DEFEAT';

  const getRematchButtonLabel = () => {
    if (rematchRequested && opponentRematchRequested) return 'Starting...';
    if (rematchRequested) return 'Waiting...';
    if (opponentRematchRequested) return 'Accept Rematch';
    return 'Rematch';
  };

  const isRematchDisabled = rematchRequested && !opponentRematchRequested;
  const showRematchHighlight = opponentRematchRequested && !rematchRequested;

  return (
    <div className={styles.finishedOverlay}>
      <div className={styles.finishedMessage}>{resultMessage}</div>
      {showRematchHighlight && (
        <div className={styles.rematchNotification}>Opponent wants a rematch!</div>
      )}
      <div className={styles.finishedButtons}>
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
    </div>
  );
}

/**
 * Battle overlay for various states:
 * - Waiting for opponent
 * - Ready to start
 * - Joining room
 * Note: Finished state is handled by BattleFinishedOverlay inside Window
 */
export function BattleOverlay({
  status,
  roomUrl,
  isGameStarted,
  onStart,
  onLeave,
}: Pick<BattleOverlayProps, 'status' | 'roomUrl' | 'isGameStarted' | 'onStart' | 'onLeave'>) {
  switch (status) {
    case 'waiting':
      return <WaitingOverlay roomUrl={roomUrl} onLeave={onLeave} />;

    case 'ready':
      if (!isGameStarted) return <ReadyOverlay onStart={onStart} />;
      return null;

    case 'joining':
      return <JoiningOverlay />;

    default:
      return null;
  }
}
