import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { Address, type OutputWriter } from "@/domain";
import { ProxyRequestHandler } from "@/application";
import { HttpProxyServer } from "@/infrastructure";

describe("Proxy Integration", () => {
  let targetServer: Server;
  let targetPort: number;
  let receivedRequests: { method: string; url: string; headers: Record<string, unknown> }[];

  // Collect output written by the proxy
  let outputWritten: string[];
  const testOutputWriter: OutputWriter = {
    write: (text: string) => {
      outputWritten.push(text);
    },
  };

  beforeAll(async () => {
    receivedRequests = [];

    // Start a mock target server
    targetServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      receivedRequests.push({
        method: req.method ?? "GET",
        url: req.url ?? "/",
        headers: req.headers as Record<string, unknown>,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Hello from target" }));
    });

    await new Promise<void>((resolve) => {
      targetServer.listen(0, "127.0.0.1", () => {
        const addr = targetServer.address();
        if (addr !== null && typeof addr !== "string") {
          targetPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      targetServer.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  beforeEach(() => {
    receivedRequests = [];
    outputWritten = [];
  });

  function getProxyPort(proxy: HttpProxyServer): number {
    const address = proxy.getListeningAddress();
    if (address === null) {
      throw new Error("Proxy server not listening");
    }
    return address.port;
  }

  it("should forward GET request to target server", async () => {
    const requestHandler = new ProxyRequestHandler(testOutputWriter);
    const proxy = new HttpProxyServer({
      from: Address.parse("0"), // Port 0 = random available port
      to: Address.parse(`127.0.0.1:${String(targetPort)}`),
      requestHandler,
    });

    await proxy.start();

    try {
      const proxyPort = getProxyPort(proxy);

      const response = await fetch(`http://localhost:${String(proxyPort)}/api/test`);
      const data = (await response.json()) as { message: string };

      // Verify response from target was returned
      expect(response.status).toBe(200);
      expect(data.message).toBe("Hello from target");

      // Verify request reached target
      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0]?.method).toBe("GET");
      expect(receivedRequests[0]?.url).toBe("/api/test");

      // Verify dot was written
      expect(outputWritten).toEqual(["."]);
    } finally {
      await proxy.stop();
    }
  });

  it("should forward POST request with body to target server", async () => {
    const requestHandler = new ProxyRequestHandler(testOutputWriter);
    const proxy = new HttpProxyServer({
      from: Address.parse("0"),
      to: Address.parse(`127.0.0.1:${String(targetPort)}`),
      requestHandler,
    });

    await proxy.start();

    try {
      const proxyPort = getProxyPort(proxy);

      const response = await fetch(`http://localhost:${String(proxyPort)}/api/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });

      expect(response.status).toBe(200);
      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0]?.method).toBe("POST");
      expect(receivedRequests[0]?.url).toBe("/api/data");
    } finally {
      await proxy.stop();
    }
  });

  it("should preserve request headers", async () => {
    const requestHandler = new ProxyRequestHandler(testOutputWriter);
    const proxy = new HttpProxyServer({
      from: Address.parse("0"),
      to: Address.parse(`127.0.0.1:${String(targetPort)}`),
      requestHandler,
    });

    await proxy.start();

    try {
      const proxyPort = getProxyPort(proxy);

      await fetch(`http://localhost:${String(proxyPort)}/api/test`, {
        headers: {
          "X-Custom-Header": "custom-value",
          Accept: "application/json",
        },
      });

      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0]?.headers["x-custom-header"]).toBe("custom-value");
      expect(receivedRequests[0]?.headers["accept"]).toBe("application/json");
    } finally {
      await proxy.stop();
    }
  });

  it("should return 502 when target is unreachable", async () => {
    const requestHandler = new ProxyRequestHandler(testOutputWriter);
    const proxy = new HttpProxyServer({
      from: Address.parse("0"),
      to: Address.parse("127.0.0.1:59999"), // Non-existent server
      requestHandler,
    });

    await proxy.start();

    try {
      const proxyPort = getProxyPort(proxy);

      const response = await fetch(`http://localhost:${String(proxyPort)}/api/test`);

      expect(response.status).toBe(502);
      // No dot should be written on failure
      expect(outputWritten).toEqual([]);
    } finally {
      await proxy.stop();
    }
  });

  it("should write a dot for each successful request", async () => {
    const requestHandler = new ProxyRequestHandler(testOutputWriter);
    const proxy = new HttpProxyServer({
      from: Address.parse("0"),
      to: Address.parse(`127.0.0.1:${String(targetPort)}`),
      requestHandler,
    });

    await proxy.start();

    try {
      const proxyPort = getProxyPort(proxy);
      const url = `http://localhost:${String(proxyPort)}/api/test`;

      await fetch(url);
      await fetch(url);
      await fetch(url);

      expect(outputWritten).toEqual([".", ".", "."]);
    } finally {
      await proxy.stop();
    }
  });
});
