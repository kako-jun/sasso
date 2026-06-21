import type { CalcOperator } from '../types';

/**
 * Perform arithmetic calculation
 */
export function calculate(left: number, right: number, op: Exclude<CalcOperator, null>): number {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return right === 0 ? NaN : left / right;
  }
}

// Significant digits the calculator display can hold.
const DISPLAY_PRECISION = 10;

/**
 * Format a number for the calculator display.
 *
 * Mirrors a physical calculator: a non-terminating division such as 1÷3 is
 * rounded to fit (0.3333333333), never flipped to exponential. That matters
 * because checkOverflow treats exponential ('e') as game over, so turning a
 * small decimal into exponential used to end the run on a harmless 0.33.
 *
 * Whole numbers render in full, so a genuinely-too-big integer (13+ digits) is
 * still caught by checkOverflow's digit count, and divide-by-zero (non-finite)
 * shows "E" (which checkOverflow treats as overflow).
 */
export function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'E';

  // Whole numbers in full — checkOverflow ends the run on 13+ digits.
  if (Number.isInteger(value)) return String(value);

  // Round non-integers to the display precision; never go exponential for a
  // normal-magnitude value.
  const rounded = parseFloat(value.toPrecision(DISPLAY_PRECISION));
  if (Number.isInteger(rounded)) return String(rounded);

  const str = rounded.toString();
  if (!str.includes('e') && !str.includes('E')) return str;

  // Very small magnitudes (|x| < 1e-6) stringify to exponential; render as a
  // plain trimmed decimal so they stay in play rather than reading as overflow.
  return rounded.toFixed(DISPLAY_PRECISION).replace(/0+$/, '').replace(/\.$/, '');
}
