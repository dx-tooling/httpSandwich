import { createServer, request, type IncomingMessage, type ServerResponse } from "node:http";
import { type Server } from "node:http";
import { Address, createHttpExchange, type HttpExchange } from "@/domain";

/**
 * Handler called when a request is proxied.
 */
export type ExchangeHandler = (exchange: HttpExchange) => void;

/**
 * Configuration for the HTTP proxy server.
 */
export interface HttpProxyServerConfig {
  readonly from: Address;
  readonly to: Address;
  readonly onExchange: ExchangeHandler;
}

/**
 * HTTP proxy server that forwards requests to a target server.
 */
export class HttpProxyServer {
  private server: Server | null = null;
  private readonly config: HttpProxyServerConfig;

  public constructor(config: HttpProxyServerConfig) {
    this.config = config;
  }

  /**
   * Start the proxy server.
   * @returns Promise that resolves when the server is listening
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        void this.handleRequest(req, res);
      });

      this.server.on("error", reject);

      this.server.listen(this.config.from.port, this.config.from.host, () => {
        resolve();
      });
    });
  }

  /**
   * Stop the proxy server.
   * @returns Promise that resolves when the server has stopped
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server === null) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.server = null;
          resolve();
        }
      });
    });
  }

  /**
   * Get the actual address the server is listening on.
   * Useful when binding to port 0 for tests.
   */
  public getListeningAddress(): Address | null {
    if (this.server === null) {
      return null;
    }

    const addr = this.server.address();
    if (addr === null || typeof addr === "string") {
      return null;
    }

    const host = addr.address === "::" ? "localhost" : addr.address;
    return Address.parse(`${host}:${String(addr.port)}`);
  }

  private async handleRequest(
    clientReq: IncomingMessage,
    clientRes: ServerResponse
  ): Promise<void> {
    const startTime = Date.now();

    // Collect request body
    const requestBody = await this.collectBody(clientReq);

    // Build request headers as plain object
    const requestHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(clientReq.headers)) {
      if (typeof value === "string") {
        requestHeaders[key] = value;
      } else if (Array.isArray(value)) {
        requestHeaders[key] = value.join(", ");
      }
    }

    const options = {
      hostname: this.config.to.host,
      port: this.config.to.port,
      path: clientReq.url ?? "/",
      method: clientReq.method ?? "GET",
      headers: clientReq.headers,
    };

    const proxyReq = request(options, (proxyRes) => {
      void this.handleResponse(
        proxyRes,
        clientRes,
        {
          method: options.method,
          path: options.path,
          headers: requestHeaders,
          body: requestBody,
        },
        startTime
      );
    });

    // Handle errors connecting to target
    proxyReq.on("error", () => {
      const durationMs = Date.now() - startTime;

      // Create exchange with no response (unreachable)
      const exchange = createHttpExchange({
        request: {
          method: options.method,
          path: options.path,
          headers: requestHeaders,
          body: requestBody,
        },
        response: null,
        durationMs,
      });

      this.config.onExchange(exchange);

      clientRes.writeHead(502);
      clientRes.end();
    });

    // Send request body to target
    if (requestBody !== null) {
      proxyReq.write(requestBody);
    }
    proxyReq.end();
  }

  private async handleResponse(
    proxyRes: IncomingMessage,
    clientRes: ServerResponse,
    requestData: {
      method: string;
      path: string;
      headers: Record<string, string>;
      body: string | null;
    },
    startTime: number
  ): Promise<void> {
    // Collect response body
    const responseBody = await this.collectBody(proxyRes);
    const durationMs = Date.now() - startTime;

    // Build response headers as plain object
    const responseHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (typeof value === "string") {
        responseHeaders[key] = value;
      } else if (Array.isArray(value)) {
        responseHeaders[key] = value.join(", ");
      }
    }

    // Create exchange
    const exchange = createHttpExchange({
      request: requestData,
      response: {
        statusCode: proxyRes.statusCode ?? 500,
        headers: responseHeaders,
        body: responseBody,
      },
      durationMs,
    });

    this.config.onExchange(exchange);

    // Copy status code and headers from target response
    clientRes.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);

    // Send response body
    if (responseBody !== null) {
      clientRes.write(responseBody);
    }
    clientRes.end();
  }

  private collectBody(stream: IncomingMessage): Promise<string | null> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        if (chunks.length === 0) {
          resolve(null);
        } else {
          resolve(Buffer.concat(chunks).toString("utf-8"));
        }
      });

      stream.on("error", () => {
        resolve(null);
      });
    });
  }
}
