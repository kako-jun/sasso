import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameMode, Prediction, ScoreResult } from '../types';
import {
  processElimination,
  checkOverflow,
  generateInitialState,
  findEliminationIndices,
  calculateScore,
  getDigitCount,
} from '../game';
import { COUNTDOWN_TIME } from '../constants';
import { calculate, formatDisplay, operatorToSymbol } from '../utils';
import { usePrediction } from './usePrediction';
import { useElimination } from './useElimination';

export interface UseGameOptions {
  onDisplayUpdate?: (newDisplay: string) => void;
}

export interface UseGameReturn {
  // Game state
  gameMode: GameMode;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  justPressedEqual: boolean;

  // Score
  score: number;
  chains: number;
  calculationCount: number;
  lastScoreBreakdown: ScoreResult | null;

  // Prediction
  prediction: Prediction | null;
  countdown: number;

  // Animation
  eliminatingIndices: number[];
  calculationHistory: string;

  // Actions
  changeGameMode: (mode: GameMode) => void;
  startGame: () => string;
  surrender: () => void;
  resetGame: () => void;
  setJustPressedEqual: (value: boolean) => void;
  incrementCalculationCount: () => void;
  setCalculationHistory: (value: string) => void;
  applyElimination: (displayStr: string, onDisplayUpdate?: (newDisplay: string) => void) => string;
  checkGameOverState: (displayStr: string) => boolean;
  syncDisplay: (display: string) => void;
}

export function useGame(options: UseGameOptions = {}): UseGameReturn {
  const { onDisplayUpdate: externalDisplayUpdate } = options;

  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('calculator');
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSurrender, setIsSurrender] = useState(false);
  const [justPressedEqual, setJustPressedEqual] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');

  // Refs
  const displayRef = useRef('0');
  const externalDisplayUpdateRef = useRef(externalDisplayUpdate);

  // Composed hooks
  const predictionHook = usePrediction();
  const eliminationHook = useElimination();

  useEffect(() => {
    externalDisplayUpdateRef.current = externalDisplayUpdate;
  }, [externalDisplayUpdate]);

  const syncDisplay = useCallback(
    (display: string) => {
      displayRef.current = display;
      // Check overflow on every display update during gameplay
      if (gameMode !== 'calculator' && gameStarted && !isGameOver) {
        if (checkOverflow(display)) {
          setIsGameOver(true);
        }
      }
    },
    [gameMode, gameStarted, isGameOver]
  );

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setIsGameOver(false);
    setIsSurrender(false);
    setJustPressedEqual(false);
    setCalculationHistory('');
    predictionHook.resetPrediction();
    eliminationHook.resetElimination();
  }, [predictionHook, eliminationHook]);

  const changeGameMode = useCallback(
    (mode: GameMode) => {
      resetGame();
      setGameMode(mode);
    },
    [resetGame]
  );

  const startGame = useCallback((): string => {
    const initialState = generateInitialState();
    setGameStarted(true);

    if (gameMode === 'endless') {
      predictionHook.initPrediction();
    }

    return initialState;
  }, [gameMode, predictionHook]);

  const surrender = useCallback(() => {
    setIsSurrender(true);
    setIsGameOver(true);
    predictionHook.clearCountdown();
  }, [predictionHook]);

  const checkGameOverState = useCallback(
    (displayStr: string): boolean => {
      if (checkOverflow(displayStr)) {
        setIsGameOver(true);
        predictionHook.clearCountdown();
        return true;
      }
      return false;
    },
    [predictionHook]
  );

  // Apply prediction (for endless mode)
  const applyPrediction = useCallback(
    (currentDisplay: string, onDisplayUpdate: (newDisplay: string) => void) => {
      if (!predictionHook.prediction) return;

      eliminationHook.incrementCalculationCount();

      const currentValue = parseFloat(currentDisplay);
      const result = calculate(
        currentValue,
        predictionHook.prediction.operand,
        predictionHook.prediction.operator
      );
      const newDisplay = formatDisplay(result);

      setCalculationHistory(
        `${currentDisplay} ${operatorToSymbol(predictionHook.prediction.operator)} ${predictionHook.prediction.operand} = ${newDisplay}`
      );

      onDisplayUpdate(newDisplay);

      const indices = findEliminationIndices(newDisplay);
      if (indices.length > 0) {
        const digitCountBeforeElimination = getDigitCount(newDisplay);
        const currentCalcCount = eliminationHook.calculationCountRef.current;

        eliminationHook.setEliminatingIndices(indices);

        setTimeout(() => {
          const eliminationResult = processElimination(newDisplay);
          const finalDisplay = eliminationResult.result;

          onDisplayUpdate(finalDisplay);
          eliminationHook.setEliminatingIndices([]);

          eliminationHook.setChains(eliminationResult.chains);

          const scoreResult = calculateScore({
            eliminated: eliminationResult.eliminated,
            chains: eliminationResult.chains,
            calculationsSinceLastElimination: currentCalcCount,
            digitCountBeforeElimination,
          });
          eliminationHook.setScore((prev) => prev + scoreResult.totalScore);
          eliminationHook.setLastScoreBreakdown(scoreResult);
          eliminationHook.setCalculationCount(0);

          if (checkOverflow(finalDisplay)) {
            setIsGameOver(true);
            predictionHook.clearCountdown();
            return;
          }

          // Check for chain
          setTimeout(() => {
            const nextIndices = findEliminationIndices(finalDisplay);
            if (nextIndices.length > 0) {
              eliminationHook.applyEliminationWithAnimation(
                finalDisplay,
                eliminationResult.chains,
                digitCountBeforeElimination,
                currentCalcCount,
                onDisplayUpdate
              );
            }
          }, 100);
        }, 400);
      } else {
        if (checkOverflow(newDisplay)) {
          setIsGameOver(true);
          predictionHook.clearCountdown();
          return;
        }
      }

      // Generate next prediction
      predictionHook.generateNextPrediction();
    },
    [predictionHook, eliminationHook]
  );

  // Countdown timer for endless mode
  useEffect(() => {
    if (gameMode !== 'endless' || !gameStarted || isGameOver) {
      return;
    }

    predictionHook.countdownRef.current = window.setInterval(() => {
      predictionHook.setCountdown((prev) => {
        if (prev <= 100) {
          applyPrediction(displayRef.current, (newDisplay) => {
            displayRef.current = newDisplay;
            // Also update external display (calculator)
            externalDisplayUpdateRef.current?.(newDisplay);
          });
          return COUNTDOWN_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      predictionHook.clearCountdown();
    };
  }, [gameMode, gameStarted, isGameOver, applyPrediction, predictionHook]);

  return {
    gameMode,
    gameStarted,
    isGameOver,
    isSurrender,
    justPressedEqual,
    score: eliminationHook.score,
    chains: eliminationHook.chains,
    calculationCount: eliminationHook.calculationCount,
    lastScoreBreakdown: eliminationHook.lastScoreBreakdown,
    prediction: predictionHook.prediction,
    countdown: predictionHook.countdown,
    eliminatingIndices: eliminationHook.eliminatingIndices,
    calculationHistory,
    changeGameMode,
    startGame,
    surrender,
    resetGame,
    setJustPressedEqual,
    incrementCalculationCount: eliminationHook.incrementCalculationCount,
    setCalculationHistory,
    applyElimination: eliminationHook.applyElimination,
    checkGameOverState,
    syncDisplay,
  };
}
