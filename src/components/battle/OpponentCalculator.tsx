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
    <div className={`opponent-calculator ${!isConnected ? 'disconnected' : ''}`}>
      <div className="opponent-window">
        <div className="opponent-title-bar">
          <span className="opponent-title">Opponent</span>
          {!isConnected && <span className="disconnected-indicator" />}
        </div>
        <div className="opponent-window-content">
          <div className="opponent-main-display">
            {display.split('').map((char, idx) => (
              <span key={idx} className="digit">
                {char}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="opponent-score-panel">
        <div className="opponent-score-row">
          <span>Score: {score}</span>
          {chains > 0 && <span>Chains: {chains}</span>}
        </div>
      </div>

      {calculationHistory && <div className="opponent-calc-history">{calculationHistory}</div>}
    </div>
  );
}
