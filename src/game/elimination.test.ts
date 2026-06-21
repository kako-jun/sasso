import { describe, it, expect } from 'vitest';
import {
  eliminateMatches,
  findEliminationIndices,
  checkOverflow,
  getDigitCount,
} from './elimination';
import { formatDisplay } from '../utils/calculator';

describe('findEliminationIndices', () => {
  it('returns empty for no adjacent duplicates', () => {
    expect(findEliminationIndices('1234')).toEqual([]);
    expect(findEliminationIndices('0')).toEqual([]);
  });

  it('finds a simple pair', () => {
    expect(findEliminationIndices('1223')).toEqual([1, 2]);
  });

  it('finds a triple run', () => {
    expect(findEliminationIndices('1116')).toEqual([0, 1, 2]);
  });

  it('finds multiple disjoint runs', () => {
    expect(findEliminationIndices('11220')).toEqual([0, 1, 2, 3]);
  });

  it('treats the decimal point as a wall', () => {
    // 3.3 — digits match but the decimal point separates them, so no elimination
    expect(findEliminationIndices('3.3')).toEqual([]);
  });

  it('accounts for the leading minus sign in the returned indices', () => {
    // "-112" → run "11" is at display indices 1 and 2
    expect(findEliminationIndices('-112')).toEqual([1, 2]);
  });
});

describe('eliminateMatches', () => {
  it('keeps the string untouched when no duplicates', () => {
    expect(eliminateMatches('1234')).toEqual({ result: '1234', eliminated: 0 });
  });

  it('removes a single pair', () => {
    expect(eliminateMatches('1223')).toEqual({ result: '13', eliminated: 2 });
  });

  it('counts eliminated digits including runs of three+', () => {
    expect(eliminateMatches('1116')).toEqual({ result: '6', eliminated: 3 });
  });

  it('collapses to "0" when everything is eliminated', () => {
    expect(eliminateMatches('11')).toEqual({ result: '0', eliminated: 2 });
  });

  it('strips leading zeros after elimination', () => {
    // Both runs of length>=2 are eliminated, leaving the empty string → normalized to "0"
    expect(eliminateMatches('0099')).toEqual({ result: '0', eliminated: 4 });
  });

  it('strips leading zeros while keeping later digits', () => {
    // Manually constructed (cannot reach this through normal play but logic must be safe)
    expect(eliminateMatches('00123')).toEqual({ result: '123', eliminated: 2 });
  });

  it('does not eliminate across the decimal point', () => {
    expect(eliminateMatches('3.3')).toEqual({ result: '3.3', eliminated: 0 });
  });

  it('preserves the decimal point on a one-sided elimination', () => {
    // "11.5" → "" + "." + "5" → ".5" → "0.5"
    expect(eliminateMatches('11.5')).toEqual({ result: '0.5', eliminated: 2 });
  });

  it('preserves the sign on a partial negative elimination', () => {
    expect(eliminateMatches('-1123')).toEqual({ result: '-23', eliminated: 2 });
  });

  it('drops the sign when the result is effectively zero', () => {
    // "-11" → "-0" would be ugly, must collapse to "0"
    expect(eliminateMatches('-11')).toEqual({ result: '0', eliminated: 2 });
    // "-110.0" → result is 0 → no sign
    expect(eliminateMatches('-110.0')).toEqual({ result: '0.0', eliminated: 2 });
  });

  it('drops the decimal point when the whole decimal part is eliminated', () => {
    // Regression: must not emit a malformed "5." — the trailing dot is dropped
    expect(eliminateMatches('5.55')).toEqual({ result: '5', eliminated: 2 });
    expect(eliminateMatches('0.11')).toEqual({ result: '0', eliminated: 2 });
    expect(eliminateMatches('12.00')).toEqual({ result: '12', eliminated: 2 });
    expect(eliminateMatches('-5.55')).toEqual({ result: '-5', eliminated: 2 });
  });
});

describe('checkOverflow', () => {
  it('returns false for short numbers', () => {
    expect(checkOverflow('1234')).toBe(false);
  });

  it('returns false at exactly MAX_DISPLAY_DIGITS (12)', () => {
    expect(checkOverflow('123456789012')).toBe(false);
  });

  it('returns true at 13 digits', () => {
    expect(checkOverflow('1234567890123')).toBe(true);
  });

  it('treats exponential notation (e/E) as overflow', () => {
    expect(checkOverflow('1.234e+10')).toBe(true);
    expect(checkOverflow('1E+5')).toBe(true);
  });

  it('ignores the minus sign and decimal point in the digit count', () => {
    expect(checkOverflow('-123456789012')).toBe(false);
    expect(checkOverflow('-1234567890123')).toBe(true);
    expect(checkOverflow('1234567890.12')).toBe(false);
  });

  // End-to-end with formatDisplay: a non-terminating division must not read as
  // overflow, while a genuinely-too-big integer still must.
  it('does not flag a rounded repeating decimal (1÷3) as overflow', () => {
    expect(checkOverflow(formatDisplay(1 / 3))).toBe(false);
  });

  it('flags a 13-digit integer result as overflow', () => {
    expect(checkOverflow(formatDisplay(1234567890123))).toBe(true);
  });
});

describe('getDigitCount', () => {
  it('counts plain digits', () => {
    expect(getDigitCount('1234')).toBe(4);
  });

  it('excludes the minus sign and decimal point', () => {
    expect(getDigitCount('-12.34')).toBe(4);
  });

  it('returns 0 for empty / non-numeric strings', () => {
    expect(getDigitCount('')).toBe(0);
    expect(getDigitCount('.')).toBe(0);
  });
});
