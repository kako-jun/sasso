import styles from './MobileOpponentScore.module.css';

interface MobileOpponentScoreProps {
  score: number;
  isConnected: boolean;
}

/**
 * Simple opponent score display for mobile - shown below MenuBar.
 */
export function MobileOpponentScore({ score, isConnected }: MobileOpponentScoreProps) {
  return (
    <div className={styles.opponentScoreBar}>
      <span className={styles.label}>vs</span>
      <span className={styles.score}>{score.toLocaleString()}</span>
      {!isConnected && <span className={styles.disconnected}>(Disconnected)</span>}
    </div>
  );
}
