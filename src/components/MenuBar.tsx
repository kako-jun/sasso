import type { GameMode } from '../types';
import { GITHUB_URL } from '../constants';

interface MenuBarProps {
  gameMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  score?: number;
  sprintTimeRemaining?: number;
  gameStarted?: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function MenuBar({
  gameMode,
  onChangeMode,
  score,
  sprintTimeRemaining,
  gameStarted,
}: MenuBarProps) {
  const showScore = gameMode !== 'calculator';
  const showSprintTimer = gameMode === 'sprint' && gameStarted && sprintTimeRemaining !== undefined;

  return (
    <header className="menu-bar">
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        <span className="github-logo"></span>
      </a>
      <span
        className={`menu-item ${gameMode === 'calculator' ? 'active' : ''}`}
        onClick={() => onChangeMode('calculator')}
      >
        Calculator
      </span>
      <span
        className={`menu-item ${gameMode === 'practice' ? 'active' : ''}`}
        onClick={() => onChangeMode('practice')}
      >
        Practice
      </span>
      <span
        className={`menu-item ${gameMode === 'sprint' ? 'active' : ''}`}
        onClick={() => onChangeMode('sprint')}
      >
        {showSprintTimer ? formatTime(sprintTimeRemaining) : 'Sprint'}
      </span>
      <span
        className={`menu-item ${gameMode === 'endless' ? 'active' : ''}`}
        onClick={() => onChangeMode('endless')}
      >
        Endless
      </span>
      <div className="menu-spacer" />
      {showScore && <span className="status-item">{(score ?? 0).toLocaleString()}</span>}
    </header>
  );
}
