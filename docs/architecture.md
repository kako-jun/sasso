# Sasso - Architecture

## Project Structure

```
public/
├── manifest.json           # PWA manifest
├── icon.svg                # App icon (SVG source)
├── icon-192.png            # PWA icon 192x192
├── icon-512.png            # PWA icon 512x512
├── apple-touch-icon.png    # iOS home screen icon
├── favicon-16.png          # Favicon 16x16
└── favicon-32.png          # Favicon 32x32

src/
├── App.tsx                 # Top-level layout + battle/single-player routing
├── App.css                 # Style definitions
├── main.tsx                # Entry point
├── index.css               # Global styles (Chicago font)
├── global.d.ts             # Ambient declarations (nostalgic-counter web component)
│
├── components/             # UI Components
│   ├── index.ts            # Barrel exports
│   ├── Window.tsx          # Reusable Mac window (onClose optional for read-only windows)
│   ├── Display.tsx         # Calculator display with elimination animation
│   ├── Keypad.tsx          # Data-driven keypad layout (read-only mode for opponent)
│   ├── MenuBar.tsx         # Calculator / Game dropdown / About
│   ├── ScoreArea.tsx       # Last score breakdown display
│   ├── PredictionArea.tsx  # Next operation and countdown clock
│   ├── CalculationHistory.tsx  # Calculation log
│   ├── GameOverlay.tsx     # GameOverOverlay + StartPrompt
│   ├── AboutModal.tsx      # About dialog (version, sponsor, links)
│   ├── VisitorCounter.tsx  # Nostalgic visitor counter (in About modal)
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
│   ├── useBattleAttack.ts  # Battle attack I/O (incoming/outgoing)
│   ├── useBattleLifecycle.ts # Battle lifecycle FSM (start/over/reset)
│   ├── useSeededPrediction.ts # Deterministic prediction (battle sync)
│   ├── useArena.ts         # Room management (nostr-arena)
│   └── useKeyboard.ts      # Keyboard input handling
│
├── game/                   # Game Logic (pure functions)
│   ├── index.ts            # Barrel exports
│   ├── elimination.ts      # Digit elimination, chains, overflow
│   ├── scoring.ts          # Score calculation
│   ├── prediction.ts       # Prediction generation (single-player, Math.random)
│   ├── battlePrediction.ts # Seeded prediction generator (battle, deterministic)
│   ├── seededRandom.ts     # LCG seeded RNG (matches glibc constants)
│   └── attack.ts           # Attack effect calculation
│
├── types/                  # TypeScript Types
│   ├── index.ts            # Calculator / game / scoring / prediction / attack types
│   └── battle.ts           # SassoGameState, RoomState, OpponentState
│
├── constants/              # Constants
│   └── index.ts            # Game constants (timing, scoring, etc.)
│
└── utils/                  # Utilities
    ├── index.ts            # Barrel exports
    ├── calculator.ts       # Math operations
    ├── format.ts           # Display formatting
    └── battleEvents.ts     # Custom window event dispatch for battle mode
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

| Hook                | Responsibility                                         |
| ------------------- | ------------------------------------------------------ |
| useGameController   | Bridges calculator and game, handles key input         |
| useGame             | Composes game state from sub-hooks                     |
| useCalculator       | Calculator state machine (useReducer)                  |
| useElimination      | Elimination chain animation and scoring                |
| usePrediction       | Prediction state and generation                        |
| usePredictionTimer  | Shared prediction countdown and application logic      |
| useEndlessMode      | Endless/Sprint mode integration                        |
| useBattleMode       | Battle mode orchestration (room + game)                |
| useBattleAttack     | Battle attack I/O (incoming receive + outgoing queue)  |
| useBattleLifecycle  | Battle lifecycle FSM (start/surrender/game over/reset) |
| useSeededPrediction | Deterministic prediction with shared seed              |
| useArena            | Room management using nostr-arena                      |
| useKeyboard         | Keyboard event handling                                |

## Game Logic Modules

| Module         | Responsibility             | Key Functions                                                 |
| -------------- | -------------------------- | ------------------------------------------------------------- |
| elimination.ts | Digit matching and removal | `eliminateMatches`, `findEliminationIndices`, `checkOverflow` |
| scoring.ts     | Score calculation          | `calculateScore`, `shouldTriggerAttack`                       |
| prediction.ts  | Next operation generation  | `generatePrediction`                                          |
| attack.ts      | Attack effect calculation  | `calculateAttackEffect`                                       |

## Components Overview

| Component            | Responsibility                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| Window               | Reusable Mac-style window with title bar                                    |
| Display              | Shows calculator value with elimination animation                           |
| Keypad               | Data-driven button grid (KEYPAD_LAYOUT config)                              |
| MenuBar              | Calculator + Game dropdown (Practice/Sprint/Endless/Battle) + About + score |
| ScoreArea            | Score, chains, and breakdown display                                        |
| PredictionArea       | Next operation and countdown clock                                          |
| CalculationHistory   | Shows last calculation                                                      |
| GameOverlay          | Game over message (cause + hint) and retry button                           |
| MultiplicationHelper | Indian/Vedic multiplication visualization                                   |

### Battle Components (`src/components/battle/`)

| Component             | Responsibility                            |
| --------------------- | ----------------------------------------- |
| BattleApp             | Battle mode UI orchestration              |
| BattleLayout          | Desktop (50/50 split) / Mobile responsive |
| BattleOverlay         | Waiting / Ready / Joining overlays        |
| BattleFinishedOverlay | Result + rematch / leave (inside Window)  |
| RoomCreation          | Create / Join room UI with QR scanner     |
| MobileOpponentScore   | Simple opponent score for mobile          |
| OpponentHeader        | Opponent score bar for desktop            |

Note: under-attack visualisation is rendered by `PredictionArea` itself
(via `isUnderAttack` prop) — there is no separate `AttackIndicator` component.

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
