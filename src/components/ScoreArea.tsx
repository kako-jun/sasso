import type { ScoreResult } from '../types';
import styles from './ScoreArea.module.css';

interface ScoreAreaProps {
  lastScoreBreakdown: ScoreResult | null;
}

export function ScoreArea({ lastScoreBreakdown }: ScoreAreaProps) {
  if (!lastScoreBreakdown) return null;

  return (
    <div className={styles.playerScoreArea}>
      <div className={styles.scoreBreakdown}>
        <span className={styles.scoreEarned}>+{lastScoreBreakdown.totalScore}</span>
        <span className={styles.scoreFormula}>
          = {lastScoreBreakdown.baseScore} × {lastScoreBreakdown.chainMultiplier} ×{' '}
          {lastScoreBreakdown.prepBonus.toFixed(1)} × {lastScoreBreakdown.riskBonus.toFixed(1)}
        </span>
      </div>
      <div className={styles.scoreLabels}>(Base × Chain × Prep × Risk)</div>
    </div>
  );
}
