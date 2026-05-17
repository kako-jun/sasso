import { describe, it, expect } from 'vitest';
import { calculate, formatDisplay } from './calculator';

describe('calculate', () => {
  it('adds', () => {
    expect(calculate(2, 3, '+')).toBe(5);
  });

  it('subtracts', () => {
    expect(calculate(7, 2, '-')).toBe(5);
  });

  it('multiplies', () => {
    expect(calculate(6, 7, '*')).toBe(42);
  });

  it('divides', () => {
    expect(calculate(10, 4, '/')).toBe(2.5);
  });

  it('returns NaN on divide by zero', () => {
    expect(Number.isNaN(calculate(5, 0, '/'))).toBe(true);
  });

  it('handles negative results', () => {
    expect(calculate(2, 10, '-')).toBe(-8);
  });
});

describe('formatDisplay', () => {
  it('formats small integers normally', () => {
    expect(formatDisplay(42)).toBe('42');
  });

  it('formats decimals via toPrecision(10)', () => {
    expect(formatDisplay(0.1 + 0.2)).toBe('0.3');
  });

  it('returns "E" for non-finite values (Infinity, NaN)', () => {
    expect(formatDisplay(NaN)).toBe('E');
    expect(formatDisplay(Infinity)).toBe('E');
    expect(formatDisplay(-Infinity)).toBe('E');
  });

  it('switches to 4-digit exponential for values longer than 10 chars', () => {
    const out = formatDisplay(1234567890123);
    expect(out).toMatch(/e[+-]?\d+$/i);
  });

  it('keeps 10-char results in fixed notation', () => {
    // 1234567890 is exactly 10 chars
    expect(formatDisplay(1234567890)).toBe('1234567890');
  });
});
