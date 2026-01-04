import { useCallback, useEffect } from 'react';
import {
  processElimination,
  checkOverflow,
  findEliminationIndices,
  calculateScore,
  getDigitCount,
} from '../game';
import { COUNTDOWN_TIME } from '../constants';
import { calculate, formatDisplay, operatorToSymbol } from '../utils';
import type { UsePredictionReturn } from './usePrediction';
import type { UseEliminationReturn } from './useElimination';

interface UseEndlessModeOptions {
  predictionHook: UsePredictionReturn;
  eliminationHook: UseEliminationReturn;
  displayRef: React.MutableRefObject<string>;
  externalDisplayUpdateRef: React.MutableRefObject<((newDisplay: string) => void) | undefined>;
  gameMode: string;
  gameStarted: boolean;
  isGameOver: boolean;
  setIsGameOver: (value: boolean) => void;
  setCalculationHistory: (value: string) => void;
}

export function useEndlessMode({
  predictionHook,
  eliminationHook,
  displayRef,
  externalDisplayUpdateRef,
  gameMode,
  gameStarted,
  isGameOver,
  setIsGameOver,
  setCalculationHistory,
}: UseEndlessModeOptions) {
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

      predictionHook.generateNextPrediction();
    },
    [predictionHook, eliminationHook, setIsGameOver, setCalculationHistory]
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
  }, [
    gameMode,
    gameStarted,
    isGameOver,
    applyPrediction,
    predictionHook,
    displayRef,
    externalDisplayUpdateRef,
  ]);

  return { applyPrediction };
}
