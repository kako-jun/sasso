import type { ScoreResult } from '../types';

interface ScoreAreaProps {
  lastScoreBreakdown: ScoreResult | null;
}

export function ScoreArea({ lastScoreBreakdown }: ScoreAreaProps) {
  if (!lastScoreBreakdown) return null;

  return (
    <div className="player-score-area">
      <div className="score-breakdown">
        <div className="score-formula">
          +{lastScoreBreakdown.totalScore} = {lastScoreBreakdown.baseScore} ×{' '}
          {lastScoreBreakdown.chainMultiplier} × {lastScoreBreakdown.prepBonus.toFixed(1)} ×{' '}
          {lastScoreBreakdown.riskBonus.toFixed(1)}
        </div>
        <div className="score-labels">(Base × Chain × Prep × Risk)</div>
      </div>
    </div>
  );
}
