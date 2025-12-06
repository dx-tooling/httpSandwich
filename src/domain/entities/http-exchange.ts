/**
 * Represents an HTTP request with its headers and body.
 */
export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | null;
}

/**
 * Represents an HTTP response with its status, headers, and body.
 */
export interface HttpResponse {
  readonly statusCode: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | null;
}

/**
 * Represents a complete HTTP exchange (request + response).
 * Immutable record of a proxied request for storage and display.
 */
export interface HttpExchange {
  /** Unique identifier for file storage */
  readonly id: string;

  /** When the request was received */
  readonly timestamp: Date;

  /** The incoming request */
  readonly request: HttpRequest;

  /** The response from the target, or null if unreachable */
  readonly response: HttpResponse | null;

  /** Time taken to get response in milliseconds, or null if unreachable */
  readonly durationMs: number | null;
}

/**
 * Create a new HttpExchange with a unique ID.
 */
export function createHttpExchange(params: {
  request: HttpRequest;
  response: HttpResponse | null;
  durationMs: number | null;
}): HttpExchange {
  return {
    id: generateExchangeId(),
    timestamp: new Date(),
    request: params.request,
    response: params.response,
    durationMs: params.durationMs,
  };
}

/**
 * Generate a unique exchange ID using timestamp and random suffix.
 */
function generateExchangeId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}
