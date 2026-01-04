import type { EliminationResult } from '../types';

/**
 * Find indices of digits that will be eliminated (for animation)
 * Decimal point acts as a wall and won't be eliminated
 */
export function findEliminationIndices(displayStr: string): number[] {
  const isNegative = displayStr.startsWith('-');
  const workStr = isNegative ? displayStr.slice(1) : displayStr;
  const offset = isNegative ? 1 : 0;

  const indices: number[] = [];
  const parts = workStr.split('.');
  let currentIndex = 0;

  for (let partIdx = 0; partIdx < parts.length; partIdx++) {
    const part = parts[partIdx];
    let i = 0;

    while (i < part.length) {
      const char = part[i];
      let count = 1;

      while (i + count < part.length && part[i + count] === char) {
        count++;
      }

      if (count >= 2) {
        for (let j = 0; j < count; j++) {
          indices.push(currentIndex + i + j + offset);
        }
      }
      i += count;
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
  const isNegative = displayStr.startsWith('-');
  const workStr = isNegative ? displayStr.slice(1) : displayStr;

  const parts = workStr.split('.');
  let totalEliminated = 0;

  const processedParts = parts.map((part) => {
    if (part.length === 0) return part;

    let result = '';
    let i = 0;

    while (i < part.length) {
      const char = part[i];
      let count = 1;

      while (i + count < part.length && part[i + count] === char) {
        count++;
      }

      if (count >= 2) {
        totalEliminated += count;
        i += count;
      } else {
        result += char;
        i++;
      }
    }

    return result;
  });

  let resultStr = processedParts.join('.');

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
 */
export function checkOverflow(displayStr: string): boolean {
  const digits = displayStr.replace(/[^0-9]/g, '').length;
  return digits > 10;
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
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  const timeStr = `${hour}${minute}${second}`;
  return timeStr.replace(/^0+/, '') || '0';
}
