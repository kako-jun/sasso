import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameMode, GameOverReason, Prediction, ScoreResult } from '../types';
import type { EliminationCallbacks } from './useElimination';
import { checkOverflow, findEliminationIndices, generateInitialState } from '../game';
import { SPRINT_TIME_LIMIT } from '../constants';
import { usePrediction } from './usePrediction';
import { useElimination } from './useElimination';
import { useEndlessMode } from './useEndlessMode';

export interface UseGameOptions {
  onDisplayUpdate?: (newDisplay: string) => void;
  finalizePendingCalculation?: () => string | null;
}

export interface UseGameReturn {
  // Game state
  gameMode: GameMode;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  gameOverReason: GameOverReason;
  justPressedEqual: boolean;

  // Score
  score: number;
  chains: number;
  calculationCount: number;
  lastScoreBreakdown: ScoreResult | null;

  // Prediction
  prediction: Prediction | null;
  countdown: number;

  // Sprint
  sprintTimeRemaining: number;

  // Animation
  eliminatingIndices: number[];
  calculationHistory: string;

  // Actions
  changeGameMode: (mode: GameMode) => void;
  startGame: () => string;
  surrender: (reason: 'surrender' | 'misinput') => void;
  resetGame: () => void;
  setJustPressedEqual: (value: boolean) => void;
  incrementCalculationCount: () => void;
  setCalculationHistory: (value: string) => void;
  startEliminationChain: (displayStr: string, callbacks?: EliminationCallbacks) => void;
  checkGameOverState: (displayStr: string) => boolean;
  syncDisplay: (display: string) => void;
}

export function useGame(options: UseGameOptions = {}): UseGameReturn {
  const { onDisplayUpdate: externalDisplayUpdate, finalizePendingCalculation } = options;

  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('calculator');
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<GameOverReason>(null);
  const isSurrender = gameOverReason === 'surrender' || gameOverReason === 'misinput';
  const [justPressedEqual, setJustPressedEqual] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState('');
  const [sprintTimeRemaining, setSprintTimeRemaining] = useState(SPRINT_TIME_LIMIT);

  // Refs
  const displayRef = useRef('0');
  const externalDisplayUpdateRef = useRef(externalDisplayUpdate);
  const sprintTimerRef = useRef<number | null>(null);

  // Composed hooks
  const predictionHook = usePrediction();
  const eliminationHook = useElimination();

  // Centralised game-over: record the cause, stop the clock.
  const endGame = useCallback(
    (reason: Exclude<GameOverReason, null>) => {
      setIsGameOver(true);
      setGameOverReason(reason);
      predictionHook.clearCountdown();
    },
    [predictionHook]
  );

  // Endless mode logic
  useEndlessMode({
    predictionHook,
    eliminationHook,
    displayRef,
    externalDisplayUpdateRef,
    gameMode,
    gameStarted,
    isGameOver,
    onGameOver: endGame,
    setCalculationHistory,
    finalizePendingCalculation,
  });

  useEffect(() => {
    externalDisplayUpdateRef.current = externalDisplayUpdate;
  }, [externalDisplayUpdate]);

  // Sprint timer
  useEffect(() => {
    if (gameMode !== 'sprint' || !gameStarted || isGameOver) {
      if (sprintTimerRef.current) {
        clearInterval(sprintTimerRef.current);
        sprintTimerRef.current = null;
      }
      return;
    }

    sprintTimerRef.current = window.setInterval(() => {
      setSprintTimeRemaining((prev) => {
        if (prev <= 100) {
          setIsGameOver(true);
          setGameOverReason('timeup');
          predictionHook.clearCountdown();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (sprintTimerRef.current) {
        clearInterval(sprintTimerRef.current);
        sprintTimerRef.current = null;
      }
    };
  }, [gameMode, gameStarted, isGameOver, predictionHook]);

  // Sprint mode ranking submission
  const rankingSubmittedRef = useRef(false);
  const rankingTimerRef = useRef<number | null>(null);
  useEffect(() => {
    // Reset flag when game resets
    if (!isGameOver) {
      rankingSubmittedRef.current = false;
      if (rankingTimerRef.current) {
        clearTimeout(rankingTimerRef.current);
        rankingTimerRef.current = null;
      }
      return;
    }

    // Only submit for sprint mode, not surrender, and not already submitted
    if (gameMode !== 'sprint' || isSurrender || rankingSubmittedRef.current) {
      return;
    }

    // Clear previous timer if score updates
    if (rankingTimerRef.current) {
      clearTimeout(rankingTimerRef.current);
    }

    // Wait for score to stabilize before submitting
    rankingTimerRef.current = window.setTimeout(() => {
      if (rankingSubmittedRef.current) return;

      const score = eliminationHook.score;
      if (score <= 0) return;

      rankingSubmittedRef.current = true;
      const rankingId = 'sasso-5d582992';

      // 名前はサーバー側で自動生成
      fetch(
        `https://api.nostalgic.llll-ll.com/ranking?action=submit&id=${rankingId}&score=${score}`
      ).catch(() => {});
    }, 1000);

    return () => {
      if (rankingTimerRef.current) {
        clearTimeout(rankingTimerRef.current);
        rankingTimerRef.current = null;
      }
    };
  }, [isGameOver, gameMode, isSurrender, eliminationHook.score]);

  const syncDisplay = useCallback(
    (display: string) => {
      displayRef.current = display;
      if (gameMode !== 'calculator' && gameStarted && !isGameOver) {
        // Overflow ends the game only when there is nothing left to eliminate.
        // This is a one-shot suppression: if the (over-long) value still has
        // adjacent matches, defer — the elimination pipeline (startEliminationChain)
        // then runs, shrinks the value, and re-checks overflow per step. So:
        // "eliminate, and if it still overflows, game over." (Battle reaches the
        // same semantics through the chain only; it does not use syncDisplay.)
        if (checkOverflow(display) && findEliminationIndices(display).length === 0) {
          endGame('overflow');
        }
      }
    },
    [gameMode, gameStarted, isGameOver, endGame]
  );

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setIsGameOver(false);
    setGameOverReason(null);
    setJustPressedEqual(false);
    setCalculationHistory('');
    setSprintTimeRemaining(SPRINT_TIME_LIMIT);
    if (sprintTimerRef.current) {
      clearInterval(sprintTimerRef.current);
      sprintTimerRef.current = null;
    }
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

    if (gameMode === 'endless' || gameMode === 'sprint') {
      predictionHook.initPrediction();
    }

    return initialState;
  }, [gameMode, predictionHook]);

  const surrender = useCallback(
    (reason: 'surrender' | 'misinput') => {
      endGame(reason);
    },
    [endGame]
  );

  const checkGameOverState = useCallback(
    (displayStr: string): boolean => {
      if (checkOverflow(displayStr)) {
        endGame('overflow');
        return true;
      }
      return false;
    },
    [endGame]
  );

  return {
    gameMode,
    gameStarted,
    isGameOver,
    isSurrender,
    gameOverReason,
    justPressedEqual,
    score: eliminationHook.score,
    chains: eliminationHook.chains,
    calculationCount: eliminationHook.calculationCount,
    lastScoreBreakdown: eliminationHook.lastScoreBreakdown,
    prediction: predictionHook.prediction,
    countdown: predictionHook.countdown,
    sprintTimeRemaining,
    eliminatingIndices: eliminationHook.eliminatingIndices,
    calculationHistory,
    changeGameMode,
    startGame,
    surrender,
    resetGame,
    setJustPressedEqual,
    incrementCalculationCount: eliminationHook.incrementCalculationCount,
    setCalculationHistory,
    startEliminationChain: eliminationHook.startEliminationChain,
    checkGameOverState,
    syncDisplay,
  };
}
