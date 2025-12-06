import { createServer, request, type IncomingMessage, type ServerResponse } from "node:http";
import { type Server } from "node:http";
import { Address } from "@/domain";
import { type ProxyRequestHandler } from "@/application";

/**
 * Configuration for the HTTP proxy server.
 */
export interface HttpProxyServerConfig {
  readonly from: Address;
  readonly to: Address;
  readonly requestHandler: ProxyRequestHandler;
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
        this.handleRequest(req, res);
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

  private handleRequest(clientReq: IncomingMessage, clientRes: ServerResponse): void {
    const options = {
      hostname: this.config.to.host,
      port: this.config.to.port,
      path: clientReq.url,
      method: clientReq.method,
      headers: clientReq.headers,
    };

    const proxyReq = request(options, (proxyRes) => {
      // Copy status code and headers from target response
      clientRes.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);

      // Pipe the response body
      proxyRes.pipe(clientRes);

      // Notify handler of successful proxy
      this.config.requestHandler.onRequestProxied();
    });

    // Handle errors connecting to target (silent - just return 502)
    proxyReq.on("error", () => {
      clientRes.writeHead(502);
      clientRes.end();
    });

    // Pipe the request body to the target
    clientReq.pipe(proxyReq);
  }
}
