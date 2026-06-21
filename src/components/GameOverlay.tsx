import type { GameMode, GameOverReason } from '../types';
import styles from './GameOverlay.module.css';
import { SprintRanking } from './SprintRanking';

interface GameOverOverlayProps {
  reason: GameOverReason;
  onRetry: () => void;
  gameMode: GameMode;
  score: number;
}

// Big word + a small hint that names the death rule. We reveal only *why you
// died* — never strategy — so discovering how to score stays part of the game,
// while losing always tells you which rule you hit.
const REASON_LABELS: Record<Exclude<GameOverReason, null>, { title: string; hint: string }> = {
  overflow: { title: 'GAME OVER', hint: 'overflow' },
  timeup: { title: 'GAME OVER', hint: 'time up' },
  surrender: { title: 'SURRENDER', hint: 'C or E' },
  misinput: { title: 'SURRENDER', hint: 'digit after =' },
};

export function GameOverOverlay({ reason, onRetry, gameMode, score }: GameOverOverlayProps) {
  const label = reason ? REASON_LABELS[reason] : { title: 'GAME OVER', hint: '' };
  const isSurrender = reason === 'surrender' || reason === 'misinput';
  const showRanking = gameMode === 'sprint' && !isSurrender;

  // Sprint ranking view: drop the big banner (the tallest element) and lead with
  // the score so the list + Retry fit inside the window. Keep the small hint so
  // a time-up / overflow end still says why.
  if (showRanking) {
    return (
      <div className={styles.gameOverOverlay}>
        {label.hint && <div className={styles.gameOverHint}>{label.hint}</div>}
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
      <div className={styles.gameOverMessage}>{label.title}</div>
      {label.hint && <div className={styles.gameOverHint}>{label.hint}</div>}
      <button className={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function StartPrompt() {
  return <div className={styles.startPrompt}>Press any button to start</div>;
}
