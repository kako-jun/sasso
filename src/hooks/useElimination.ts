import { useState, useCallback, useRef } from 'react';
import type { ScoreResult } from '../types';
import { processElimination, findEliminationIndices, calculateScore, getDigitCount } from '../game';
import { ELIMINATION_ANIMATION_MS, CHAIN_CHECK_DELAY_MS } from '../constants';

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
  applyEliminationWithAnimation: (
    displayStr: string,
    chainCount?: number,
    initialDigitCount?: number,
    initialCalcCount?: number,
    onDisplayUpdate?: (newDisplay: string) => void
  ) => string;
  applyElimination: (displayStr: string, onDisplayUpdate?: (newDisplay: string) => void) => string;
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
          calculationCountRef.current = 0;

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
          }, CHAIN_CHECK_DELAY_MS);
        }, ELIMINATION_ANIMATION_MS);

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
    applyEliminationWithAnimation,
    applyElimination,
  };
}
