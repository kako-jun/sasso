// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';

function setup() {
  return renderHook(() => useCalculator());
}

describe('useCalculator', () => {
  it('computes a basic sum', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('2'));
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('3'));
    act(() => void result.current.handleEqual());
    expect(result.current.display).toBe('5');
  });

  it('starts a new number when a digit is pressed after = (regression)', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('2'));
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('3'));
    act(() => void result.current.handleEqual()); // 5
    act(() => result.current.inputDigit('5'));
    expect(result.current.display).toBe('5'); // not "55"
  });

  it('starts a new decimal when "." is pressed after =', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('8'));
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('2'));
    act(() => void result.current.handleEqual()); // 10
    act(() => result.current.inputDecimal());
    expect(result.current.display).toBe('0.'); // not "10."
  });

  it('keeps operating on the result when an operator follows =', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('2'));
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('3'));
    act(() => void result.current.handleEqual()); // 5
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('4'));
    act(() => void result.current.handleEqual());
    expect(result.current.display).toBe('9');
  });

  it('repeats the last operation on consecutive =', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('2'));
    act(() => void result.current.performOperation('+'));
    act(() => result.current.inputDigit('3'));
    act(() => void result.current.handleEqual()); // 5
    act(() => void result.current.handleEqual()); // 8
    act(() => void result.current.handleEqual()); // 11
    expect(result.current.display).toBe('11');
    // ...and a digit after the repeat still starts fresh
    act(() => result.current.inputDigit('7'));
    expect(result.current.display).toBe('7');
  });

  it('squares with ×= and repeats the square with another =', () => {
    const { result } = setup();
    act(() => result.current.inputDigit('5'));
    act(() => void result.current.performOperation('*'));
    act(() => void result.current.handleEqual()); // 25
    expect(result.current.display).toBe('25');
    act(() => void result.current.handleEqual()); // 125
    expect(result.current.display).toBe('125');
  });
});
