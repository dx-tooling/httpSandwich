import { describe, it, expect } from "vitest";
import { generateExchangeHtml } from "@/application";
import { createHttpExchange, type HttpExchange } from "@/domain";

/**
 * Helper to create a test HttpExchange.
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
      path: overrides?.path ?? "/api/test",
      headers: overrides?.requestHeaders ?? { "Content-Type": "application/json" },
      body: overrides?.requestBody ?? null,
    },
    response: {
      statusCode: overrides?.statusCode ?? 200,
      headers: overrides?.responseHeaders ?? { "Content-Type": "application/json" },
      body: overrides?.responseBody ?? null,
    },
    durationMs: 42,
  });
}

describe("generateExchangeHtml", () => {
  describe("basic structure", () => {
    it("should generate valid HTML document", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
    });

    it("should include httpSandwich branding", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("httpSandwich");
      expect(html).toContain("🥪");
    });

    it("should include embedded CSS", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("<style>");
      expect(html).toContain("</style>");
      expect(html).toContain(":root");
    });
  });

  describe("request display", () => {
    it("should display HTTP method", () => {
      const exchange = createTestExchange({ method: "POST" });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("POST");
      expect(html).toContain("method-post");
    });

    it("should display request path", () => {
      const exchange = createTestExchange({ path: "/api/users?page=2" });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("/api/users?page=2");
    });

    it("should display request headers", () => {
      const exchange = createTestExchange({
        requestHeaders: {
          Authorization: "Bearer token123",
          "X-Custom-Header": "custom-value",
        },
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("Authorization");
      expect(html).toContain("Bearer token123");
      expect(html).toContain("X-Custom-Header");
      expect(html).toContain("custom-value");
    });

    it("should display request body", () => {
      const exchange = createTestExchange({
        requestBody: '{"name":"John","age":30}',
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("Request Body");
      expect(html).toContain("John");
    });
  });

  describe("response display", () => {
    it("should display status code with success styling", () => {
      const exchange = createTestExchange({ statusCode: 200 });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("200");
      expect(html).toContain("OK");
      expect(html).toContain("status-success");
    });

    it("should display status code with client error styling", () => {
      const exchange = createTestExchange({ statusCode: 404 });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("404");
      expect(html).toContain("Not Found");
      expect(html).toContain("status-client-error");
    });

    it("should display status code with server error styling", () => {
      const exchange = createTestExchange({ statusCode: 500 });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("500");
      expect(html).toContain("Internal Server Error");
      expect(html).toContain("status-server-error");
    });

    it("should display response headers", () => {
      const exchange = createTestExchange({
        responseHeaders: {
          "Content-Type": "application/json",
          "X-Response-Time": "42ms",
        },
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("Content-Type");
      expect(html).toContain("application/json");
      expect(html).toContain("X-Response-Time");
      expect(html).toContain("42ms");
    });

    it("should display response body", () => {
      const exchange = createTestExchange({
        responseBody: '{"success":true,"data":[1,2,3]}',
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("Response Body");
      expect(html).toContain("success");
    });
  });

  describe("special cases", () => {
    it("should handle null response (unreachable server)", () => {
      const exchange = createHttpExchange({
        request: {
          method: "GET",
          path: "/api/test",
          headers: {},
          body: null,
        },
        response: null,
        durationMs: null,
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("No Response");
      expect(html).toContain("unreachable");
    });

    it("should escape HTML special characters in path", () => {
      const exchange = createTestExchange({
        path: "/api/<script>alert(1)</script>",
      });
      const html = generateExchangeHtml(exchange);

      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("should escape HTML special characters in body", () => {
      const exchange = createTestExchange({
        responseBody: "<html><body>Test</body></html>",
      });
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("&lt;html&gt;");
    });

    it("should format JSON bodies nicely", () => {
      const exchange = createTestExchange({
        responseHeaders: { "Content-Type": "application/json" },
        responseBody: '{"compact":"json"}',
      });
      const html = generateExchangeHtml(exchange);

      // Should be formatted with indentation
      expect(html).toContain("body-json");
    });

    it("should include exchange ID in footer", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("Exchange ID:");
      expect(html).toContain(exchange.id);
    });

    it("should include duration", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("42ms");
    });

    it("should include GitHub project link", () => {
      const exchange = createTestExchange();
      const html = generateExchangeHtml(exchange);

      expect(html).toContain("https://github.com/dx-tooling/httpSandwich");
      expect(html).toContain("httpSandwich on GitHub");
    });
  });

  describe("all HTTP methods", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

    for (const method of methods) {
      it(`should style ${method} method correctly`, () => {
        const exchange = createTestExchange({ method });
        const html = generateExchangeHtml(exchange);

        expect(html).toContain(method);
        expect(html).toContain(`method-${method.toLowerCase()}`);
      });
    }
  });
});
