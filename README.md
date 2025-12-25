# Sasso

A puzzle game for Mensa members. If you don't understand the name, you're not qualified to play.

## What is Sasso?

Sasso is a calculator-based puzzle game inspired by falling-block games like Puyo Puyo and Tetris. Instead of manipulating blocks, you manipulate numbers using basic arithmetic operations to create adjacent identical digits and eliminate them.

## How to Play

### The Goal
Eliminate digits by making them adjacent and identical. When two or more identical digits are next to each other, they disappear!

### Example
- Display shows `12`
- You multiply by `7`: `12 × 7 = 84`
- The `8` and `4` are now adjacent... but not matching
- Add `40`: `84 + 40 = 124`
- Still no matches...
- Try `124 × 9 = 1116` - now you have three `1`s in a row! They vanish!

### Game Over
- **Overflow**: If your number exceeds 10 digits, you lose
- **Surrender**: Pressing C (Clear) or E (Entry Clear) is immediate surrender
- **Misoperation**: Pressing a digit after `=` is also surrender (you should press an operator to continue)

### Special Rules
- **Negative numbers**: Allowed and can be strategic
- **Decimals**: The decimal point acts as a "wall" - `3.3` won't eliminate even though the digits match
- **Consecutive `=`**: Pressing `=` repeatedly repeats the last operation (`5 + 3 = 8`, then `= 11`, then `= 14`...)

## Game Modes

### Calculator
Standard calculator. No game mechanics. Practice your arithmetic.

### Practice
Free play with elimination mechanics. No time pressure. Learn the game at your own pace.

### Endless
The real challenge. Predictions appear every 4.2 seconds showing what operation is coming (e.g., "×7"). Prepare your numbers to survive the incoming operation and eliminate digits before you overflow!

## Scoring

```
Score = Base × Chain × Prep × Risk
```

| Component | What it means |
|-----------|---------------|
| Base | Eliminated digits × 10 |
| Chain | Chain reaction count (1.0+) |
| Prep | Bonus for setup calculations (1.0-3.0) |
| Risk | Bonus for high digit count (1.0-2.0) |

The more complex your setup, the higher your score. Playing close to overflow gives risk bonus.

## Controls

| Key | Action |
|-----|--------|
| 0-9 | Enter digits |
| + - * / | Operators |
| Enter or = | Calculate |
| Escape or C | Clear (surrender in game) |
| Backspace or E | Clear entry (surrender in game) |
| . | Decimal point |

## Setup for Developers

```bash
npm install
npm run dev
```

## Tech Stack

- React 18 + TypeScript + Vite
- Classic Macintosh System 7 inspired design
- Vanilla CSS

---

*"A game only Mensa members can understand."*
