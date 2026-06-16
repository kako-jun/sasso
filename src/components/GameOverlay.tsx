import type { GameMode } from '../types';
import styles from './GameOverlay.module.css';
import { SprintRanking } from './SprintRanking';

interface GameOverOverlayProps {
  isSurrender: boolean;
  onRetry: () => void;
  gameMode: GameMode;
  score: number;
}

export function GameOverOverlay({ isSurrender, onRetry, gameMode, score }: GameOverOverlayProps) {
  const showRanking = gameMode === 'sprint' && !isSurrender;

  // Sprint ranking view: drop the big "GAME OVER" banner (the tallest element)
  // and lead with the score so the list + Retry fit inside the window.
  if (showRanking) {
    return (
      <div className={styles.gameOverOverlay}>
        <div className={styles.yourScore}>Your score: {score.toLocaleString()}</div>
        <SprintRanking playerScore={score} />
        <button className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

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
