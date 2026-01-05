# Sasso - Game Design Document

## Game Overview

Sasso is a puzzle game based on a calculator.
Pronounced "Sasso". A term only Mensa members can understand.

## Concept

A puzzle game where you use the four arithmetic operations to create adjacent identical digits and eliminate them.

## Basic Rules

### Gravity and Compression Direction

- Gravity pulls to the right
- After elimination, remaining digits are compressed rightward (fall to the right)

### Elimination Rules

- Adjacent identical digits are eliminated
- After elimination, remaining digits compress right, potentially causing chain reactions

### Game Over Conditions

- Digit overflow (13+ digits or exponential notation) = Game Over
- Sprint mode: Time runs out (3:00) = Game Over

### Surrender (Immediate Loss)

- Pressing a digit after = → Surrender (misoperation)
  - After =, you should press an operator to continue calculation
- Pressing C or E → Surrender
  - These buttons are decorative or surrender buttons during gameplay

### Consecutive = Presses

- Pressing = repeatedly repeats the previous calculation (standard calculator behavior)
- Example: `5 + 3 = 8` → `= 11` → `= 14` (+3 is repeated)
- In game, consecutive = can be used strategically to quickly adjust values

### Number Rules

- Negative values: Allowed
- Decimal point: Does not trigger elimination even when adjacent
  - Example: "3.3" has identical digits adjacent but won't eliminate
  - Decimal point acts as a "wall" in elimination logic

### Initial State

- Generated from date/time at game start
- Example: 2025/12/25 14:30:45 → "143045" or processed value
- Different initial state each game

### Game Start Timing

- Game starts the moment any button is pressed
- The button pressed triggers the first input
  - Example: Press "1" to start → Game starts with "1" already input
  - Example: Press "+" to start → Operator is already input
  - Example: Press "C" to start → Initial value is cleared
- No time to leisurely observe the initial value

## Scoring System

### Score Formula

```
Score = Base × Chain × Prep × Risk
```

| Component | Calculation                                     | Range      |
| --------- | ----------------------------------------------- | ---------- |
| Base      | Eliminated digits × 10                          | -          |
| Chain     | Chain count² (squared)                          | 1, 4, 9... |
| Prep      | 1 + (calculations since last elimination × 0.2) | 1.0-3.0    |
| Risk      | 1 + (digit count before elimination ÷ 10)       | 1.0-2.0    |

### Score Examples

- Simple 2-digit elimination (3 digits, 1 calculation):
  `2×10×1×1.2×1.3 = 31 points`

- 5 calculations prep, 2-digit elimination (7 digits):
  `2×10×1×2.0×1.7 = 68 points`

- 2-chain 4-digit elimination (9 digits, 8 calculations prep):
  `4×10×4×2.6×1.9 = 790 points` (Chain² = 4)

### Attack Power

- Attack Power = Score
- Higher score = stronger attack on opponent

## Attack Effect Algorithm

Attack power affects opponent's next prediction difficulty:

| Attack Power | Difficulty  | Multiply Prob | Number Scale | Predictions |
| ------------ | ----------- | ------------- | ------------ | ----------- |
| 0-50         | Normal      | +0%           | 1.0x         | 1           |
| 51-150       | Mild        | +10%          | 1.2x         | 1           |
| 151-300      | Medium      | +20%          | 1.5x         | 1           |
| 301-500      | Strong      | +30%          | 1.8x         | 2           |
| 501+         | Devastating | +40%          | 2.0x         | 3           |

Effects:

- **Multiply Prob**: Increases chance of multiplication (causes digit growth)
- **Number Scale**: Larger operands
- **Predictions**: Multiple predictions queued at once

## Game Modes

### Practice Mode

- No predictions, no time limit
- Free play to understand elimination mechanics
- Score is tracked

### Sprint Mode

Time-limited scoring mode:

- Time limit: 3 minutes
- Predictions enabled (same as Endless)
- Compete for highest score within time limit
- Game over: Time runs out OR digit overflow
- Remaining time displayed in menu bar (replaces "Sprint" text)

### 1-Player Endless Mode

Falling puzzle format:

- "×7 coming in 10 seconds" - both operator and number are predicted
- Prediction interval: 10 seconds
- Player prepares by inputting numbers to set up eliminations
- Predicted operation executes, elimination check occurs
- Example: Current "12", "×7" predicted → becomes 84 → prepare adjacent 8 and 4 to eliminate

**Pending Calculation Handling:**

- If player has a pending operation when prediction fires (e.g., "100 +" or "100 + 1" before pressing =)
- The pending operation is discarded and reverted to the value before the operator was pressed
- Example: "100 + 1" (no =) → reverts to "100" → prediction applied to "100"
- This is a risk/reward mechanic: commit your calculation with = or lose it

### 2-Player Battle Mode

- Cause opponent's digit overflow to win

#### Prediction Synchronization

- At game start: Both players receive the same predictions (fair start)
- After first attack: Predictions diverge
  - Attacker continues with original prediction sequence
  - Defender receives new, harder predictions (based on attack power)
- Once diverged, predictions remain separate for the rest of the game

#### Attack System

- Attack trigger conditions:
  - Eliminate 3+ identical digits simultaneously
  - Trigger 2+ chain reactions
- Attack effect: Makes opponent's next prediction harder (see Attack Effect Algorithm)

## Prediction Algorithm (Tile Distribution)

### Operator Probability (Initial)

- Addition: 40%
- Subtraction: 30%
- Multiplication: 15%
- Division: 15%

### Number Range

- All operators: 1-99 (unified range)
- Time progression and attack effects increase the probability of larger numbers
- Base range expands from 10 to 50 over 5 minutes
- Attack multiplier can scale up to 2.0x (max 99)

### Difficulty Progression

- Multiplication probability gradually increases over time
- Number ranges gradually expand

## Screen Layout

### Basic Layout

- Vertical smartphone screen as base
- Calculator itself is vertical, fits well

### Element Positioning (Non-overlapping during gameplay)

- Prediction area: Above calculator
- Score area: Below prediction, above calculator
- Calculator: Center
- Calculation history: Below calculator

### Overlapping Elements (OK)

- Start prompt: Overlaps calculator (game hasn't started)
- Game over overlay: Inside calculator window

### Menu Bar (Top - Classic MacOS style)

Left side:

- GitHub logo
- Game mode selection (Calculator, Practice, Sprint, Endless)
- Sprint mode: Shows remaining time (M:SS) instead of "Sprint" during gameplay

### Score Display Area

- Above calculator window
- Shows: Score, Chains
- Score breakdown: `+X = Base×Chain×Prep×Risk`
- Labels: (Base×Chain×Prep×Risk)

### Prediction Display Area

- Above score area
- Shows next operation (e.g., "×7")
- Countdown as analog clock (digits would be confusing)

### Calculation History Area

- Below calculator window
- Shows calculations made this turn
- Operators displayed in bold
- Max width with word-break for long expressions

### Multiplication Helper (Indian/Vedic Method)

- Fixed at screen bottom
- Displays only when prediction is multiplication
- Shows last 2 digits of calculator × prediction operand
- Uses diagonal line intersection method (SVG)
  - Lines at 30° from horizontal
  - Dynamic spacing: 4px for digits >5, 6px otherwise
  - Supports up to 99×99
- Updates in real-time as calculator digits change
- Shows zone intersection counts and final result

### Battle Mode Screen (Landscape)

- Calculators left and right, equal size
- Prediction area above each calculator
- Score area above each calculator
- Calculation history below each calculator

## Design Decisions (Resolved)

- [x] Chain compression direction → Right (gravity on right)
- [x] Turn-based or real-time → Falling puzzle format (prediction + wait time)
- [x] What gets predicted → Both operator and number (e.g., ×7)
- [x] Prediction display time → 10 seconds
- [x] Decimal number handling → "3.3" doesn't eliminate (decimal is wall)
- [x] Battle mode attack conditions → 3+ simultaneous elimination or 2+ chains
- [x] Battle screen layout → Landscape, left/right calculators, equal size
- [x] Initial state → Generated from date/time (different each game)
- [x] Tile distribution algorithm → +40%/-30%/×15%/÷15%, numbers by operator, difficulty over time
- [x] Surrender conditions → C/E press, digit after = press = immediate loss
- [x] C/E at game start → Doesn't count as surrender (safe start)
- [x] Score system → Base×Chain×Prep×Risk formula
- [x] Attack algorithm → Score-based difficulty scaling
- [x] Pending calculation at prediction → Discard and revert to pre-operator value

## Future Development

Rules will be determined through trial and error.
