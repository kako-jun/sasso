// Calculator types
export type CalcOperator = '+' | '-' | '*' | '/' | null;

// Game types
export type GameMode = 'calculator' | 'practice' | 'endless';
export type Operator = '+' | '-' | '*' | '/';

// Prediction
export interface Prediction {
  operator: Operator;
  operand: number;
}

// Elimination
export interface EliminationResult {
  result: string;
  eliminated: number;
  chains: number;
}

// Attack
export interface AttackEffect {
  predictions: Prediction[];
  difficultyLevel: string;
  operatorBias: number;
  operandMultiplier: number;
}

export interface AttackParams {
  difficultyLevel: string;
  operatorBias: number;
  operandMultiplier: number;
  stackCount: number;
}

// Scoring
export interface ScoreParams {
  eliminated: number;
  chains: number;
  calculationsSinceLastElimination: number;
  digitCountBeforeElimination: number;
}

export interface ScoreResult {
  totalScore: number;
  baseScore: number;
  chainMultiplier: number;
  prepBonus: number;
  riskBonus: number;
  attackPower: number;
}

// Score breakdown for display
export interface ScoreBreakdown {
  score: number;
  base: number;
  chain: number;
  prep: number;
  risk: number;
}

// Game hook types
export interface UseGameOptions {
  onDisplayUpdate?: (newDisplay: string) => void;
}

export interface UseGameReturn {
  // Game state
  gameMode: GameMode;
  gameStarted: boolean;
  isGameOver: boolean;
  isSurrender: boolean;
  justPressedEqual: boolean;

  // Score
  score: number;
  chains: number;
  calculationCount: number;
  lastScoreBreakdown: ScoreResult | null;

  // Prediction
  prediction: Prediction | null;
  countdown: number;

  // Animation
  eliminatingIndices: number[];
  calculationHistory: string;

  // Actions
  changeGameMode: (mode: GameMode) => void;
  startGame: () => string;
  surrender: () => void;
  resetGame: () => void;
  setJustPressedEqual: (value: boolean) => void;
  incrementCalculationCount: () => void;
  setCalculationHistory: (value: string) => void;
  applyElimination: (displayStr: string, onDisplayUpdate?: (newDisplay: string) => void) => string;
  checkGameOverState: (displayStr: string) => boolean;
  syncDisplay: (display: string) => void;
}
