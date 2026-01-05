import { useState, useCallback, useRef } from 'react';
import type { ScoreResult } from '../types';
import {
  eliminateMatches,
  findEliminationIndices,
  checkOverflow,
  calculateScore,
  shouldTriggerAttack,
  getDigitCount,
} from '../game';
import { ELIMINATION_ANIMATION_MS, CHAIN_CHECK_DELAY_MS } from '../constants';

export interface EliminationCallbacks {
  onDisplayUpdate?: (newDisplay: string) => void;
  onOverflow?: () => void;
  onAttack?: (power: number) => void;
}

export interface UseEliminationReturn {
  eliminatingIndices: number[];
  chains: number;
  score: number;
  calculationCount: number;
  lastScoreBreakdown: ScoreResult | null;
  calculationCountRef: React.MutableRefObject<number>;
  setEliminatingIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setChains: React.Dispatch<React.SetStateAction<number>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setCalculationCount: React.Dispatch<React.SetStateAction<number>>;
  setLastScoreBreakdown: React.Dispatch<React.SetStateAction<ScoreResult | null>>;
  incrementCalculationCount: () => void;
  resetElimination: () => void;
  startEliminationChain: (displayStr: string, callbacks?: EliminationCallbacks) => void;
}

export function useElimination(): UseEliminationReturn {
  const [eliminatingIndices, setEliminatingIndices] = useState<number[]>([]);
  const [chains, setChains] = useState(0);
  const [score, setScore] = useState(0);
  const [calculationCount, setCalculationCount] = useState(0);
  const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreResult | null>(null);

  const calculationCountRef = useRef(0);

  const incrementCalculationCount = useCallback(() => {
    setCalculationCount((prev) => {
      const newCount = prev + 1;
      calculationCountRef.current = newCount;
      return newCount;
    });
  }, []);

  const resetElimination = useCallback(() => {
    setEliminatingIndices([]);
    setChains(0);
    setScore(0);
    setCalculationCount(0);
    setLastScoreBreakdown(null);
    calculationCountRef.current = 0;
  }, []);

  // Main elimination function - processes one chain step at a time with animation
  const startEliminationChain = useCallback(
    (displayStr: string, callbacks?: EliminationCallbacks) => {
      const indices = findEliminationIndices(displayStr);
      if (indices.length === 0) return;

      const digitCountBeforeElimination = getDigitCount(displayStr);
      const calcCount = calculationCountRef.current;

      // Process one step recursively
      const processStep = (currentDisplay: string, chainCount: number) => {
        const stepIndices = findEliminationIndices(currentDisplay);
        if (stepIndices.length === 0) return;

        setEliminatingIndices(stepIndices);

        setTimeout(() => {
          // One elimination step
          const result = eliminateMatches(currentDisplay);
          const newDisplay = result.result;

          callbacks?.onDisplayUpdate?.(newDisplay);
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
          calculationCountRef.current = 0;

          // Check for attack trigger
          if (
            shouldTriggerAttack({
              eliminated: result.eliminated,
              chains: newChainCount,
              result: newDisplay,
            })
          ) {
            callbacks?.onAttack?.(scoreResult.attackPower);
          }

          // Check for overflow
          if (checkOverflow(newDisplay)) {
            callbacks?.onOverflow?.();
            return;
          }

          // Check for next chain
          setTimeout(() => {
            const nextIndices = findEliminationIndices(newDisplay);
            if (nextIndices.length > 0) {
              processStep(newDisplay, newChainCount);
            }
          }, CHAIN_CHECK_DELAY_MS);
        }, ELIMINATION_ANIMATION_MS);
      };

      processStep(displayStr, 0);
    },
    []
  );

  return {
    eliminatingIndices,
    chains,
    score,
    calculationCount,
    lastScoreBreakdown,
    calculationCountRef,
    setEliminatingIndices,
    setChains,
    setScore,
    setCalculationCount,
    setLastScoreBreakdown,
    incrementCalculationCount,
    resetElimination,
    startEliminationChain,
  };
}
