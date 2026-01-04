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

/**
 * Format number for display
 */
export function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'E';
  const str = parseFloat(value.toPrecision(10)).toString();
  return str.length > 10 ? value.toExponential(4) : str;
}
