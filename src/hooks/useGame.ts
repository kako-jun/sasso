import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type GameMode,
  type Prediction,
  type ScoreResult,
  processElimination,
  checkOverflow,
  generateInitialState,
  generatePrediction,
  findEliminationIndices,
  calculateScore,
  getDigitCount,
} from '../gameLogic';
import { COUNTDOWN_TIME } from '../constants';
import { calculate, formatDisplay, operatorToSymbol } from '../utils';

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

  // Score
  const [score, setScore] = useState(0);
  const [chains, setChains] = useState(0);
  const [calculationCount, setCalculationCount] = useState(0);
  const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreResult | null>(null);

  // Prediction system
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  // Animation
  const [eliminatingIndices, setEliminatingIndices] = useState<number[]>([]);
  const [calculationHistory, setCalculationHistory] = useState('');

  // Refs
  const countdownRef = useRef<number | null>(null);
  const displayRef = useRef('0');
  const calculationCountRef = useRef(0);
  const externalDisplayUpdateRef = useRef(externalDisplayUpdate);

  useEffect(() => {
    externalDisplayUpdateRef.current = externalDisplayUpdate;
  }, [externalDisplayUpdate]);

  useEffect(() => {
    calculationCountRef.current = calculationCount;
  }, [calculationCount]);

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

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameStarted(false);
    setIsGameOver(false);
    setIsSurrender(false);
    setJustPressedEqual(false);
    setPrediction(null);
    setCountdown(0);
    setGameStartTime(null);
    setScore(0);
    setChains(0);
    setCalculationCount(0);
    setLastScoreBreakdown(null);
    setCalculationHistory('');
    setEliminatingIndices([]);
    clearCountdown();
  }, [clearCountdown]);

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
    setGameStartTime(Date.now());

    if (gameMode === 'endless') {
      const pred = generatePrediction(0);
      setPrediction(pred);
      setCountdown(COUNTDOWN_TIME);
    }

    return initialState;
  }, [gameMode]);

  const surrender = useCallback(() => {
    setIsSurrender(true);
    setIsGameOver(true);
    clearCountdown();
  }, [clearCountdown]);

  const checkGameOverState = useCallback(
    (displayStr: string): boolean => {
      if (checkOverflow(displayStr)) {
        setIsGameOver(true);
        clearCountdown();
        return true;
      }
      return false;
    },
    [clearCountdown]
  );

  const incrementCalculationCount = useCallback(() => {
    setCalculationCount((prev) => prev + 1);
  }, []);

  // Apply elimination with animation
  const applyEliminationWithAnimation = useCallback(
    (
      displayStr: string,
      chainCount = 0,
      initialDigitCount?: number,
      initialCalcCount?: number,
      onDisplayUpdate?: (newDisplay: string) => void
    ): string => {
      const indices = findEliminationIndices(displayStr);

      if (indices.length > 0) {
        const digitCountBeforeElimination = initialDigitCount ?? getDigitCount(displayStr);
        const calcCount = initialCalcCount ?? calculationCountRef.current;

        setEliminatingIndices(indices);

        setTimeout(() => {
          const result = processElimination(displayStr);
          onDisplayUpdate?.(result.result);
          setEliminatingIndices([]);

          const newChainCount = chainCount + 1;
          setChains(newChainCount);

          const scoreResult = calculateScore({
            eliminated: result.eliminated,
            chains: newChainCount,
            calculationsSinceLastElimination: calcCount,
            digitCountBeforeElimination,
          });

          setScore((prev) => prev + scoreResult.totalScore);
          setLastScoreBreakdown(scoreResult);
          setCalculationCount(0);

          // Check for chain
          setTimeout(() => {
            const nextIndices = findEliminationIndices(result.result);
            if (nextIndices.length > 0) {
              applyEliminationWithAnimation(
                result.result,
                newChainCount,
                digitCountBeforeElimination,
                calcCount,
                onDisplayUpdate
              );
            }
          }, 100);
        }, 400);

        return displayStr;
      }

      return displayStr;
    },
    []
  );

  const applyElimination = useCallback(
    (displayStr: string, onDisplayUpdate?: (newDisplay: string) => void): string => {
      const result = processElimination(displayStr);

      if (result.eliminated > 0) {
        applyEliminationWithAnimation(displayStr, 0, undefined, undefined, onDisplayUpdate);
        return result.result;
      }

      return displayStr;
    },
    [applyEliminationWithAnimation]
  );

  // Apply prediction (for endless mode)
  const applyPrediction = useCallback(
    (currentDisplay: string, onDisplayUpdate: (newDisplay: string) => void) => {
      if (!prediction) return;

      setCalculationCount((prev) => prev + 1);

      const currentValue = parseFloat(currentDisplay);
      const result = calculate(currentValue, prediction.operand, prediction.operator);
      const newDisplay = formatDisplay(result);

      setCalculationHistory(
        `${currentDisplay} ${operatorToSymbol(prediction.operator)} ${prediction.operand} = ${newDisplay}`
      );

      onDisplayUpdate(newDisplay);

      const indices = findEliminationIndices(newDisplay);
      if (indices.length > 0) {
        const digitCountBeforeElimination = getDigitCount(newDisplay);
        const currentCalcCount = calculationCountRef.current;

        setEliminatingIndices(indices);

        setTimeout(() => {
          const eliminationResult = processElimination(newDisplay);
          const finalDisplay = eliminationResult.result;

          onDisplayUpdate(finalDisplay);
          setEliminatingIndices([]);

          setChains(eliminationResult.chains);

          const scoreResult = calculateScore({
            eliminated: eliminationResult.eliminated,
            chains: eliminationResult.chains,
            calculationsSinceLastElimination: currentCalcCount,
            digitCountBeforeElimination,
          });
          setScore((prev) => prev + scoreResult.totalScore);
          setLastScoreBreakdown(scoreResult);
          setCalculationCount(0);

          if (checkOverflow(finalDisplay)) {
            setIsGameOver(true);
            clearCountdown();
            return;
          }

          // Check for chain
          setTimeout(() => {
            const nextIndices = findEliminationIndices(finalDisplay);
            if (nextIndices.length > 0) {
              applyEliminationWithAnimation(
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
          clearCountdown();
          return;
        }
      }

      // Generate next prediction
      if (gameStartTime) {
        const elapsed = Date.now() - gameStartTime;
        const nextPred = generatePrediction(elapsed);
        setPrediction(nextPred);
      }
    },
    [prediction, gameStartTime, clearCountdown, applyEliminationWithAnimation]
  );

  // Countdown timer for endless mode
  useEffect(() => {
    if (gameMode !== 'endless' || !gameStarted || isGameOver) {
      return;
    }

    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
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
      clearCountdown();
    };
  }, [gameMode, gameStarted, isGameOver, applyPrediction, clearCountdown]);

  return {
    gameMode,
    gameStarted,
    isGameOver,
    isSurrender,
    justPressedEqual,
    score,
    chains,
    calculationCount,
    lastScoreBreakdown,
    prediction,
    countdown,
    eliminatingIndices,
    calculationHistory,
    changeGameMode,
    startGame,
    surrender,
    resetGame,
    setJustPressedEqual,
    incrementCalculationCount,
    setCalculationHistory,
    applyElimination,
    checkGameOverState,
    syncDisplay,
  };
}
