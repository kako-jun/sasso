import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { GameMode } from '../types';
import { operatorToSymbol } from '../utils';
import { useCalculator } from './useCalculator';
import { useGame } from './useGame';

export interface UseGameControllerReturn {
  display: string;
  gameMode: GameMode;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  score: number;
  chains: number;
  prediction: ReturnType<typeof useGame>['prediction'];
  countdown: number;
  sprintTimeRemaining: number;
  eliminatingIndices: number[];
  calculationHistory: string;
  lastScoreBreakdown: ReturnType<typeof useGame>['lastScoreBreakdown'];
  handleKey: (key: string) => void;
  handleModeChange: (mode: GameMode) => void;
  resetAll: () => void;
}

export function useGameController(): UseGameControllerReturn {
  const calculator = useCalculator();

  // Refs for game functions (needed for finalizePendingCalculation callback)
  const gameActionsRef = useRef<{
    incrementCalculationCount: () => void;
    setCalculationHistory: (value: string) => void;
  } | null>(null);

  // Create finalizePendingCalculation callback for prediction timer
  const finalizePendingCalculation = useCallback((): string | null => {
    if (calculator.operator !== null && calculator.accumulator !== null) {
      const result = calculator.handleEqual();
      if (result) {
        gameActionsRef.current?.incrementCalculationCount();
        gameActionsRef.current?.setCalculationHistory(
          `${result.left} ${operatorToSymbol(result.op ?? '')} ${result.right} = ${result.newDisplay}`
        );
        return result.newDisplay;
      }
    }
    return null;
  }, [calculator]);

  const gameOptions = useMemo(
    () => ({
      onDisplayUpdate: calculator.setDisplay,
      finalizePendingCalculation,
    }),
    [calculator.setDisplay, finalizePendingCalculation]
  );
  const game = useGame(gameOptions);

  // Keep game actions ref updated
  useEffect(() => {
    gameActionsRef.current = {
      incrementCalculationCount: game.incrementCalculationCount,
      setCalculationHistory: game.setCalculationHistory,
    };
  }, [game.incrementCalculationCount, game.setCalculationHistory]);

  // Sync display with game
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

  // Helper: Check if in active game mode
  const isActiveGame = game.gameMode !== 'calculator' && game.gameStarted;

  // Helper: Apply elimination for practice mode
  const applyPracticeElimination = useCallback(
    (newDisplay: string) => {
      if (game.gameMode === 'practice' && game.gameStarted) {
        game.startEliminationChain(newDisplay, {
          onDisplayUpdate: calculator.setDisplay,
          onOverflow: () => game.checkGameOverState(newDisplay),
        });
      }
    },
    [calculator.setDisplay, game]
  );

  // Helper: Record calculation result
  const recordCalculation = useCallback(
    (result: { left: number; op: string | null; right: number; newDisplay: string }) => {
      game.incrementCalculationCount();
      game.setCalculationHistory(
        `${result.left} ${operatorToSymbol(result.op ?? '')} ${result.right} = ${result.newDisplay}`
      );
    },
    [game]
  );

  const handleKey = useCallback(
    (key: string) => {
      if (game.isGameOver) return;

      // Start game on first key press
      if (game.gameMode !== 'calculator' && !game.gameStarted) {
        calculator.setDisplay(game.startGame());
      }

      // Surrender on digit after =
      if (isActiveGame && game.justPressedEqual && /^\d$/.test(key)) {
        game.surrender();
        return;
      }

      game.setJustPressedEqual(false);

      // Digit input
      if (/^\d$/.test(key)) {
        calculator.inputDigit(key);
        return;
      }

      // Special keys
      if (key === 'C' || key === 'E') {
        if (isActiveGame) {
          game.surrender();
        } else if (key === 'C') {
          calculator.clearAll();
        } else {
          calculator.clearEntry();
        }
        return;
      }

      if (key === '.') {
        calculator.inputDecimal();
        return;
      }

      // Equal key
      if (key === '=') {
        const result = calculator.handleEqual();
        if (result) {
          recordCalculation(result);
          game.setJustPressedEqual(true);
          applyPracticeElimination(result.newDisplay);
        }
        return;
      }

      // Operator keys
      if (['+', '-', '*', '/'].includes(key)) {
        const result = calculator.performOperation(key as '+' | '-' | '*' | '/');
        if (result) {
          game.incrementCalculationCount();
          applyPracticeElimination(result.newDisplay);
        }
      }
    },
    [calculator, game, isActiveGame, recordCalculation, applyPracticeElimination]
  );

  return {
    display: calculator.display,
    gameMode: game.gameMode,
    gameStarted: game.gameStarted,
    isGameOver: game.isGameOver,
    isSurrender: game.isSurrender,
    score: game.score,
    chains: game.chains,
    prediction: game.prediction,
    countdown: game.countdown,
    sprintTimeRemaining: game.sprintTimeRemaining,
    eliminatingIndices: game.eliminatingIndices,
    calculationHistory: game.calculationHistory,
    lastScoreBreakdown: game.lastScoreBreakdown,
    handleKey,
    handleModeChange,
    resetAll,
  };
}
