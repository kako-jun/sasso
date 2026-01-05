import styles from './OpponentHeader.module.css';

interface OpponentHeaderProps {
  score: number;
  isConnected: boolean;
}

/**
 * Simple header bar for opponent side on desktop.
 * Shows only score and connection status.
 */
export function OpponentHeader({ score, isConnected }: OpponentHeaderProps) {
  return (
    <header className={styles.opponentHeader}>
      {!isConnected && <span className={styles.disconnected}>(Disconnected)</span>}
      <span className={styles.label}>vs</span>
      <span className={styles.spacer} />
      <span className={styles.score}>{score.toLocaleString()}</span>
    </header>
  );
}
