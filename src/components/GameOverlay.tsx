interface GameOverOverlayProps {
  isSurrender: boolean;
  onRetry: () => void;
}

export function GameOverOverlay({ isSurrender, onRetry }: GameOverOverlayProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-message">{isSurrender ? 'SURRENDER' : 'GAME OVER'}</div>
      <button className="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function StartPrompt() {
  return <div className="start-prompt">Press any button to start</div>;
}
