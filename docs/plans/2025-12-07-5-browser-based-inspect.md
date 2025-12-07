# Browser Inspect Feature

## Summary

When an item is selected in the list, pressing `i` generates an HTML detail view of the exchange and opens it in the system's default web browser via a `file:///` URL.

## Architecture

```
User presses 'i'
    ↓
main.ts handles INSPECT key
    ↓
Gets selected exchange from ScreenRenderer + ExchangeHistory
    ↓
Generates HTML via ExchangeHtmlGenerator
    ↓
Saves HTML to storage dir (alongside JSON)
    ↓
Opens browser via BrowserOpener (platform-specific)
```

## Files to Create/Modify

### 1. [src/infrastructure/raw-keyboard-input.ts](src/infrastructure/raw-keyboard-input.ts)

Add `i` key mapping to new `INSPECT` normalized key:

```typescript
const KEYS = {
  // ... existing
  I_LOWER: "i",
  I_UPPER: "I",
};

export const NormalizedKeys = {
  // ... existing
  INSPECT: "inspect",
};
```

### 2. [src/application/services/exchange-history.ts](src/application/services/exchange-history.ts)

Add method to get exchange by index:

```typescript
public getByIndex(index: number): HttpExchange | undefined {
  return this.exchanges[index];
}
```

### 3. NEW: [src/application/services/exchange-html-generator.ts](src/application/services/exchange-html-generator.ts)

New service to generate beautiful HTML from an HttpExchange:

- Modern, clean design with CSS variables
- Syntax highlighting for JSON bodies
- Collapsible sections for headers/body
- Status code coloring matching TUI
- Responsive layout
- Dark mode support
- httpSandwich branding

### 4. NEW: [src/infrastructure/browser-opener.ts](src/infrastructure/browser-opener.ts)

Cross-platform browser opener using `child_process.exec`:

- macOS: `open <url>`
- Linux: `xdg-open <url>`
- Windows: `start "" <url>`

### 5. [src/infrastructure/file-exchange-store.ts](src/infrastructure/file-exchange-store.ts)

Add method to save HTML file:

```typescript
public async saveHtml(exchangeId: string, html: string): Promise<string> {
  const filePath = join(this.storageDir, `${exchangeId}.html`);
  await writeFile(filePath, html, "utf-8");
  return filePath;
}
```

### 6. [src/cli/main.ts](src/cli/main.ts)

Handle the inspect key:

```typescript
case NormalizedKeys.INSPECT:
  if (renderer.isSelectionActive()) {
    const index = renderer.getSelectedIndex();
    if (index !== null) {
      const exchange = history.getByIndex(index);
      if (exchange) {
        const html = generateExchangeHtml(exchange);
        const filePath = await store.saveHtml(exchange.id, html);
        openBrowser(`file://${filePath}`);
      }
    }
  }
  break;
```

## HTML Design

The generated HTML will be a self-contained page with:

- **Header**: httpSandwich branding, timestamp, duration badge
- **Request section**: Method pill, path, headers table, body viewer
- **Response section**: Status badge (color-coded), headers table, body viewer
- **Footer**: File path, session info

Style: Modern, minimal, inspired by developer tools. Embedded CSS (no external deps).

## Barrel Exports

Update `src/infrastructure/index.ts` and `src/application/index.ts` to export new modules.

## Test Considerations

- Unit test HTML generator with mock exchange data
- Unit test browser opener (mock child_process)
- Integration: verify HTML file is created with correct content
