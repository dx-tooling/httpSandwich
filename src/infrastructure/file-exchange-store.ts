import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type ExchangeStore } from "@/domain/ports/exchange-store.js";
import { type HttpExchange } from "@/domain";

/**
 * Exchange store implementation that writes to JSON files.
 * Files are stored in the system temp directory under httpSandwich/{sessionId}/.
 */
export class FileExchangeStore implements ExchangeStore {
  private readonly storageDir: string;
  private initialized = false;

  public constructor(sessionId?: string) {
    const session = sessionId ?? generateSessionId();
    this.storageDir = join(tmpdir(), "httpSandwich", session);
  }

  /**
   * Save an exchange to a JSON file.
   * Creates the storage directory if it doesn't exist.
   */
  public async save(exchange: HttpExchange): Promise<void> {
    if (!this.initialized) {
      await this.ensureStorageDir();
      this.initialized = true;
    }

    const filePath = join(this.storageDir, `${exchange.id}.json`);
    const content = JSON.stringify(serializeExchange(exchange), null, 2);

    // Write asynchronously, don't block the caller
    await writeFile(filePath, content, "utf-8");
  }

  /**
   * Get the storage directory path.
   */
  public getStorageDir(): string {
    return this.storageDir;
  }

  /**
   * Ensure the storage directory exists.
   */
  private async ensureStorageDir(): Promise<void> {
    await mkdir(this.storageDir, { recursive: true });
  }
}

/**
 * Generate a session ID based on timestamp.
 */
function generateSessionId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${String(year)}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Serialize an exchange for JSON storage.
 */
function serializeExchange(exchange: HttpExchange): Record<string, unknown> {
  return {
    id: exchange.id,
    timestamp: exchange.timestamp.toISOString(),
    durationMs: exchange.durationMs,
    request: {
      method: exchange.request.method,
      path: exchange.request.path,
      headers: exchange.request.headers,
      body: exchange.request.body,
    },
    response:
      exchange.response !== null
        ? {
            statusCode: exchange.response.statusCode,
            headers: exchange.response.headers,
            body: exchange.response.body,
          }
        : null,
  };
}
