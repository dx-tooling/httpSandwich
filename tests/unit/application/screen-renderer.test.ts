import { describe, it, expect, beforeEach } from "vitest";
import { ScreenRenderer, TuiLayout, ExchangeHistory } from "@/application";
import { Address, DetailLevel, createHttpExchange, type HttpExchange } from "@/domain";
import { MockTerminalUI } from "../../helpers/mock-terminal-ui.js";

/**
 * Helper to create a test HttpExchange with standard structure.
 */
function createTestExchange(overrides?: {
  method?: string;
  path?: string;
  statusCode?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string | null;
  responseHeaders?: Record<string, string>;
  responseBody?: string | null;
}): HttpExchange {
  return createHttpExchange({
    request: {
      method: overrides?.method ?? "GET",
      path: overrides?.path ?? "/",
      headers: overrides?.requestHeaders ?? {},
      body: overrides?.requestBody ?? null,
    },
    response: {
      statusCode: overrides?.statusCode ?? 200,
      headers: overrides?.responseHeaders ?? {},
      body: overrides?.responseBody ?? null,
    },
    durationMs: 42,
  });
}

describe("ScreenRenderer", () => {
  let terminal: MockTerminalUI;
  let history: ExchangeHistory;
  let layout: TuiLayout;
  let renderer: ScreenRenderer;
  const fromAddress = Address.parse("8000");
  const toAddress = Address.parse("localhost:5009");
  const storagePath = "/tmp/test-exchanges";

  function createRenderer(level: DetailLevel = DetailLevel.of(3)): ScreenRenderer {
    return new ScreenRenderer({
      terminal,
      history,
      layout,
      fromAddress,
      toAddress,
      storagePath,
      initialLevel: level,
    });
  }

  beforeEach(() => {
    terminal = new MockTerminalUI();
    terminal.setSize(24, 80);
    history = new ExchangeHistory(100);
    layout = new TuiLayout(terminal);
    renderer = createRenderer();
  });

  describe("initialization", () => {
    it("should start with the configured detail level", () => {
      const rendererLevel5 = createRenderer(DetailLevel.of(5));
      expect(rendererLevel5.getLevel().value).toBe(5);
    });

    it("should clear screen on initialize", () => {
      renderer.initialize();
      expect(terminal.operations).toContain("clearScreen");
    });
  });

  describe("level management", () => {
    it("should increment level", () => {
      renderer = createRenderer(DetailLevel.of(3));
      renderer.incrementLevel();
      expect(renderer.getLevel().value).toBe(4);
    });

    it("should decrement level", () => {
      renderer = createRenderer(DetailLevel.of(3));
      renderer.decrementLevel();
      expect(renderer.getLevel().value).toBe(2);
    });

    it("should not increment beyond max level", () => {
      renderer = createRenderer(DetailLevel.of(6));
      renderer.incrementLevel();
      expect(renderer.getLevel().value).toBe(6);
    });

    it("should not decrement below min level", () => {
      renderer = createRenderer(DetailLevel.of(1));
      renderer.decrementLevel();
      expect(renderer.getLevel().value).toBe(1);
    });

    it("should redraw when level changes", () => {
      renderer.initialize();
      terminal.clear();

      renderer.incrementLevel();

      // Should have redrawn - check for header rendering
      expect(terminal.operations).toContain("moveCursor(1,1)");
    });

    it("should not redraw when level stays the same", () => {
      renderer = createRenderer(DetailLevel.of(6));
      renderer.initialize();
      terminal.clear();

      // Try to increment beyond max - level stays at 6
      renderer.incrementLevel();

      // Should not have redrawn (no operations)
      expect(terminal.operations.length).toBe(0);
    });
  });

  describe("redraw", () => {
    it("should render header with addresses and level", () => {
      renderer.initialize();

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("Malcolm");
      expect(allText).toContain("8000");
      expect(allText).toContain("localhost:5009");
    });

    it("should render footer with exchange count", () => {
      renderer.initialize();

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("0/100"); // 0 exchanges, 100 capacity
      expect(allText).toContain(storagePath);
    });

    it("should show waiting message when no exchanges", () => {
      renderer.initialize();

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("Waiting for requests");
    });

    it("should render exchanges when present", () => {
      const exchange = createTestExchange({
        method: "GET",
        path: "/api/test",
        statusCode: 200,
        responseBody: "OK",
      });

      history.add(exchange);
      renderer.initialize();

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("200");
      expect(allText).toContain("GET");
      expect(allText).toContain("/api/test");
    });
  });

  describe("onNewExchange", () => {
    it("should redraw when new exchange is added", () => {
      renderer.initialize();
      terminal.clear();

      const exchange = createTestExchange({
        method: "POST",
        path: "/data",
        statusCode: 201,
      });

      history.add(exchange);
      renderer.onNewExchange(exchange);

      // Should have redrawn
      expect(terminal.operations).toContain("moveCursor(1,1)");
    });

    it("should update footer count after new exchange", () => {
      renderer.initialize();

      const exchange = createTestExchange();

      history.add(exchange);
      terminal.clear();
      renderer.onNewExchange(exchange);

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("1/100");
    });
  });

  describe("level 1 rendering", () => {
    it("should render dots for level 1", () => {
      renderer = createRenderer(DetailLevel.of(1));

      // Add multiple exchanges
      for (let i = 0; i < 5; i++) {
        history.add(createTestExchange());
      }

      renderer.initialize();

      const allText = terminal.writtenText.join("");
      // Should contain dots (colored)
      expect(allText).toMatch(/[•.]/);
    });
  });

  describe("viewport management", () => {
    it("should auto-scroll to show newest exchanges", () => {
      renderer = createRenderer(DetailLevel.of(3));
      terminal.setSize(10, 80); // Small terminal

      // Add many exchanges
      for (let i = 0; i < 20; i++) {
        history.add(
          createTestExchange({
            path: `/api/${String(i)}`,
          })
        );
      }

      renderer.initialize();

      const allText = terminal.writtenText.join("");
      // Should show recent paths, not oldest
      expect(allText).toContain("/api/19");
    });
  });

  describe("item selection navigation", () => {
    beforeEach(() => {
      renderer = createRenderer(DetailLevel.of(3));
      terminal.setSize(10, 80); // Small terminal for selection testing

      // Add many exchanges to ensure scrollable content
      for (let i = 0; i < 30; i++) {
        history.add(
          createTestExchange({
            path: `/api/${String(i)}`,
          })
        );
      }
      renderer.initialize();
    });

    it("should start with no selection", () => {
      expect(renderer.isSelectionActive()).toBe(false);
      expect(renderer.getSelectedIndex()).toBeNull();
    });

    it("should enter selection mode on selectUp and select last item", () => {
      renderer.selectUp();
      expect(renderer.isSelectionActive()).toBe(true);
      // Should select last item (newest, index 29)
      expect(renderer.getSelectedIndex()).toBe(29);
    });

    it("should move selection to older items on subsequent selectUp", () => {
      renderer.selectUp(); // Select last (29)
      renderer.selectUp(); // Move to 28
      renderer.selectUp(); // Move to 27

      expect(renderer.getSelectedIndex()).toBe(27);
    });

    it("should exit selection mode when selectDown reaches last item", () => {
      renderer.selectUp(); // Select last (29)
      renderer.selectUp(); // Move to 28
      expect(renderer.isSelectionActive()).toBe(true);

      renderer.selectDown(); // Move to 29
      expect(renderer.getSelectedIndex()).toBe(29);

      renderer.selectDown(); // Exit selection mode
      expect(renderer.isSelectionActive()).toBe(false);
      expect(renderer.getSelectedIndex()).toBeNull();
    });

    it("should reset selection on resetSelection", () => {
      renderer.selectUp();
      renderer.selectUp();
      expect(renderer.isSelectionActive()).toBe(true);

      renderer.resetSelection();
      expect(renderer.isSelectionActive()).toBe(false);
      expect(renderer.getSelectedIndex()).toBeNull();
    });

    it("should show newest content after resetSelection", () => {
      renderer.selectUp();
      renderer.selectUp();
      renderer.selectUp();
      terminal.clear();

      renderer.resetSelection();

      const allText = terminal.writtenText.join("");
      expect(allText).toContain("/api/29");
    });

    it("should not select past the first item", () => {
      // Select up many times
      for (let i = 0; i < 100; i++) {
        renderer.selectUp();
      }

      // Should be at first item (index 0)
      expect(renderer.getSelectedIndex()).toBe(0);
    });

    it("should not enter selection mode when selectDown is called with no selection", () => {
      expect(renderer.isSelectionActive()).toBe(false);
      renderer.selectDown();
      expect(renderer.isSelectionActive()).toBe(false);
    });

    it("should show selection indicator in footer when selection active", () => {
      terminal.clear();
      renderer.selectUp();

      const allText = terminal.writtenText.join("");
      // Should show position indicator like [30/30]
      expect(allText).toContain("[30/30]");
    });

    it("should not show selection indicator when no selection", () => {
      renderer.initialize();

      const allText = terminal.writtenText.join("");
      // Should not have a selection indicator
      expect(allText).not.toMatch(/\[\d+\/\d+\]/);
    });

    it("should provide selection state with correct values", () => {
      renderer.selectUp();
      renderer.selectUp();

      const state = renderer.getSelectionState();
      expect(state.mode).toBe("active");
      expect(state.totalItems).toBe(30);
      expect(state.selectedItem).toBe(29); // 1-indexed display value
    });

    it("should reset selection when detail level changes", () => {
      renderer.selectUp();
      renderer.selectUp();
      expect(renderer.isSelectionActive()).toBe(true);

      renderer.incrementLevel();
      expect(renderer.isSelectionActive()).toBe(false);
    });

    it("should highlight selected item with inverted colors", () => {
      terminal.clear();
      renderer.selectUp(); // Select last item

      const allText = terminal.writtenText.join("");
      // Should contain the selection ANSI code (reverse video)
      expect(allText).toContain("\x1b[7m");
    });

    it("should keep selected item visible when scrolling viewport", () => {
      // Select and move to an older item
      for (let i = 0; i < 25; i++) {
        renderer.selectUp();
      }
      terminal.clear();
      renderer.redraw();

      const allText = terminal.writtenText.join("");
      // The selected item (index 5, path /api/5) should be visible
      expect(allText).toContain("/api/5");
    });

    // Legacy API compatibility tests
    it("should support legacy scrollUp alias", () => {
      renderer.scrollUp();
      expect(renderer.isManualScrollMode()).toBe(true);
    });

    it("should support legacy scrollDown alias", () => {
      renderer.scrollUp();
      renderer.scrollDown();
      expect(renderer.isManualScrollMode()).toBe(false);
    });

    it("should support legacy resetScroll alias", () => {
      renderer.scrollUp();
      renderer.resetScroll();
      expect(renderer.isManualScrollMode()).toBe(false);
    });
  });
});
