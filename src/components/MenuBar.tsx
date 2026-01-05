import { useState, useRef, useEffect } from 'react';
import type { GameMode } from '../types';
import { GITHUB_URL } from '../constants';

interface MenuBarProps {
  gameMode: GameMode;
  onChangeMode: (mode: GameMode) => void;
  score?: number;
  sprintTimeRemaining?: number;
  gameStarted?: boolean;
}

const GAME_MODES: { mode: GameMode; label: string }[] = [
  { mode: 'practice', label: 'Practice' },
  { mode: 'sprint', label: 'Sprint' },
  { mode: 'endless', label: 'Endless' },
  { mode: 'battle', label: 'Battle' },
];

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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const showScore = gameMode !== 'calculator';
  const showSprintTimer = gameMode === 'sprint' && gameStarted && sprintTimeRemaining !== undefined;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeSelect = (mode: GameMode) => {
    onChangeMode(mode);
    setIsOpen(false);
  };

  const isGameMode = gameMode !== 'calculator';

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

      <div className="menu-dropdown" ref={menuRef}>
        <span
          className={`menu-item ${isOpen || isGameMode ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          Game
        </span>
        {isOpen && (
          <div className="menu-dropdown-content">
            {GAME_MODES.map(({ mode, label }) => (
              <div
                key={mode}
                className={`menu-dropdown-item ${gameMode === mode ? 'selected' : ''}`}
                onClick={() => handleModeSelect(mode)}
              >
                {label}
                {gameMode === mode && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="menu-spacer" />

      {showSprintTimer && (
        <span className="status-item timer">{formatTime(sprintTimeRemaining)}</span>
      )}
      {showScore && <span className="status-item">{(score ?? 0).toLocaleString()}</span>}
    </header>
  );
}
