import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { RoomStatus } from '../../types/battle';
import { ROOM_EXPIRY_MS } from '../../types/battle';
import styles from './BattleOverlay.module.css';

const WAITING_NUDGE_MS = 60_000; // 60s: nudge to re-share

interface BattleOverlayProps {
  status: RoomStatus;
  roomUrl?: string;
  createdAt?: number;
  isWinner: boolean | null;
  isSurrender: boolean;
  isGameStarted: boolean;
  opponentScore?: number;
  playerScore?: number;
  rematchRequested?: boolean;
  opponentRematchRequested?: boolean;
  onStart?: () => void;
  onRetry?: () => void;
  onExpire?: () => void;
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
function WaitingOverlay({
  roomUrl,
  createdAt,
  onExpire,
  onLeave,
}: {
  roomUrl?: string;
  createdAt?: number;
  onExpire?: () => void;
  onLeave?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Without a creation timestamp we can't measure elapsed time; stay at 0.
    if (createdAt == null) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      const e = Date.now() - createdAt;
      setElapsed(e);
      // Once expired the link is dead; no need to keep ticking every second.
      if (e >= ROOM_EXPIRY_MS) clearInterval(id);
    };
    const id = setInterval(tick, 1000);
    tick(); // seed immediately so phase is correct on first paint
    return () => clearInterval(id);
  }, [createdAt]);

  // Room expired: the link is dead, so offer a fresh room instead of the QR/URL.
  if (elapsed >= ROOM_EXPIRY_MS) {
    return (
      <OverlayWrapper>
        <div className={styles.battleStatus}>This room has expired.</div>
        <div className={styles.waitingButtons}>
          <button className={styles.retryButton} onClick={() => onExpire?.()}>
            New Room
          </button>
          <button className={styles.leaveButton} onClick={onLeave}>
            Cancel
          </button>
        </div>
      </OverlayWrapper>
    );
  }

  return (
    <OverlayWrapper>
      <div className={styles.battleStatus}>Waiting for opponent...</div>
      {elapsed >= WAITING_NUDGE_MS && (
        <div className={styles.waitingHint}>
          Still waiting — try re-sharing the link with your opponent.
        </div>
      )}
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
        <div className={styles.battleStartHint}>Press any button to start</div>
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
  /** Round ended because of a disconnect (win: opponent left; loss: we were dropped). */
  isDisconnectEnd?: boolean;
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
  isDisconnectEnd,
  rematchRequested,
  opponentRematchRequested,
  onRetry,
  onLeave,
}: BattleFinishedOverlayProps) {
  const resultMessage = isDisconnectEnd
    ? isWinner
      ? 'OPPONENT LEFT'
      : 'DISCONNECTED'
    : isWinner === null
      ? 'DRAW'
      : isWinner
        ? 'VICTORY'
        : isSurrender
          ? 'SURRENDER'
          : 'DEFEAT';

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
  createdAt,
  isGameStarted,
  onStart,
  onExpire,
  onLeave,
}: Pick<
  BattleOverlayProps,
  'status' | 'roomUrl' | 'createdAt' | 'isGameStarted' | 'onStart' | 'onExpire' | 'onLeave'
>) {
  switch (status) {
    case 'waiting':
      return (
        <WaitingOverlay
          roomUrl={roomUrl}
          createdAt={createdAt}
          onExpire={onExpire}
          onLeave={onLeave}
        />
      );

    case 'ready':
      if (!isGameStarted) return <ReadyOverlay onStart={onStart} />;
      return null;

    case 'joining':
      return <JoiningOverlay />;

    default:
      return null;
  }
}
