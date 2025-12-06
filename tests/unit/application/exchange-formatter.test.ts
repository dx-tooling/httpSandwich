import { describe, it, expect } from "vitest";
import { formatExchange, calculateTotalLines } from "@/application";
import { DetailLevel, HttpStatusCategory, type HttpExchange } from "@/domain";

describe("ExchangeFormatter", () => {
  function createMockExchange(overrides?: Partial<HttpExchange>): HttpExchange {
    return {
      id: "test-id",
      timestamp: new Date("2024-01-15T14:32:05"),
      request: {
        method: "GET",
        path: "/api/users",
        headers: { "content-type": "application/json" },
        body: null,
      },
      response: {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: '{"users":[]}',
      },
      durationMs: 42,
      ...overrides,
    };
  }

  describe("formatExchange", () => {
    describe("level 1", () => {
      it("should return single dot", () => {
        const exchange = createMockExchange();
        const result = formatExchange(exchange, DetailLevel.of(1));

        expect(result.lineCount).toBe(1);
        expect(result.lines[0]).toContain(".");
      });

      it("should return success category for 2xx", () => {
        const exchange = createMockExchange({
          response: { statusCode: 200, headers: {}, body: null },
        });
        const result = formatExchange(exchange, DetailLevel.of(1));

        expect(result.category).toBe(HttpStatusCategory.Success);
      });
    });

    describe("level 2", () => {
      it("should include time and status code", () => {
        const exchange = createMockExchange();
        const result = formatExchange(exchange, DetailLevel.of(2));

        expect(result.lineCount).toBe(1);
        expect(result.lines[0]).toContain("14:32:05");
        expect(result.lines[0]).toContain("200");
      });

      it("should show --- for unreachable", () => {
        const exchange = createMockExchange({ response: null });
        const result = formatExchange(exchange, DetailLevel.of(2));

        expect(result.lines[0]).toContain("---");
        expect(result.category).toBe(HttpStatusCategory.Unreachable);
      });
    });

    describe("level 3", () => {
      it("should include time, status, method, and path", () => {
        const exchange = createMockExchange();
        const result = formatExchange(exchange, DetailLevel.of(3));

        expect(result.lineCount).toBe(1);
        expect(result.lines[0]).toContain("14:32:05");
        expect(result.lines[0]).toContain("200");
        expect(result.lines[0]).toContain("GET");
        expect(result.lines[0]).toContain("/api/users");
      });
    });

    describe("level 4", () => {
      it("should be multi-line with headers", () => {
        const exchange = createMockExchange();
        const result = formatExchange(exchange, DetailLevel.of(4));

        expect(result.lineCount).toBeGreaterThan(1);
        expect(result.lines.some((l) => l.includes("Request Headers"))).toBe(true);
        expect(result.lines.some((l) => l.includes("Response Headers"))).toBe(true);
      });

      it("should include duration", () => {
        const exchange = createMockExchange({ durationMs: 42 });
        const result = formatExchange(exchange, DetailLevel.of(4));

        expect(result.lines[0]).toContain("42ms");
      });

      it("should truncate long header values", () => {
        const longValue = "x".repeat(150);
        const exchange = createMockExchange({
          request: {
            method: "GET",
            path: "/test",
            headers: { "x-long-header": longValue },
            body: null,
          },
        });
        const result = formatExchange(exchange, DetailLevel.of(4));

        // Header value should be truncated with ellipsis
        expect(result.lines.some((l) => l.includes("..."))).toBe(true);
        // Should not contain the full 150 char value
        expect(result.lines.some((l) => l.includes(longValue))).toBe(false);
      });
    });

    describe("level 5", () => {
      it("should include truncated body", () => {
        const longBody = "x".repeat(1000);
        const exchange = createMockExchange({
          response: { statusCode: 200, headers: {}, body: longBody },
        });
        const result = formatExchange(exchange, DetailLevel.of(5));

        expect(result.lines.some((l) => l.includes("Response Body"))).toBe(true);
        // Should be truncated
        expect(result.lines.some((l) => l.includes("..."))).toBe(true);
      });

      it("should show full header values", () => {
        const longValue = "x".repeat(150);
        const exchange = createMockExchange({
          request: {
            method: "GET",
            path: "/test",
            headers: { "x-long-header": longValue },
            body: null,
          },
        });
        const result = formatExchange(exchange, DetailLevel.of(5));

        // Should contain the full header value
        expect(result.lines.some((l) => l.includes(longValue))).toBe(true);
      });
    });

    describe("level 6", () => {
      it("should include full body", () => {
        const body = '{"key": "value"}';
        const exchange = createMockExchange({
          response: { statusCode: 200, headers: {}, body },
        });
        const result = formatExchange(exchange, DetailLevel.of(6));

        expect(result.lines.some((l) => l.includes("Response Body"))).toBe(true);
        expect(result.lines.some((l) => l.includes("key"))).toBe(true);
      });
    });

    describe("status categories", () => {
      it("should categorize 4xx as ClientError", () => {
        const exchange = createMockExchange({
          response: { statusCode: 404, headers: {}, body: null },
        });
        const result = formatExchange(exchange, DetailLevel.of(1));

        expect(result.category).toBe(HttpStatusCategory.ClientError);
      });

      it("should categorize 5xx as ServerError", () => {
        const exchange = createMockExchange({
          response: { statusCode: 500, headers: {}, body: null },
        });
        const result = formatExchange(exchange, DetailLevel.of(1));

        expect(result.category).toBe(HttpStatusCategory.ServerError);
      });

      it("should categorize 3xx as Redirect", () => {
        const exchange = createMockExchange({
          response: { statusCode: 301, headers: {}, body: null },
        });
        const result = formatExchange(exchange, DetailLevel.of(1));

        expect(result.category).toBe(HttpStatusCategory.Redirect);
      });
    });
  });

  describe("calculateTotalLines", () => {
    it("should sum line counts", () => {
      const exchanges = [createMockExchange(), createMockExchange(), createMockExchange()];

      const formatted = exchanges.map((e) => formatExchange(e, DetailLevel.of(1)));
      const total = calculateTotalLines(formatted);

      expect(total).toBe(3); // Level 1 = 1 line each
    });

    it("should handle multi-line formats", () => {
      const exchanges = [createMockExchange(), createMockExchange()];

      const formatted = exchanges.map((e) => formatExchange(e, DetailLevel.of(4)));
      const total = calculateTotalLines(formatted);

      expect(total).toBeGreaterThan(2);
    });
  });
});
