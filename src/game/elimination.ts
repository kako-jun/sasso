import type { EliminationResult } from '../types';
import { MAX_DISPLAY_DIGITS } from '../constants';

interface RunInfo {
  char: string;
  count: number;
  startIndex: number;
}

/**
 * Find runs of consecutive identical characters in a string part
 */
function findConsecutiveRuns(part: string, offset: number): RunInfo[] {
  const runs: RunInfo[] = [];
  let i = 0;

  while (i < part.length) {
    const char = part[i];
    let count = 1;

    while (i + count < part.length && part[i + count] === char) {
      count++;
    }

    runs.push({ char, count, startIndex: offset + i });
    i += count;
  }

  return runs;
}

/**
 * Parse display string into parts (handling negative and decimal)
 */
function parseDisplay(displayStr: string): {
  isNegative: boolean;
  parts: string[];
  offset: number;
} {
  const isNegative = displayStr.startsWith('-');
  const workStr = isNegative ? displayStr.slice(1) : displayStr;
  return {
    isNegative,
    parts: workStr.split('.'),
    offset: isNegative ? 1 : 0,
  };
}

/**
 * Find indices of digits that will be eliminated (for animation)
 * Decimal point acts as a wall and won't be eliminated
 */
export function findEliminationIndices(displayStr: string): number[] {
  const { parts, offset } = parseDisplay(displayStr);
  const indices: number[] = [];
  let currentIndex = 0;

  for (const part of parts) {
    const runs = findConsecutiveRuns(part, currentIndex + offset);

    for (const run of runs) {
      if (run.count >= 2) {
        for (let j = 0; j < run.count; j++) {
          indices.push(run.startIndex + j);
        }
      }
    }

    currentIndex += part.length + 1; // +1 for the dot
  }

  return indices;
}

/**
 * Eliminate adjacent identical digits
 * Decimal point acts as a wall
 */
export function eliminateMatches(displayStr: string): { result: string; eliminated: number } {
  const { isNegative, parts } = parseDisplay(displayStr);
  let totalEliminated = 0;

  const processedParts = parts.map((part) => {
    if (part.length === 0) return part;

    const runs = findConsecutiveRuns(part, 0);
    let result = '';

    for (const run of runs) {
      if (run.count >= 2) {
        totalEliminated += run.count;
      } else {
        result += run.char;
      }
    }

    return result;
  });

  let resultStr = processedParts.join('.');

  // Handle empty result
  if (resultStr === '' || resultStr === '.') {
    resultStr = '0';
  }

  // Clean up leading zeros
  if (resultStr.includes('.')) {
    const [intPart, decPart] = resultStr.split('.');
    const cleanInt = intPart.replace(/^0+/, '') || '0';
    resultStr = cleanInt + '.' + decPart;
  } else {
    resultStr = resultStr.replace(/^0+/, '') || '0';
  }

  // Restore negative sign
  if (isNegative && resultStr !== '0') {
    resultStr = '-' + resultStr;
  }

  return { result: resultStr, eliminated: totalEliminated };
}

/**
 * Process elimination chains until no more matches
 */
export function processElimination(displayStr: string): EliminationResult {
  let current = displayStr;
  let totalEliminated = 0;
  let chains = 0;

  let eliminated = 1;
  while (eliminated > 0) {
    const matchResult = eliminateMatches(current);
    eliminated = matchResult.eliminated;

    if (eliminated > 0) {
      totalEliminated += eliminated;
      chains++;
      current = matchResult.result;
    }
  }

  return {
    result: current,
    eliminated: totalEliminated,
    chains,
  };
}

/**
 * Check if display has overflowed (game over condition)
 * - 13+ digits = overflow
 * - Exponential notation (e) = overflow
 */
export function checkOverflow(displayStr: string): boolean {
  if (displayStr.includes('e') || displayStr.includes('E')) {
    return true;
  }
  return getDigitCount(displayStr) > MAX_DISPLAY_DIGITS;
}

/**
 * Get digit count (excluding minus sign and decimal point)
 */
export function getDigitCount(displayStr: string): number {
  return displayStr.replace(/[^0-9]/g, '').length;
}

/**
 * Generate initial state from current time
 */
export function generateInitialState(): string {
  const now = new Date();
  const timeStr = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  return timeStr.replace(/^0+/, '') || '0';
}
