# Sasso - Architecture

## Project Structure

```
src/
├── App.tsx                 # Main component (layout only, 63 lines)
├── App.css                 # Style definitions
├── main.tsx                # Entry point
├── index.css               # Global styles (Chicago font)
│
├── components/             # UI Components
│   ├── index.ts            # Barrel exports
│   ├── Window.tsx          # Reusable window component
│   ├── Display.tsx         # Calculator display with elimination animation
│   ├── Keypad.tsx          # Data-driven keypad layout
│   ├── MenuBar.tsx         # Mode selection menu
│   ├── ScoreArea.tsx       # Score and chain display
│   ├── PredictionArea.tsx  # Next operation and countdown
│   ├── CalculationHistory.tsx  # Calculation log
│   ├── GameOverlay.tsx     # Game over and start prompt
│   └── MultiplicationHelper.tsx  # Indian/Vedic method visualization
│
├── hooks/                  # React Hooks
│   ├── index.ts            # Barrel exports
│   ├── useGameController.ts  # Main controller (bridges calculator + game)
│   ├── useGame.ts          # Game state management
│   ├── useCalculator.ts    # Calculator logic (useReducer pattern)
│   ├── useElimination.ts   # Elimination, scoring, chain animation
│   ├── usePrediction.ts    # Prediction state
│   ├── usePredictionTimer.ts # Shared prediction countdown logic
│   ├── useEndlessMode.ts   # Endless/Sprint mode integration
│   ├── useBattleMode.ts    # Battle mode orchestration
│   ├── useSeededPrediction.ts # Deterministic prediction (battle sync)
│   ├── useArena.ts         # Room management (nostr-arena)
│   └── useKeyboard.ts      # Keyboard input handling
│
├── game/                   # Game Logic (pure functions)
│   ├── index.ts            # Barrel exports
│   ├── elimination.ts      # Digit elimination, chains, overflow
│   ├── scoring.ts          # Score calculation
│   ├── prediction.ts       # Prediction generation
│   └── attack.ts           # Attack effect calculation
│
├── types/                  # TypeScript Types
│   └── index.ts            # All type definitions
│
├── constants/              # Constants
│   └── index.ts            # Game constants (timing, scoring, etc.)
│
└── utils/                  # Utilities
    ├── index.ts            # Barrel exports
    ├── calculator.ts       # Math operations
    └── format.ts           # Display formatting
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│                    (Layout Component)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼───────────────────┐ ┌─────▼─────────────────────────┐
│    useGameController      │ │        useBattleMode          │
│  (Single-player modes)    │ │      (Battle mode only)       │
├───────────────────────────┤ ├───────────────────────────────┤
│  ┌─────────────────────┐  │ │  ┌─────────────────────────┐  │
│  │   useCalculator     │  │ │  │    useCalculator        │  │
│  │ (useReducer pattern)│  │ │  │  (useReducer pattern)   │  │
│  └─────────────────────┘  │ │  └─────────────────────────┘  │
│  ┌─────────────────────┐  │ │  ┌─────────────────────────┐  │
│  │      useGame        │  │ │  │  useSeededPrediction    │  │
│  │  (Composed Hook)    │  │ │  │  (Deterministic sync)   │  │
│  └──────────┬──────────┘  │ │  └─────────────────────────┘  │
│             │             │ │  ┌─────────────────────────┐  │
│  ┌──────────┴──────────┐  │ │  │      useArena           │  │
│  │                     │  │ │  │  (Room management)      │  │
│  ▼                     ▼  │ │  └─────────────────────────┘  │
│ usePrediction  useElimination │                             │
│      │              │     │ │                               │
│      └──────┬───────┘     │ │                               │
│             ▼             │ │                               │
│       useEndlessMode      │ │                               │
│             │             │ │                               │
└─────────────┼─────────────┘ └───────────────┬───────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
                    ┌─────────────────────┐
                    │ usePredictionTimer  │ (Shared countdown logic)
                    │ useElimination      │ (Shared chain/score)
                    └─────────────────────┘
```

## Hooks Overview

| Hook                | Responsibility                                    |
| ------------------- | ------------------------------------------------- |
| useGameController   | Bridges calculator and game, handles key input    |
| useGame             | Composes game state from sub-hooks                |
| useCalculator       | Calculator state machine (useReducer)             |
| useElimination      | Elimination chain animation and scoring           |
| usePrediction       | Prediction state and generation                   |
| usePredictionTimer  | Shared prediction countdown and application logic |
| useEndlessMode      | Endless/Sprint mode integration                   |
| useBattleMode       | Battle mode orchestration (room + game)           |
| useSeededPrediction | Deterministic prediction with shared seed         |
| useArena            | Room management using nostr-arena                 |
| useKeyboard         | Keyboard event handling                           |

## Game Logic Modules

| Module         | Responsibility             | Key Functions                                                 |
| -------------- | -------------------------- | ------------------------------------------------------------- |
| elimination.ts | Digit matching and removal | `eliminateMatches`, `findEliminationIndices`, `checkOverflow` |
| scoring.ts     | Score calculation          | `calculateScore`, `shouldTriggerAttack`                       |
| prediction.ts  | Next operation generation  | `generatePrediction`, `generateAttackPredictions`             |
| attack.ts      | Attack effect calculation  | `calculateAttackEffect`                                       |

## Components Overview

| Component            | Responsibility                                    |
| -------------------- | ------------------------------------------------- |
| Window               | Reusable Mac-style window with title bar          |
| Display              | Shows calculator value with elimination animation |
| Keypad               | Data-driven button grid (KEYPAD_LAYOUT config)    |
| MenuBar              | Mode selection (Calculator/Practice/Endless)      |
| ScoreArea            | Score, chains, and breakdown display              |
| PredictionArea       | Next operation and countdown clock                |
| CalculationHistory   | Shows last calculation                            |
| GameOverlay          | Game over message and retry button                |
| MultiplicationHelper | Indian/Vedic multiplication visualization         |

### Battle Components (`src/components/battle/`)

| Component           | Responsibility                            |
| ------------------- | ----------------------------------------- |
| BattleApp           | Battle mode UI orchestration              |
| BattleLayout        | Desktop (50/50 split) / Mobile responsive |
| BattleOverlay       | Waiting/Ready/Finished overlays           |
| RoomCreation        | Create/Join room UI with QR scanner       |
| MobileOpponentScore | Simple opponent score for mobile          |
| OpponentHeader      | Opponent score bar for desktop            |
| AttackIndicator     | Visual indicator when under attack        |

## Design Patterns

### useReducer Pattern (useCalculator)

Calculator state uses useReducer for predictable state transitions:

```typescript
type CalculatorAction =
  | { type: 'RESET' }
  | { type: 'INPUT_DIGIT'; payload: string }
  | { type: 'SET_OPERATOR'; payload: CalcOperator };
// ... etc
```

### Hook Composition (useGame)

useGame composes smaller hooks:

- usePrediction (prediction state)
- useElimination (scoring state)
- useEndlessMode (timer logic)

### Data-Driven Components (Keypad)

Keypad uses configuration array instead of hardcoded buttons:

```typescript
const KEYPAD_LAYOUT: KeyConfig[][] = [
  [{ key: 'C', label: 'C', className: 'key key--op' }, ...],
  // ... rows
];
```

### Key Mapping (useKeyboard)

Keyboard input uses mapping object:

```typescript
const KEY_MAPPINGS: Record<string, string> = {
  Enter: '=',
  Escape: 'C',
  // ...
};
```

## Constants

All game constants are centralized in `constants/index.ts`:

| Constant             | Value             | Description                    |
| -------------------- | ----------------- | ------------------------------ |
| COUNTDOWN_TIME       | 10000             | Prediction interval (ms)       |
| SPRINT_TIME_LIMIT    | 180000            | Sprint mode time limit (3 min) |
| MAX_DISPLAY_DIGITS   | 12                | Game over at 13+ digits        |
| BASE_SCORE_PER_DIGIT | 10                | Score per eliminated digit     |
| OPERATOR_PROB        | {add: 0.4, ...}   | Initial operator probabilities |
| OPERAND_RANGE        | {min: 1, max: 99} | Operand value range            |

## Type Definitions

All types are in `types/index.ts`:

- `GameMode`: 'calculator' | 'practice' | 'sprint' | 'endless' | 'battle'
- `Operator`: '+' | '-' | '\*' | '/'
- `Prediction`: { operator, operand }
- `ScoreResult`: { totalScore, baseScore, chainMultiplier, ... }
- `EliminationResult`: { result, eliminated, chains }
