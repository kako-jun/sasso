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

  it('rounds a repeating decimal to fit instead of going exponential (1÷3)', () => {
    // Regression: this used to become "3.3333e-1", which checkOverflow read as
    // overflow → instant game over on a harmless 0.33.
    const out = formatDisplay(1 / 3);
    expect(out).not.toMatch(/e/i);
    expect(out).toBe('0.3333333333');
  });

  it('renders a too-big integer in full so checkOverflow catches it (13+ digits)', () => {
    expect(formatDisplay(1234567890123)).toBe('1234567890123');
  });

  it('renders a 10-digit negative integer in full, not exponential', () => {
    // Regression: "-1234567890" used to be 11 chars → exponential → overflow.
    expect(formatDisplay(-1234567890)).toBe('-1234567890');
  });

  it('keeps 10-char results in fixed notation', () => {
    // 1234567890 is exactly 10 chars
    expect(formatDisplay(1234567890)).toBe('1234567890');
  });

  it('shows a tiny magnitude as a plain decimal, not exponential', () => {
    const out = formatDisplay(1 / 99 / 99 / 99 / 99); // ~1.04e-8
    expect(out).not.toMatch(/e/i);
    expect(out).toBe('0.0000000104');
  });

  it('collapses sub-display-resolution magnitudes to "0" (never "-0")', () => {
    expect(formatDisplay(1e-12)).toBe('0');
    expect(formatDisplay(-1e-12)).toBe('0');
  });

  it('renders a value that rounds up to a whole number as an integer', () => {
    expect(formatDisplay(2.9999999999)).toBe('3');
  });

  it('keeps a large non-integer within 10 significant digits (fraction drops off)', () => {
    expect(formatDisplay(123456789012.5)).toBe('123456789000');
  });
});
