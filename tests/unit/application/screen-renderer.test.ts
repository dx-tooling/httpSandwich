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
});
