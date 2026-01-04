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
    <div className={`opponent-score ${!isConnected ? 'disconnected' : ''}`}>
      <div className="opponent-score-header">
        <span className="opponent-label">Opponent</span>
        {!isConnected && <span className="disconnected-badge">Disconnected</span>}
      </div>
      <div className="opponent-score-content">
        <div className="opponent-display">{display}</div>
        <div className="opponent-stats">
          <span className="opponent-score-value">Score: {score}</span>
          {chains > 0 && <span className="opponent-chains">Chains: {chains}</span>}
        </div>
      </div>
      {calculationHistory && <div className="opponent-history">{calculationHistory}</div>}
    </div>
  );
}
