import { useState, useCallback, useRef } from 'react';
import type { Prediction } from '../types';
import { createBattlePredictionGenerator } from '../game';
import type { BattlePredictionGenerator } from '../game';
import { COUNTDOWN_TIME } from '../constants';

export interface UseSeededPredictionReturn {
  prediction: Prediction | null;
  countdown: number;
  gameStartTime: number | null;
  countdownRef: React.MutableRefObject<number | null>;
  initWithSeed: (seed: number) => void;
  clearCountdown: () => void;
  resetPrediction: () => void;
  generateNextPrediction: (attackPower?: number) => void;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Seeded prediction hook for battle mode.
 * Both players with the same seed will get identical prediction sequences.
 */
export function useSeededPrediction(): UseSeededPredictionReturn {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const countdownRef = useRef<number | null>(null);
  const generatorRef = useRef<BattlePredictionGenerator | null>(null);

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
    generatorRef.current = null;
  }, [clearCountdown]);

  /**
   * Initialize prediction with a shared seed.
   * Both players must call this with the same seed.
   */
  const initWithSeed = useCallback((seed: number) => {
    generatorRef.current = createBattlePredictionGenerator(seed);
    const pred = generatorRef.current.generatePrediction(0);
    setPrediction(pred);
    setCountdown(COUNTDOWN_TIME);
    setGameStartTime(Date.now());
  }, []);

  /**
   * Generate the next prediction.
   * Both players will get the same prediction if they started with the same seed.
   */
  const generateNextPrediction = useCallback((attackPower = 0) => {
    if (generatorRef.current) {
      const nextPred = generatorRef.current.generatePrediction(attackPower);
      setPrediction(nextPred);
    }
  }, []);

  return {
    prediction,
    countdown,
    gameStartTime,
    countdownRef,
    initWithSeed,
    clearCountdown,
    resetPrediction,
    generateNextPrediction,
    setCountdown,
  };
}
