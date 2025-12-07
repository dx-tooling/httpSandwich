# Item Selection Navigation

## Overview

Replace viewport scrolling with an item selection model. Arrow keys highlight individual exchanges in the list rather than scrolling the viewport. Selection always starts at the newest (last) item.

## Key Behaviors

1. **Normal mode (default)**: No selection highlight, viewport auto-scrolls to newest
2. **Selection mode**: Activated by ↑/↓ arrow, highlights the selected exchange
3. **Initial selection**: Always starts at the newest (last) item
4. **Viewport follows selection**: When selection moves outside visible area, viewport adjusts to keep it visible
5. **Exit selection**: Escape returns to normal mode (no highlight, auto-scroll)

## Visual Design

Selected item gets a visual indicator - options:

- Inverted colors (background swap)
- Leading marker like `▶` or `>`
- Bold/bright styling

## Implementation Changes

### 1. Update ScreenRenderer State

Replace scroll offset with selection index:

- `selectionMode: 'none' | 'active'`
- `selectedIndex: number | null` (index into exchange history, null = no selection)

### 2. Modify Selection Methods

- `selectUp()`: Enter selection mode if not active (select last), else move selection to previous item
- `selectDown()`: Move selection to next item (toward newest), exit selection mode if at last
- `resetSelection()`: Clear selection, return to normal mode

### 3. Update Exchange Formatter

Add parameter to indicate if an exchange is selected, apply highlight styling.

### 4. Update Viewport Rendering

- Track which item is selected
- Ensure selected item is visible (adjust viewport window if needed)
- Apply highlight to selected item's lines

### 5. Update Footer

Show selection mode indicator and position (e.g., "viewing 15 of 42")

## Files to Modify

- [`src/application/services/screen-renderer.ts`](src/application/services/screen-renderer.ts) - Selection state and methods
- [`src/application/services/exchange-formatter.ts`](src/application/services/exchange-formatter.ts) - Highlight styling
- [`src/application/services/tui-layout.ts`](src/application/services/tui-layout.ts) - Footer update
- [`src/infrastructure/color-scheme.ts`](src/infrastructure/color-scheme.ts) - Selection highlight colors
