# CLAUDE.md - Project Context for Claude

## Project: Sasso

A calculator-based puzzle game with Classic Macintosh System 7 design.

## Quick Start

```bash
npm run dev   # Start dev server
npm run build # Build for production
```

## Documentation

- [docs/game-design.md](docs/game-design.md) - Game rules, scoring, attack system
- [docs/specification.md](docs/specification.md) - UI specs, file structure, controls

## Key Concepts

### Game Mechanics
- **Elimination**: Adjacent identical digits disappear
- **Gravity**: Right (digits compress rightward after elimination)
- **Game Over**: 10+ digits (overflow)
- **Surrender**: C/E press or digit after = during gameplay

### Score Formula
```
Score = Base × Chain × Prep × Risk
- Base: eliminated digits × 10
- Chain: chain count (1+)
- Prep: 1 + (calculations × 0.2), max 3.0
- Risk: 1 + (digits ÷ 10), max 2.0
```

### Attack Effect (2P Battle)
Score → Opponent's next prediction difficulty
- Higher score = more multiplication, bigger numbers, multiple predictions

## Architecture

```
src/
├── App.tsx        # UI, game state, React components
├── App.css        # All styling
├── gameLogic.ts   # Core logic: elimination, scoring, predictions
├── index.css      # Global styles (Chicago font)
└── main.tsx       # Entry point
```

### Key Functions in gameLogic.ts
- `eliminateMatches()` - Single pass elimination
- `processElimination()` - Full chain processing
- `findEliminationIndices()` - For animation
- `calculateScore()` - Score with all bonuses
- `generatePrediction()` - Next operation (with attack effect)
- `calculateAttackEffect()` - Difficulty scaling

## Game Modes

| Mode | Predictions | Time Limit | Score |
|------|-------------|------------|-------|
| Calculator | No | No | No |
| Practice | No | No | Yes |
| Endless | Yes (4.2s) | No | Yes |

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
