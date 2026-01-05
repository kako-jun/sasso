import styles from './OpponentScore.module.css';

interface OpponentScoreProps {
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
  isConnected: boolean;
}

/**
 * Compact opponent score display for mobile layout.
 * Shows opponent's score, current display, and calculation history.
 */
export function OpponentScore({
  display,
  score,
  chains,
  calculationHistory,
  isConnected,
}: OpponentScoreProps) {
  return (
    <div className={`${styles.opponentScore} ${!isConnected ? styles.disconnected : ''}`}>
      <div className={styles.opponentScoreHeader}>
        <span className={styles.opponentLabel}>Opponent</span>
        {!isConnected && <span className={styles.disconnectedBadge}>Disconnected</span>}
      </div>
      <div className={styles.opponentScoreContent}>
        <div className={styles.opponentDisplay}>{display}</div>
        <div className={styles.opponentStats}>
          <span>Score: {score}</span>
          {chains > 0 && <span>Chains: {chains}</span>}
        </div>
      </div>
      {calculationHistory && <div className={styles.opponentHistory}>{calculationHistory}</div>}
    </div>
  );
}
