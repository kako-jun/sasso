import { useCallback, useEffect, useRef } from 'react';
import type { Prediction } from '../types';
import { checkOverflow, findEliminationIndices } from '../game';
import { calculate, formatDisplay, operatorToSymbol } from '../utils';
import { COUNTDOWN_TIME } from '../constants';
import type { UseEliminationReturn } from './useElimination';

export interface PredictionTimerCallbacks {
  onDisplayUpdate: (display: string) => void;
  onOverflow: () => void;
  onAttack?: (power: number) => void;
  onCalculationHistory: (history: string) => void;
  generateNextPrediction: (attackPower?: number) => void;
  // Called before prediction to finalize any pending calculation (e.g., 100 + 1 → 101)
  finalizePendingCalculation?: () => string | null;
}

interface PredictionHookLike {
  prediction: Prediction | null;
  countdown: number;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
  clearCountdown: () => void;
}

interface UsePredictionTimerOptions {
  predictionHook: PredictionHookLike;
  eliminationHook: UseEliminationReturn;
  displayRef: React.MutableRefObject<string>;
  isActive: boolean;
  callbacks: PredictionTimerCallbacks;
  pendingAttackPower?: number;
  onAttackApplied?: () => void;
}

export function usePredictionTimer({
  predictionHook,
  eliminationHook,
  displayRef,
  isActive,
  callbacks,
  pendingAttackPower = 0,
  onAttackApplied,
}: UsePredictionTimerOptions) {
  const applyPredictionRef = useRef<() => void>(() => {});

  // Apply prediction (auto-execute when countdown reaches 0)
  const applyPrediction = useCallback(() => {
    if (!predictionHook.prediction) return;

    // Finalize any pending calculation first (e.g., 100 + 1 → 101)
    const finalizedDisplay = callbacks.finalizePendingCalculation?.();
    const currentDisplay = finalizedDisplay ?? displayRef.current;
    const currentValue = parseFloat(currentDisplay);
    const result = calculate(
      currentValue,
      predictionHook.prediction.operand,
      predictionHook.prediction.operator
    );
    const newDisplay = formatDisplay(result);

    callbacks.onCalculationHistory(
      `${currentDisplay} ${operatorToSymbol(predictionHook.prediction.operator)} ${predictionHook.prediction.operand} = ${newDisplay}`
    );

    callbacks.onDisplayUpdate(newDisplay);
    displayRef.current = newDisplay;

    const indices = findEliminationIndices(newDisplay);
    if (indices.length > 0) {
      eliminationHook.startEliminationChain(newDisplay, {
        onDisplayUpdate: (display) => {
          callbacks.onDisplayUpdate(display);
          displayRef.current = display;
        },
        onOverflow: callbacks.onOverflow,
        onAttack: callbacks.onAttack,
      });
    } else if (checkOverflow(newDisplay)) {
      callbacks.onOverflow();
      return;
    }

    // Generate next prediction (with attack power if under attack)
    callbacks.generateNextPrediction(pendingAttackPower);
    if (pendingAttackPower > 0) {
      onAttackApplied?.();
    }
  }, [predictionHook, eliminationHook, displayRef, callbacks, pendingAttackPower, onAttackApplied]);

  // Keep ref updated
  useEffect(() => {
    applyPredictionRef.current = applyPrediction;
  }, [applyPrediction]);

  // Countdown timer
  useEffect(() => {
    if (!isActive) return;

    const intervalId = window.setInterval(() => {
      predictionHook.setCountdown((prev) => {
        if (prev <= 100) {
          applyPredictionRef.current();
          return COUNTDOWN_TIME;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(intervalId);
  }, [isActive, predictionHook]);

  return { applyPrediction };
}
