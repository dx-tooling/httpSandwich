# Add Scroll Navigation

## Overview

Implement manual scroll navigation allowing users to browse exchange history using arrow keys, with escape returning to auto-scroll (tail) mode.

## Key Behaviors

1. **Auto-scroll mode (default)**: Viewport always shows newest entries
2. **Manual scroll mode**: Activated by pressing arrow up/down, viewport position controlled by user
3. **Return to auto-scroll**: Pressing Escape exits manual mode and snaps back to newest entries
4. **Visual indicator**: Footer shows current scroll mode and position

## Implementation

### 1. Extend Keyboard Input

Update [`src/infrastructure/raw-keyboard-input.ts`](src/infrastructure/raw-keyboard-input.ts):

- Add ANSI escape sequences for arrow keys (`\x1b[A`, `\x1b[B`)
- Add escape key (`\x1b`)
- Add new `NormalizedKeys`: `SCROLL_UP`, `SCROLL_DOWN`, `ESCAPE`

### 2. Add Scroll State to ScreenRenderer

Update [`src/application/services/screen-renderer.ts`](src/application/services/screen-renderer.ts):

- Add `scrollMode: 'auto' | 'manual'` state
- Add `scrollOffset: number` for manual scroll position (lines from bottom)
- Add methods: `scrollUp()`, `scrollDown()`, `resetScroll()`
- Modify `calculateVisibleLines()` to respect scroll offset in manual mode
- In auto mode, new exchanges trigger redraw; in manual mode, they don't scroll

### 3. Update Footer Display

Update [`src/application/services/tui-layout.ts`](src/application/services/tui-layout.ts):

- Add scroll mode indicator to `renderFooter()`
- Show position like "viewing 45-67 of 100" in manual mode

### 4. Wire Up in Main

Update [`src/cli/main.ts`](src/cli/main.ts):

- Handle new key events for scroll navigation
- Connect `SCROLL_UP` -> `renderer.scrollUp()`
- Connect `SCROLL_DOWN` -> `renderer.scrollDown()`
- Connect `ESCAPE` -> `renderer.resetScroll()`

## Testing

- Unit tests for scroll state management
- Unit tests for arrow key normalization
- Test scroll boundaries (can't scroll past beginning/end)
