import type { ScoreResult } from '../gameLogic';

interface ScoreAreaProps {
  score: number;
  chains: number;
  lastScoreBreakdown: ScoreResult | null;
}

export function ScoreArea({ score, chains, lastScoreBreakdown }: ScoreAreaProps) {
  return (
    <div className="player-score-area">
      <div className="score-display">
        <span className="score-value">Score: {score}</span>
        <span className="chain-value">Chains: {chains}</span>
      </div>
      {lastScoreBreakdown && (
        <div className="score-breakdown">
          <div className="score-formula">
            +{lastScoreBreakdown.totalScore} = {lastScoreBreakdown.baseScore}×
            {lastScoreBreakdown.chainMultiplier}×{lastScoreBreakdown.prepBonus.toFixed(1)}×
            {lastScoreBreakdown.riskBonus.toFixed(1)}
          </div>
          <div className="score-labels">(Base×Chain×Prep×Risk)</div>
        </div>
      )}
    </div>
  );
}
