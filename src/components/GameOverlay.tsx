import styles from './GameOverlay.module.css';
import { SprintRanking } from './SprintRanking';

interface GameOverOverlayProps {
  isSurrender: boolean;
  onRetry: () => void;
  gameMode?: string;
  score?: number;
}

export function GameOverOverlay({ isSurrender, onRetry, gameMode, score }: GameOverOverlayProps) {
  const showRanking = gameMode === 'sprint' && !isSurrender;

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverMessage}>{isSurrender ? 'SURRENDER' : 'GAME OVER'}</div>
      {showRanking && (
        <>
          <div className={styles.yourScore}>Your score: {(score ?? 0).toLocaleString()}</div>
          <SprintRanking playerScore={score ?? 0} />
        </>
      )}
      <button className={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function StartPrompt() {
  return <div className={styles.startPrompt}>Press any button to start</div>;
}
