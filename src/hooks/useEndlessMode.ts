import { useMemo } from 'react';
import { usePredictionTimer } from './usePredictionTimer';
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
  onGameOver: (reason: 'overflow') => void;
  setCalculationHistory: (value: string) => void;
  finalizePendingCalculation?: () => string | null;
}

export function useEndlessMode({
  predictionHook,
  eliminationHook,
  displayRef,
  externalDisplayUpdateRef,
  gameMode,
  gameStarted,
  isGameOver,
  onGameOver,
  setCalculationHistory,
  finalizePendingCalculation,
}: UseEndlessModeOptions) {
  const isActive = (gameMode === 'endless' || gameMode === 'sprint') && gameStarted && !isGameOver;

  // Prediction timer callbacks
  const callbacks = useMemo(
    () => ({
      onDisplayUpdate: (display: string) => {
        externalDisplayUpdateRef.current?.(display);
      },
      onOverflow: () => {
        onGameOver('overflow');
      },
      onCalculationHistory: setCalculationHistory,
      generateNextPrediction: () => predictionHook.generateNextPrediction(),
      finalizePendingCalculation,
    }),
    [
      predictionHook,
      onGameOver,
      setCalculationHistory,
      externalDisplayUpdateRef,
      finalizePendingCalculation,
    ]
  );

  // Use shared prediction timer
  usePredictionTimer({
    predictionHook,
    eliminationHook,
    displayRef,
    isActive,
    callbacks,
  });
}
