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
  const isActive = (gameMode === 'endless' || gameMode === 'sprint') && gameStarted && !isGameOver;

  // Prediction timer callbacks
  const callbacks = useMemo(
    () => ({
      onDisplayUpdate: (display: string) => {
        externalDisplayUpdateRef.current?.(display);
      },
      onOverflow: () => {
        setIsGameOver(true);
        predictionHook.clearCountdown();
      },
      onCalculationHistory: setCalculationHistory,
      generateNextPrediction: () => predictionHook.generateNextPrediction(),
    }),
    [predictionHook, setIsGameOver, setCalculationHistory, externalDisplayUpdateRef]
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
