import type { GameMode } from '../types';
import { GITHUB_URL } from '../constants';

interface MenuBarProps {
  gameMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
}

export function MenuBar({ gameMode, onChangeMode }: MenuBarProps) {
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
        className={`menu-item ${gameMode === 'endless' ? 'active' : ''}`}
        onClick={() => onChangeMode('endless')}
      >
        Endless
      </span>
      <div className="menu-spacer" />
    </header>
  );
}
