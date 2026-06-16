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
- Items (left to right): GitHub logo, Calculator, Game (dropdown: Practice / Sprint / Endless / Battle), About
- Sprint timer displayed after About when in Sprint mode
- Current score shown right-aligned during gameplay
- Height: 20px

### About Dialog

Opened from the `About` menu item. Shows the app name, version, the worldwide play
counter, and the line "Figuring out the rules is part of the game." Links row:
**How to Play** (opens the README rules, `#how-to-play`), GitHub, Homepage — plus a Sponsor
button. The rules link is intentionally opt-in (only reachable via About) so the discovery
of the rules stays part of the game.

### Window

- Border radius: 8px
- Border: 3px solid black
- Shadow: 5px 5px 0 black
- Centered on screen
- On short viewports (`max-height: 500px`) the window is pinned to `top: 24px` instead of vertically centered, so its title bar clears the 20px menu bar. The multiplication helper has its own short-viewport rules (see [Multiplication Helper](#multiplication-helper)).

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
- - button: 2 rows tall, text bottom-aligned

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

- Predictions every 10 seconds
- Countdown displayed as analog clock (to avoid confusion with game numbers)
- Score and chain tracking

### Sprint Mode

- Same as Endless but with 3-minute time limit
- Game ends when time runs out

### Battle Mode

- 2-player online mode via Nostr
- Host waiting screen nudges to re-share at ~60s and shows an expired state at 10 min (New Room → Create screen)
- See [battle-mode.md](battle-mode.md) for details

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

## Multiplication Helper

- Shown in prediction modes (Endless / Battle) only when the upcoming prediction is a multiplication (`×N`); visualizes the Indian "井" line method
- Default: positioned just below the calculator window (`top: calc(50% + 215px)`, centered)
- `max-height: 720px`: pinned to the viewport bottom (`position: fixed; bottom: 12px; transform: scale(.8)`) so it never overflows below the fold on short portrait phones
- `max-height: 500px`: tucked slightly higher and smaller (`bottom: 28px; scale(.75)`) for landscape

## Keyboard Controls

| Key                     | Function            |
| ----------------------- | ------------------- |
| 0-9                     | Digit input         |
| +                       | Add                 |
| -                       | Subtract            |
| \*                      | Multiply            |
| /                       | Divide              |
| Enter, =                | Execute calculation |
| Escape, C, c            | Clear all           |
| Backspace, Delete, E, e | Clear entry         |
| .                       | Decimal point       |

## Error Handling

- Division by zero: displays "E"
- Overflow: exponential notation (4 digit precision)

## Display Format

- Manual digit input is capped at `MAX_DISPLAY_DIGITS` (12) — additional digit presses are ignored, like a real calculator
- Calculation results longer than 10 characters are formatted as 4-digit exponential notation
- Any exponential notation result, or a digit count exceeding `MAX_DISPLAY_DIGITS`, triggers overflow (game over)

## SEO / Discoverability

Static assets served from `public/` (copied verbatim into `dist/` by Vite):

- `robots.txt` — allows all crawlers, references the sitemap, and disallows the ephemeral `/battle` room URLs
- `sitemap.xml` — single canonical entry for `https://sasso.llll-ll.com/`
- `og-image.png` — 600×314 capture of the in-game calculator screen (display showing `42`), kept at a low resolution so the fixed-size calculator window fills the frame while the top menu bar stays visible; used by Open Graph + Twitter `summary_large_image`

`index.html` carries the canonical link, Open Graph / Twitter Card metadata, and a JSON-LD
`VideoGame` block (rendered as an inline `<script type="application/ld+json">`). Canonical URL:
`https://sasso.llll-ll.com/`.
