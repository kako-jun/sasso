import styles from './GameOverlay.module.css';

interface GameOverOverlayProps {
  isSurrender: boolean;
  onRetry: () => void;
}

export function GameOverOverlay({ isSurrender, onRetry }: GameOverOverlayProps) {
  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverMessage}>{isSurrender ? 'SURRENDER' : 'GAME OVER'}</div>
      <button className={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function StartPrompt() {
  return <div className={styles.startPrompt}>Press any button to start</div>;
}
