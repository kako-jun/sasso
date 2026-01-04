import { useCallback, useEffect, useMemo } from 'react';
import type { GameMode } from '../types';
import { operatorToSymbol } from '../utils';
import { useCalculator } from './useCalculator';
import { useGame } from './useGame';

export interface UseGameControllerReturn {
  // Calculator state
  display: string;

  // Game state
  gameMode: GameMode;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  score: number;
  chains: number;
  prediction: ReturnType<typeof useGame>['prediction'];
  countdown: number;
  eliminatingIndices: number[];
  calculationHistory: string;
  lastScoreBreakdown: ReturnType<typeof useGame>['lastScoreBreakdown'];

  // Actions
  handleKey: (key: string) => void;
  handleModeChange: (mode: GameMode) => void;
  resetAll: () => void;
}

export function useGameController(): UseGameControllerReturn {
  const calculator = useCalculator();

  const gameOptions = useMemo(
    () => ({
      onDisplayUpdate: (newDisplay: string) => {
        calculator.setDisplay(newDisplay);
      },
    }),
    [calculator]
  );

  const game = useGame(gameOptions);

  // Sync display with game for endless mode predictions
  useEffect(() => {
    game.syncDisplay(calculator.display);
  }, [calculator.display, game]);

  const resetAll = useCallback(() => {
    calculator.resetCalculator();
    game.resetGame();
  }, [calculator, game]);

  const handleModeChange = useCallback(
    (mode: GameMode) => {
      calculator.resetCalculator();
      game.changeGameMode(mode);
    },
    [calculator, game]
  );

  const handlePracticeElimination = useCallback(
    (newDisplay: string) => {
      if (game.gameMode === 'practice' && game.gameStarted) {
        const afterElimination = game.applyElimination(newDisplay, (display) => {
          calculator.setDisplay(display);
        });
        game.checkGameOverState(afterElimination);
      }
    },
    [calculator, game]
  );

  const handleKey = useCallback(
    (key: string) => {
      if (game.isGameOver) return;

      // Start game on first key press in game modes
      if (game.gameMode !== 'calculator' && !game.gameStarted) {
        const initialState = game.startGame();
        calculator.setDisplay(initialState);
      }

      // Surrender on digit after =
      if (game.gameMode !== 'calculator' && game.gameStarted && game.justPressedEqual) {
        if (/^\d$/.test(key)) {
          game.surrender();
          return;
        }
      }

      game.setJustPressedEqual(false);

      // Handle digit input
      if (/^\d$/.test(key)) {
        calculator.inputDigit(key);
        return;
      }

      // Handle other keys
      switch (key) {
        case 'C':
          if (game.gameMode !== 'calculator' && game.gameStarted) {
            game.surrender();
          } else {
            calculator.clearAll();
          }
          break;

        case 'E':
          if (game.gameMode !== 'calculator' && game.gameStarted) {
            game.surrender();
          } else {
            calculator.clearEntry();
          }
          break;

        case '.':
          calculator.inputDecimal();
          break;

        case '=': {
          const result = calculator.handleEqual();
          if (result) {
            game.incrementCalculationCount();
            game.setCalculationHistory(
              `${result.left} ${operatorToSymbol(result.op ?? '')} ${result.right} = ${result.newDisplay}`
            );
            game.setJustPressedEqual(true);
            handlePracticeElimination(result.newDisplay);
          }
          break;
        }

        case '+':
        case '-':
        case '*':
        case '/': {
          const result = calculator.performOperation(key);
          if (result) {
            game.incrementCalculationCount();
            handlePracticeElimination(result.newDisplay);
          }
          break;
        }
      }
    },
    [calculator, game, handlePracticeElimination]
  );

  return {
    // Calculator state
    display: calculator.display,

    // Game state
    gameMode: game.gameMode,
    gameStarted: game.gameStarted,
    isGameOver: game.isGameOver,
    isSurrender: game.isSurrender,
    score: game.score,
    chains: game.chains,
    prediction: game.prediction,
    countdown: game.countdown,
    eliminatingIndices: game.eliminatingIndices,
    calculationHistory: game.calculationHistory,
    lastScoreBreakdown: game.lastScoreBreakdown,

    // Actions
    handleKey,
    handleModeChange,
    resetAll,
  };
}
