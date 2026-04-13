# DESIGN.md — sasso (Classic Mac Calculator Puzzle Game)

## 1. Visual Theme

A calculator puzzle game faithfully recreating the Macintosh System 7 aesthetic. Pixel-precise black-and-white chrome, Chicago font headings, 3D button bevels via box-shadow, and the iconic rounded-corner window with a black title bar. The entire interface lives inside a single draggable calculator window on a dotted desktop background.

## 2. Color Palette

| Token        | Value     | Usage                                       |
| ------------ | --------- | ------------------------------------------- |
| `white`      | `#ffffff` | Window background, button faces, display bg |
| `black`      | `#000000` | Text, borders, title bar bg, shadows        |
| `gray`       | `#808080` | Desktop background                          |
| `title-text` | `#ffffff` | Title bar text (white on black)             |

This is a strictly monochrome palette. No grays other than the desktop, no accent colors. All visual interest comes from border weight, shadow placement, and pattern fills.

## 3. Typography

| Role           | Font                         | Size        | Weight |
| -------------- | ---------------------------- | ----------- | ------ |
| Title bar      | `Chicago, Geneva, system-ui` | 13px        | 700    |
| Display digits | `Chicago, Geneva, system-ui` | 24px        | 400    |
| Button labels  | `Chicago, Geneva, system-ui` | 12px (base) | 400    |
| Status text    | `Geneva, system-ui`          | 11px        | 400    |

Chicago is the defining System 7 font. Geneva serves as fallback. The base font size is 12px to match the compact pixel density of classic Mac interfaces.

## 4. Component Stylings

### Calculator Window

- Border: `3px solid black`
- Border-radius: `8px`
- Box-shadow: `5px 5px 0 black`
- Background: `white`
- Max-width determined by keypad grid

### Title Bar

- Height: `24px`
- Background: `black`
- Text: `white`, centered, Chicago font
- Close box: small white square in left corner
- Border-bottom: included in window border

### Display

- Background: `white`
- Border: `2px inset` effect (simulated with box-shadow)
- Inset shadow for sunken appearance
- Right-aligned text
- Chicago font at 24px

### Keypad Buttons

- Layout: 4-column grid
- Size: `34px` wide x `28px` tall
- Border: `2px solid black`
- Box-shadow: `2px 2px 0 black`
- Background: `white`
- Active (pressed): `transform: translateY(2px)`, shadow removed
- No border-radius (square buttons)

### Dotted Desktop Background

- Generated with `radial-gradient`:
  ```
  background: radial-gradient(circle, #000 1px, transparent 1px);
  background-size: 6px 6px;
  background-color: #808080;
  ```

### Flash Animation

- Duration: `0.4s`
- Brief white flash on correct answer or special event
- CSS keyframe toggling opacity or background

## 5. Layout Principles

- Desktop fills the viewport with dotted gray background
- Calculator window is centered (or draggable) on the desktop
- Window contains: title bar, display, keypad — stacked vertically
- Keypad is a strict 4-column CSS grid
- No content outside the calculator window
- Internal padding: 8px around keypad, 4px between buttons

## 6. Depth & Elevation

Depth is achieved entirely through black box-shadows with zero blur (hard pixel shadows).

| Element           | Shadow                   | Notes                  |
| ----------------- | ------------------------ | ---------------------- |
| Window            | `5px 5px 0 black`        | Main calculator window |
| Buttons (default) | `2px 2px 0 black`        | Raised state           |
| Buttons (pressed) | None + `translateY(2px)` | Sunken state           |
| Display           | Inset shadow             | Recessed display area  |

No blur, no spread, no colored shadows. This is a pixel-art shadow system.

## 7. Do's and Don'ts

**Do:**

- Use only black, white, and #808080 gray
- Apply `box-shadow: Npx Npx 0 black` for all depth (no blur)
- Use Chicago / Geneva / system-ui font stack
- Keep button press feedback as `translateY(2px)` with shadow removal
- Maintain the 4-column keypad grid
- Use 8px border-radius only on the window frame

**Don't:**

- Add colors, gradients, or transparency
- Use blur on any shadow
- Use border-radius on buttons (only on the window)
- Add modern UI patterns (tooltips, toasts, modals)
- Use fonts other than Chicago/Geneva/system-ui
- Scale the interface beyond its natural pixel size

## 8. Responsive Behavior

| Condition           | Behavior                                                                |
| ------------------- | ----------------------------------------------------------------------- |
| Default             | Calculator centered on desktop, natural size                            |
| `max-height: 500px` | Reduce button sizes, tighten padding                                    |
| Small viewports     | Scale down the calculator proportionally; desktop fills remaining space |

The calculator window should not reflow into a different layout. It maintains its fixed aspect ratio and grid. On very small screens, CSS `transform: scale()` can shrink the entire window while preserving pixel relationships.

## 9. Agent Prompt Guide

When modifying or extending sasso:

- **All colors**: Only `#fff`, `#000`, `#808080` — no exceptions
- **Fonts**: Chicago first, Geneva fallback, system-ui last resort. Base 12px
- **Window**: 3px solid black border, 8px border-radius, `5px 5px 0 black` shadow
- **Title bar**: 24px height, black bg, white text, centered
- **Buttons**: 34x28px, 2px solid black border, `2px 2px 0 black` shadow
- **Button press**: `translateY(2px)`, remove shadow
- **Desktop**: `#808080` with radial-gradient dot pattern
- **Shadows**: Always hard (0 blur), always black, always offset only
- **New elements**: Must fit within the calculator window; no external UI
- **Flash effect**: 0.4s animation duration
