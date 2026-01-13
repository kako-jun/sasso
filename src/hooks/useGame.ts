import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameMode, Prediction, ScoreResult } from '../types';
import type { EliminationCallbacks } from './useElimination';
import { checkOverflow, generateInitialState } from '../game';
import { SPRINT_TIME_LIMIT } from '../constants';
import { usePrediction } from './usePrediction';
import { useElimination } from './useElimination';
import { useEndlessMode } from './useEndlessMode';

// ランキング送信用のプレイヤー名生成
const ADJECTIVES = [
  'Swift',
  'Clever',
  'Brave',
  'Quick',
  'Smart',
  'Fast',
  'Sharp',
  'Wise',
  'Cool',
  'Super',
];
const ANIMALS = ['Fox', 'Eagle', 'Tiger', 'Wolf', 'Lion', 'Hawk', 'Bear', 'Cat', 'Dog', 'Owl'];

function generatePlayerName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${animal}${num}`;
}

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
  surrender: () => void;
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
  const [isSurrender, setIsSurrender] = useState(false);
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
      const playerName = generatePlayerName();
      const rankingId = 'sasso-5d582992';

      fetch(
        `https://api.nostalgic.llll-ll.com/ranking?action=submit&id=${rankingId}&name=${encodeURIComponent(playerName)}&score=${score}`
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
