// Timing
export const COUNTDOWN_TIME = 10000; // 10 seconds
export const SPRINT_TIME_LIMIT = 180000; // 3 minutes
export const MAX_TIME_FACTOR = 300000; // 5 minutes for difficulty scaling
export const ELIMINATION_ANIMATION_MS = 400; // Flash animation duration
export const CHAIN_CHECK_DELAY_MS = 100; // Delay before checking for chain

// Display
export const MAX_DISPLAY_DIGITS = 12; // Game over at 13+ digits

// Scoring
export const BASE_SCORE_PER_DIGIT = 10;
export const MAX_PREP_BONUS = 3.0;
export const MAX_RISK_BONUS = 2.0;
export const PREP_BONUS_PER_CALC = 0.2;

// Prediction
export const OPERATOR_PROB = {
  add: 0.4,
  sub: 0.3,
  mul: 0.15,
  div: 0.15,
} as const;

export const OPERAND_RANGE = {
  min: 1,
  max: 99,
  baseMax: 10,
  timeScaling: 40,
} as const;

// Attack thresholds
export const ATTACK_THRESHOLDS = {
  mild: 50,
  medium: 150,
  strong: 300,
  devastating: 500,
} as const;

// URLs
export const GITHUB_URL = 'https://github.com/kako-jun/sasso';
