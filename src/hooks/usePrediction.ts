import { useState, useCallback } from 'react';
import type { Prediction } from '../types';
import { generatePrediction } from '../game';
import { COUNTDOWN_TIME } from '../constants';

export interface PredictionState {
  prediction: Prediction | null;
  countdown: number;
  gameStartTime: number | null;
}

export interface UsePredictionReturn {
  prediction: Prediction | null;
  countdown: number;
  gameStartTime: number | null;
  initPrediction: () => void;
  clearCountdown: () => void;
  resetPrediction: () => void;
  generateNextPrediction: () => void;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
}

export function usePrediction(): UsePredictionReturn {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const clearCountdown = useCallback(() => {
    // The countdown interval itself is owned by usePredictionTimer (and stops via
    // its isActive effect cleanup). Here we just clear the visible value on game
    // over / reset.
    setCountdown(0);
  }, []);

  const resetPrediction = useCallback(() => {
    setPrediction(null);
    setCountdown(0);
    setGameStartTime(null);
    clearCountdown();
  }, [clearCountdown]);

  const initPrediction = useCallback(() => {
    const pred = generatePrediction(0);
    setPrediction(pred);
    setCountdown(COUNTDOWN_TIME);
    setGameStartTime(Date.now());
  }, []);

  const generateNextPrediction = useCallback(() => {
    if (gameStartTime) {
      const elapsed = Date.now() - gameStartTime;
      const nextPred = generatePrediction(elapsed);
      setPrediction(nextPred);
    }
  }, [gameStartTime]);

  return {
    prediction,
    countdown,
    gameStartTime,
    initPrediction,
    clearCountdown,
    resetPrediction,
    generateNextPrediction,
    setCountdown,
  };
}
