import { useState, useRef, useEffect } from 'react';
import type { GameMode } from '../types';
import { GITHUB_URL } from '../constants';
import { AboutModal } from './AboutModal';
import styles from './MenuBar.module.css';

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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
    <header className={styles.menuBar}>
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
        <span className={styles.githubLogo}></span>
      </a>

      <span
        className={`${styles.menuItem} ${gameMode === 'calculator' ? styles.active : ''}`}
        onClick={() => onChangeMode('calculator')}
      >
        Calculator
      </span>

      <div className={styles.menuDropdown} ref={menuRef}>
        <span
          className={`${styles.menuItem} ${isOpen || isGameMode ? styles.active : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          Game
        </span>
        {isOpen && (
          <div className={styles.menuDropdownContent}>
            {GAME_MODES.map(({ mode, label }) => (
              <div
                key={mode}
                className={`${styles.menuDropdownItem} ${gameMode === mode ? styles.selected : ''}`}
                onClick={() => handleModeSelect(mode)}
              >
                {label}
                {gameMode === mode && <span className={styles.checkmark}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <span className={styles.menuItem} onClick={() => setIsAboutOpen(true)}>
        About
      </span>

      {showSprintTimer && (
        <span className={styles.timerItem}>{formatTime(sprintTimeRemaining)}</span>
      )}

      <div className={styles.menuSpacer} />

      {showScore && <span className={styles.statusItem}>{(score ?? 0).toLocaleString()}</span>}

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </header>
  );
}
