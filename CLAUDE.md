# CLAUDE.md - Project Context for Claude

## Project: Sasso

A calculator-based puzzle game with Classic Macintosh System 7 design.

## Quick Start

```bash
npm run dev   # Start dev server
npm run build # Build for production
npm run lint  # Run ESLint
```

## Documentation

- [docs/game-design.md](docs/game-design.md) - Game rules, scoring, attack system
- [docs/specification.md](docs/specification.md) - UI specs, controls
- [docs/architecture.md](docs/architecture.md) - File structure, hooks, patterns
- [docs/battle-mode.md](docs/battle-mode.md) - 2P battle mode (Nostr-based)

## Key Concepts

### Game Mechanics

- **Elimination**: Adjacent identical digits disappear
- **Gravity**: Right (digits compress rightward after elimination)
- **Game Over**: 13+ digits or exponential notation (overflow), 3 min time limit (Sprint)
- **Surrender**: C/E press or digit after = during gameplay

### Score Formula

```
Score = Base × Chain × Prep × Risk
- Base: eliminated digits × 10
- Chain: chain count² (1, 4, 9...)
- Prep: 1 + (calculations × 0.2), max 3.0
- Risk: 1 + (digits ÷ 10), max 2.0
```

### Attack Effect (2P Battle)

Score → Opponent's next prediction difficulty

- Higher score = more multiplication, bigger numbers, multiple predictions

## Architecture

```
src/
├── App.tsx              # Layout component (63 lines)
├── components/          # UI components (Window, Display, Keypad, etc.)
├── hooks/               # React hooks
│   ├── useGameController.ts  # Main controller
│   ├── useGame.ts            # Game state (composed)
│   ├── useCalculator.ts      # Calculator (useReducer)
│   ├── useElimination.ts     # Scoring/elimination
│   ├── usePrediction.ts      # Prediction state
│   └── useEndlessMode.ts     # Endless mode timer
├── game/                # Pure game logic
│   ├── elimination.ts   # Digit elimination
│   ├── scoring.ts       # Score calculation
│   ├── prediction.ts    # Prediction generation
│   └── attack.ts        # Attack effects
├── types/               # TypeScript types
├── constants/           # Game constants
└── utils/               # Utilities
```

### Key Modules

| Module                     | Key Functions                                                   |
| -------------------------- | --------------------------------------------------------------- |
| game/elimination.ts        | `processElimination`, `findEliminationIndices`, `checkOverflow` |
| game/scoring.ts            | `calculateScore`, `shouldTriggerAttack`                         |
| game/prediction.ts         | `generatePrediction`                                            |
| hooks/useCalculator.ts     | Calculator state (useReducer pattern)                           |
| hooks/useGameController.ts | Bridges calculator + game, handles input                        |

## Game Modes

| Mode       | Predictions | Time Limit | Score | Notes                      |
| ---------- | ----------- | ---------- | ----- | -------------------------- |
| Calculator | No          | No         | No    | Standard calculator        |
| Practice   | No          | No         | Yes   | Free play with elimination |
| Sprint     | Yes (10s)   | 3:00       | Yes   | Time attack                |
| Endless    | Yes (10s)   | No         | Yes   | Survival                   |
| Battle     | Yes (10s)   | No         | Yes   | 2P online via Nostr        |

## UI Layout (Non-overlapping during gameplay)

```
┌─────────────────────┐
│ [Prediction ÷2]     │  ← Above calculator
├─────────────────────┤
│ Score: X  Chains: Y │  ← Above calculator
│ +X = Base×Chain×... │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │     Sasso       │ │
│ │   [Display]     │ │  ← Calculator (center)
│ │   [Keypad]      │ │
│ └─────────────────┘ │
├─────────────────────┤
│ 123 + 456 = 579     │  ← Below calculator
└─────────────────────┘
```

## Style Notes

- Background: Solid gray (#808080)
- Operators: Bold, use × ÷ − symbols
- Button active: Inverted colors (black bg, white text)
- Elimination: 400ms flash animation
