import type { ScoreResult } from './gameLogic';

export type CalcOperator = '+' | '-' | '*' | '/' | null;

export interface CalculatorState {
  display: string;
  accumulator: number | null;
  operator: CalcOperator;
  waitingForOperand: boolean;
  lastOperator: CalcOperator;
  lastOperand: number | null;
}

export interface GameState {
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  justPressedEqual: boolean;
  score: number;
  chains: number;
  calculationCount: number;
  lastScoreBreakdown: ScoreResult | null;
  calculationHistory: string;
  eliminatingIndices: number[];
  isAnimating: boolean;
}

export interface PredictionState {
  prediction: import('./gameLogic').Prediction | null;
  countdown: number;
  gameStartTime: number | null;
}
