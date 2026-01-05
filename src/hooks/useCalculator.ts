import { useReducer, useCallback } from 'react';
import type { CalcOperator } from '../types';
import { calculate, formatDisplay } from '../utils';
import { MAX_DISPLAY_DIGITS } from '../constants';

// State
interface CalculatorState {
  display: string;
  accumulator: number | null;
  operator: CalcOperator;
  waitingForOperand: boolean;
  lastOperator: CalcOperator;
  lastOperand: number | null;
}

const initialState: CalculatorState = {
  display: '0',
  accumulator: null,
  operator: null,
  waitingForOperand: false,
  lastOperator: null,
  lastOperand: null,
};

// Actions
type CalculatorAction =
  | { type: 'RESET' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'SET_DISPLAY'; payload: string }
  | { type: 'INPUT_DIGIT'; payload: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'SET_OPERATOR'; payload: CalcOperator }
  | { type: 'SET_ACCUMULATOR'; payload: number | null }
  | { type: 'SET_WAITING'; payload: boolean }
  | { type: 'SET_LAST_OP'; payload: { operator: CalcOperator; operand: number } }
  | { type: 'COMPLETE_OPERATION'; payload: { display: string; accumulator: number | null } };

// Reducer
function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'RESET':
      return initialState;

    case 'CLEAR_ENTRY':
      return { ...state, display: '0' };

    case 'SET_DISPLAY':
      return { ...state, display: action.payload };

    case 'INPUT_DIGIT': {
      if (state.waitingForOperand) {
        return { ...state, display: action.payload, waitingForOperand: false };
      }
      // Ignore input if already at max digits (like real calculator)
      const digitCount = state.display.replace(/[^0-9]/g, '').length;
      if (digitCount >= MAX_DISPLAY_DIGITS) {
        return state;
      }
      return {
        ...state,
        display: state.display === '0' ? action.payload : state.display + action.payload,
      };
    }

    case 'INPUT_DECIMAL': {
      if (state.waitingForOperand) {
        return { ...state, display: '0.', waitingForOperand: false };
      }
      if (state.display.includes('.')) {
        return state;
      }
      return { ...state, display: state.display + '.' };
    }

    case 'SET_OPERATOR':
      return { ...state, operator: action.payload, waitingForOperand: true };

    case 'SET_ACCUMULATOR':
      return { ...state, accumulator: action.payload };

    case 'SET_WAITING':
      return { ...state, waitingForOperand: action.payload };

    case 'SET_LAST_OP':
      return {
        ...state,
        lastOperator: action.payload.operator,
        lastOperand: action.payload.operand,
      };

    case 'COMPLETE_OPERATION':
      return {
        ...state,
        display: action.payload.display,
        accumulator: action.payload.accumulator,
      };

    default:
      return state;
  }
}

// Return type
export interface CalculationResult {
  newDisplay: string;
  left: number;
  op: CalcOperator;
  right: number;
}

export interface UseCalculatorReturn {
  display: string;
  accumulator: number | null;
  operator: CalcOperator;
  waitingForOperand: boolean;
  lastOperator: CalcOperator;
  lastOperand: number | null;
  setDisplay: (value: string) => void;
  clearAll: () => void;
  clearEntry: () => void;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  performOperation: (op: Exclude<CalcOperator, null>) => CalculationResult | null;
  handleEqual: () => CalculationResult | null;
  resetCalculator: () => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  const resetCalculator = useCallback(() => dispatch({ type: 'RESET' }), []);
  const clearAll = useCallback(() => dispatch({ type: 'RESET' }), []);
  const clearEntry = useCallback(() => dispatch({ type: 'CLEAR_ENTRY' }), []);
  const setDisplay = useCallback(
    (value: string) => dispatch({ type: 'SET_DISPLAY', payload: value }),
    []
  );
  const inputDigit = useCallback(
    (digit: string) => dispatch({ type: 'INPUT_DIGIT', payload: digit }),
    []
  );
  const inputDecimal = useCallback(() => dispatch({ type: 'INPUT_DECIMAL' }), []);

  const performOperation = useCallback(
    (nextOp: Exclude<CalcOperator, null>): CalculationResult | null => {
      // Just change operator if waiting
      if (state.waitingForOperand && state.operator) {
        dispatch({ type: 'SET_OPERATOR', payload: nextOp });
        return null;
      }

      const inputValue = parseFloat(state.display);
      if (Number.isNaN(inputValue)) {
        dispatch({ type: 'RESET' });
        return null;
      }

      let result: CalculationResult | null = null;

      if (state.accumulator === null) {
        dispatch({ type: 'SET_ACCUMULATOR', payload: inputValue });
      } else if (state.operator) {
        const calcResult = calculate(state.accumulator, inputValue, state.operator);
        const newDisplay = formatDisplay(calcResult);

        if (!Number.isFinite(calcResult)) {
          dispatch({ type: 'RESET' });
          return null;
        }

        dispatch({
          type: 'COMPLETE_OPERATION',
          payload: { display: newDisplay, accumulator: calcResult },
        });
        result = { newDisplay, left: state.accumulator, op: state.operator, right: inputValue };
      }

      dispatch({ type: 'SET_OPERATOR', payload: nextOp });
      return result;
    },
    [state.accumulator, state.display, state.operator, state.waitingForOperand]
  );

  const handleEqual = useCallback((): CalculationResult | null => {
    const currentValue = parseFloat(state.display);

    // Consecutive = press: repeat last operation
    if (state.operator === null && state.lastOperator !== null && state.lastOperand !== null) {
      const result = calculate(currentValue, state.lastOperand, state.lastOperator);
      const newDisplay = formatDisplay(result);
      dispatch({ type: 'SET_DISPLAY', payload: newDisplay });
      return { newDisplay, left: currentValue, op: state.lastOperator, right: state.lastOperand };
    }

    if (state.operator === null || state.accumulator === null) return null;

    // Real calculator behavior: only *= works as square, other op= have no effect
    if (state.waitingForOperand && state.operator !== '*') {
      dispatch({ type: 'SET_ACCUMULATOR', payload: null });
      dispatch({ type: 'SET_OPERATOR', payload: null });
      dispatch({ type: 'SET_WAITING', payload: false });
      return null;
    }

    const result = calculate(state.accumulator, currentValue, state.operator);
    const newDisplay = formatDisplay(result);
    const calcInfo: CalculationResult = {
      newDisplay,
      left: state.accumulator,
      op: state.operator,
      right: currentValue,
    };

    dispatch({ type: 'SET_LAST_OP', payload: { operator: state.operator, operand: currentValue } });
    dispatch({ type: 'SET_DISPLAY', payload: newDisplay });
    dispatch({ type: 'SET_ACCUMULATOR', payload: null });
    dispatch({ type: 'SET_OPERATOR', payload: null });
    dispatch({ type: 'SET_WAITING', payload: false });

    return calcInfo;
  }, [state]);

  return {
    ...state,
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
