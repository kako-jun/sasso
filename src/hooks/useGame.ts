import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameMode, Prediction, ScoreResult } from '../types';
import { checkOverflow, generateInitialState } from '../game';
import { usePrediction } from './usePrediction';
import { useElimination } from './useElimination';
import { useEndlessMode } from './useEndlessMode';

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

  // Endless mode logic
  useEndlessMode({
    predictionHook,
    eliminationHook,
    displayRef,
    externalDisplayUpdateRef,
    gameMode,
    gameStarted,
    isGameOver,
    setIsGameOver,
    setCalculationHistory,
  });

  useEffect(() => {
    externalDisplayUpdateRef.current = externalDisplayUpdate;
  }, [externalDisplayUpdate]);

  const syncDisplay = useCallback(
    (display: string) => {
      displayRef.current = display;
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
