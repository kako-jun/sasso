import { useState, useCallback } from 'react';
import type { CalcOperator } from '../types';
import { calculate, formatDisplay } from '../utils';

export interface UseCalculatorReturn {
  display: string;
  accumulator: number | null;
  operator: CalcOperator;
  waitingForOperand: boolean;
  lastOperator: CalcOperator;
  lastOperand: number | null;
  setDisplay: (value: string | ((prev: string) => string)) => void;
  clearAll: () => void;
  clearEntry: () => void;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  performOperation: (op: Exclude<CalcOperator, null>) => { newDisplay: string } | null;
  handleEqual: () => { newDisplay: string } | null;
  resetCalculator: () => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [lastOperator, setLastOperator] = useState<CalcOperator>(null);
  const [lastOperand, setLastOperand] = useState<number | null>(null);

  const resetCalculator = useCallback(() => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);
    setLastOperator(null);
    setLastOperand(null);
  }, []);

  const clearAll = useCallback(() => {
    resetCalculator();
  }, [resetCalculator]);

  const clearEntry = useCallback(() => {
    setDisplay('0');
  }, []);

  const inputDigit = useCallback(
    (digit: string) => {
      setDisplay((prev) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }
        return prev === '0' ? digit : prev + digit;
      });
    },
    [waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return prev.includes('.') ? prev : prev + '.';
    });
  }, [waitingForOperand]);

  const performOperation = useCallback(
    (nextOp: Exclude<CalcOperator, null>): { newDisplay: string } | null => {
      if (waitingForOperand && operator) {
        setOperator(nextOp);
        return null;
      }

      const inputValue = parseFloat(display);
      if (Number.isNaN(inputValue)) {
        resetCalculator();
        return null;
      }

      let newDisplay: string | null = null;

      if (accumulator === null) {
        setAccumulator(inputValue);
      } else if (operator) {
        const result = calculate(accumulator, inputValue, operator);
        newDisplay = formatDisplay(result);
        setDisplay(newDisplay);
        setAccumulator(Number.isFinite(result) ? result : null);

        if (!Number.isFinite(result)) {
          setOperator(null);
          setWaitingForOperand(false);
          return null;
        }
      }

      setWaitingForOperand(true);
      setOperator(nextOp);

      return newDisplay ? { newDisplay } : null;
    },
    [accumulator, display, operator, waitingForOperand, resetCalculator]
  );

  const handleEqual = useCallback((): { newDisplay: string } | null => {
    const currentValue = parseFloat(display);

    // Consecutive = press: repeat last operation
    if (operator === null && lastOperator !== null && lastOperand !== null) {
      const result = calculate(currentValue, lastOperand, lastOperator);
      const newDisplay = formatDisplay(result);
      setDisplay(newDisplay);
      return { newDisplay };
    }

    if (operator === null || accumulator === null) return null;

    const result = calculate(accumulator, currentValue, operator);
    const newDisplay = formatDisplay(result);

    setLastOperator(operator);
    setLastOperand(currentValue);

    setDisplay(newDisplay);
    setAccumulator(null);
    setOperator(null);
    setWaitingForOperand(false);

    return { newDisplay };
  }, [accumulator, display, operator, lastOperator, lastOperand]);

  return {
    display,
    accumulator,
    operator,
    waitingForOperand,
    lastOperator,
    lastOperand,
    setDisplay,
    clearAll,
    clearEntry,
    inputDigit,
    inputDecimal,
    performOperation,
    handleEqual,
    resetCalculator,
  };
}
