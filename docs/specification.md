# Sasso - Classic Macintosh Style Calculator

## Overview

Sasso is a calculator-based puzzle game with Classic Macintosh System 7 inspired design.

## Tech Stack

- React 18
- TypeScript
- Vite
- CSS (vanilla)

## UI Specification

### Desktop Background
- Solid gray (#808080)

### Menu Bar
- White background with black bottom border
- Items: GitHub logo, Calculator, Practice, Endless (mode selection)
- Height: 20px

### Window
- Border radius: 8px
- Border: 3px solid black
- Shadow: 5px 5px 0 black
- Centered on screen

### Title Bar
- Background: black
- Height: 24px
- Bottom border: 3px solid black
- Title "Sasso": white, 18px, bold, centered
- Close box: 16px x 16px, white background, left aligned

### Window Content
- Background: staggered dot pattern (1px black dots, 4px spacing)
- Padding: 12px 14px 12px 12px

### Display
- White background
- Fixed width: 140px
- Border: 2px solid black
- Inner shadow: inset 2px 2px 0 #888
- Text: right-aligned, 20px
- Overflow: hidden (prevents horizontal stretching)

### Keypad
- CSS Grid layout: 4 columns
- Column gap: 4px
- Row gap: 8px

### Buttons
- Size: 34px x 28px
- Background: white
- Border: 2px solid black
- Shadow: 2px 2px 0 black
- Font size: 16px
- Active state: no shadow, translate 2px right/down, inverted colors (black bg, white text)

### Operator Buttons
- Bold font weight
- Symbols: × (multiply), ÷ (divide), − (minus), + (plus), =, C, E

### Special Buttons
- 0 button: 2 columns wide, text left-aligned (padding-left: 12px)
- + button: 2 rows tall, text bottom-aligned

## Button Layout

```
| C | E | = | × |
| 7 | 8 | 9 | ÷ |
| 4 | 5 | 6 | − |
| 1 | 2 | 3 |   |
| 0     | . | + |
```

## Game Modes

### Calculator Mode
- Standard calculator functionality
- No game mechanics

### Practice Mode
- Free play with elimination mechanics
- No time pressure
- Score tracking enabled

### Endless Mode
- Predictions every 4.2 seconds
- Countdown displayed as analog clock (to avoid confusion with game numbers)
- Score and chain tracking

## Elimination Animation
- Matching digits flash (black/white alternating) for 400ms before disappearing
- Chain reactions show consecutive animations

## Score Display
- Positioned above calculator window
- Shows: Score, Chains
- Score breakdown formula: `+X = Base×Chain×Prep×Risk`
- Labels: (Base×Chain×Prep×Risk)

## Calculation History
- Positioned below calculator window
- Max width: 300px with word-break
- Operators displayed in bold

## Keyboard Controls

| Key | Function |
|-----|----------|
| 0-9 | Digit input |
| + | Add |
| - | Subtract |
| * | Multiply |
| / | Divide |
| Enter, = | Execute calculation |
| Escape, C, c | Clear all |
| Backspace, Delete, E, e | Clear entry |
| . | Decimal point |

## File Structure

```
src/
├── App.tsx        # Main component, calculator UI and game state
├── App.css        # Style definitions
├── gameLogic.ts   # Game logic (elimination, scoring, predictions)
├── index.css      # Global styles
└── main.tsx       # Entry point
```

## Error Handling
- Division by zero: displays "E"
- Overflow: exponential notation (4 digit precision)

## Display Format
- Maximum 10 digits
- Numbers exceeding 10 digits shown in exponential notation
