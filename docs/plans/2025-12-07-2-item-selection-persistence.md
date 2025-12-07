# Persist Selection Across Level Changes

## Overview

Currently, changing the detail level resets selection mode. This breaks the natural workflow of:

1. Spot an interesting request at low detail level
2. Select it
3. Increase detail level to investigate

## Change

In [`src/application/services/screen-renderer.ts`](src/application/services/screen-renderer.ts), the `setLevel()` method currently resets selection:

```typescript
public setLevel(level: DetailLevel): void {
  if (!this.currentLevel.equals(level)) {
    this.currentLevel = level;
    // Reset scroll when level changes (content structure changes)
    this.selectionMode = "none";    // <-- Remove this
    this.selectedIndex = null;       // <-- Remove this
    this.redraw();
  }
}
```

Simply remove the two lines that reset selection state. The selection index refers to the exchange position in history, which doesn't change when the detail level changes.

## Test Update

Update the test "should reset selection when detail level changes" to verify that selection **persists** across level changes instead.
