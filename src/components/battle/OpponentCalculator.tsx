import styles from './OpponentCalculator.module.css';

interface OpponentCalculatorProps {
  display: string;
  score: number;
  chains: number;
  calculationHistory: string;
  isConnected: boolean;
}

/**
 * Full opponent calculator display for PC layout.
 * Shows a read-only view of opponent's calculator state.
 */
export function OpponentCalculator({
  display,
  score,
  chains,
  calculationHistory,
  isConnected,
}: OpponentCalculatorProps) {
  return (
    <div className={`${styles.opponentCalculator} ${!isConnected ? styles.disconnected : ''}`}>
      <div className={styles.opponentWindow}>
        <div className={styles.opponentTitleBar}>
          <span className={styles.opponentTitle}>Opponent</span>
          {!isConnected && <span className={styles.disconnectedIndicator} />}
        </div>
        <div className={styles.opponentWindowContent}>
          <div className={styles.opponentMainDisplay}>
            {display.split('').map((char, idx) => (
              <span key={idx} className={styles.digit}>
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.opponentScorePanel}>
        <div className={styles.opponentScoreRow}>
          <span>Score: {score}</span>
          {chains > 0 && <span>Chains: {chains}</span>}
        </div>
      </div>

      {calculationHistory && <div className={styles.opponentCalcHistory}>{calculationHistory}</div>}
    </div>
  );
}
