import { useState, useCallback, useRef } from 'react';
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
  countdownRef: React.MutableRefObject<number | null>;
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

  const countdownRef = useRef<number | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
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
    countdownRef,
    initPrediction,
    clearCountdown,
    resetPrediction,
    generateNextPrediction,
    setCountdown,
  };
}
