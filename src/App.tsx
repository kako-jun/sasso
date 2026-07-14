import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { useGameController, useKeyboard } from './hooks';
import {
  MenuBar,
  Window,
  Display,
  Keypad,
  ScoreArea,
  PredictionArea,
  CalculationHistory,
  GameOverOverlay,
  StartPrompt,
  MultiplicationHelper,
  BattleApp,
  InstallBanner,
} from './components';
import type { GameMode } from './types';

/**
 * Extract room ID from URL path /battle/{roomId}
 */
function getRoomIdFromUrl(): string | undefined {
  const path = window.location.pathname;
  const match = path.match(/^\/battle\/(.+)$/);
  return match ? match[1] : undefined;
}

/**
 * Main single-player app component
 */
function SinglePlayerApp({
  controller,
  onChangeMode,
  isPredictionMode,
}: {
  controller: ReturnType<typeof useGameController>;
  onChangeMode: (mode: GameMode) => void;
  isPredictionMode: boolean;
}) {
  useKeyboard(controller.handleKey);

  const isPlaying = controller.gameMode !== 'calculator';
  // isPredictionMode is computed once in App() (shared with the InstallBanner
  // visibility gate below) instead of duplicated here.

  return (
    <div className="desktop">
      <MenuBar
        gameMode={controller.gameMode}
        onChangeMode={onChangeMode}
        score={controller.score}
        sprintTimeRemaining={controller.sprintTimeRemaining}
        gameStarted={controller.gameStarted}
      />

      {isPredictionMode && controller.prediction && (
        <PredictionArea prediction={controller.prediction} countdown={controller.countdown} />
      )}

      {isPlaying && <ScoreArea lastScoreBreakdown={controller.lastScoreBreakdown} />}

      <Window title="Sasso" onClose={() => onChangeMode('calculator')}>
        {controller.isGameOver && (
          <GameOverOverlay
            reason={controller.gameOverReason}
            onRetry={controller.resetAll}
            gameMode={controller.gameMode}
            score={controller.score}
          />
        )}
        <Display value={controller.display} eliminatingIndices={controller.eliminatingIndices} />
        <Keypad onKey={controller.handleKey} />
      </Window>

      {isPlaying && <CalculationHistory text={controller.calculationHistory} />}

      {isPredictionMode && controller.prediction?.operator === '*' && (
        <MultiplicationHelper
          displayValue={controller.display}
          multiplier={controller.prediction.operand}
        />
      )}

      {isPlaying && !controller.gameStarted && <StartPrompt />}
    </div>
  );
}

function App() {
  const controller = useGameController();
  const [arenaRoomId, setBattleRoomId] = useState<string | undefined>(getRoomIdFromUrl);

  // Endless/Sprint mid-run: PredictionArea and (for '*' predictions)
  // MultiplicationHelper can occupy the bottom of short viewports (see their
  // @media (max-height: 720px/500px) rules). InstallBanner is also
  // bottom-fixed, so it's suppressed for the whole of this window rather than
  // only while a '*' prediction is showing - simpler than tracking viewport
  // height in JS, and non-overlap holds by construction.
  const isPredictionMode =
    (controller.gameMode === 'endless' || controller.gameMode === 'sprint') &&
    controller.gameStarted &&
    !controller.isGameOver;

  // Handle URL changes (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const roomId = getRoomIdFromUrl();
      setBattleRoomId(roomId);
      if (roomId) {
        controller.handleModeChange('battle');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [controller]);

  // Handle initial URL routing
  useEffect(() => {
    const roomId = getRoomIdFromUrl();
    if (roomId) {
      setBattleRoomId(roomId);
      controller.handleModeChange('battle');
    }
  }, []);

  // 訪問者カウントをインクリメント（非表示、1日1回制限あり）
  useEffect(() => {
    fetch('https://api.nostalgic.llll-ll.com/visit?action=increment&id=sasso-5d582992').catch(
      () => {}
    );
  }, []);

  // Handle mode changes with URL updates
  const handleModeChange = useCallback(
    (mode: GameMode) => {
      if (mode === 'battle') {
        // Don't update URL here - battle mode will handle it
      } else {
        // Clear battle URL when leaving battle mode
        if (window.location.pathname.startsWith('/battle')) {
          window.history.pushState(null, '', '/');
        }
        setBattleRoomId(undefined);
      }
      controller.handleModeChange(mode);
    },
    [controller]
  );

  return (
    <>
      {!isPredictionMode && <InstallBanner />}
      {controller.gameMode === 'battle' ? (
        <BattleApp initialRoomId={arenaRoomId} onChangeMode={handleModeChange} />
      ) : (
        <SinglePlayerApp
          controller={controller}
          onChangeMode={handleModeChange}
          isPredictionMode={isPredictionMode}
        />
      )}
    </>
  );
}

export default App;
