import {
  type HttpExchange,
  type DetailLevel,
  categorizeStatus,
  type HttpStatusCategory,
} from "@/domain";
import { colorize, AnsiColors } from "@/infrastructure/color-scheme.js";

/** Maximum body length for truncated display (level 5) */
const BODY_TRUNCATE_LENGTH = 512;

/**
 * Formatted output for an exchange.
 */
export interface FormattedExchange {
  /** The formatted lines to display */
  readonly lines: string[];
  /** Number of lines in the output */
  readonly lineCount: number;
  /** The status category for color coding */
  readonly category: HttpStatusCategory;
}

/**
 * Format an HTTP exchange at a given detail level.
 */
export function formatExchange(exchange: HttpExchange, level: DetailLevel): FormattedExchange {
  const category = categorizeStatus(exchange.response?.statusCode ?? null);

  switch (level.value) {
    case 1:
      return formatLevel1(exchange, category);
    case 2:
      return formatLevel2(exchange, category);
    case 3:
      return formatLevel3(exchange, category);
    case 4:
      return formatLevel4(exchange, category);
    case 5:
      return formatLevel5(exchange, category);
    case 6:
      return formatLevel6(exchange, category);
    default:
      return formatLevel3(exchange, category);
  }
}

/**
 * Level 1: Single dot
 */
function formatLevel1(_exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  return {
    lines: [colorize(".", category)],
    lineCount: 1,
    category,
  };
}

/**
 * Level 2: [HH:MM:SS] STATUS
 */
function formatLevel2(exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  const time = formatTime(exchange.timestamp);
  const status = formatStatusCode(exchange.response?.statusCode ?? null);

  const line = colorize(`[${time}] ${status}`, category);

  return {
    lines: [line],
    lineCount: 1,
    category,
  };
}

/**
 * Level 3: [HH:MM:SS] STATUS METHOD /path
 */
function formatLevel3(exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  const time = formatTime(exchange.timestamp);
  const status = formatStatusCode(exchange.response?.statusCode ?? null);
  const method = exchange.request.method;
  const path = exchange.request.path;

  const line = colorize(`[${time}] ${status} ${method} ${path}`, category);

  return {
    lines: [line],
    lineCount: 1,
    category,
  };
}

/**
 * Level 4: Level 3 + headers
 */
function formatLevel4(exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  const lines: string[] = [];

  // Main line
  const time = formatTime(exchange.timestamp);
  const status = formatStatusCode(exchange.response?.statusCode ?? null);
  const method = exchange.request.method;
  const path = exchange.request.path;
  const duration = exchange.durationMs !== null ? ` (${String(exchange.durationMs)}ms)` : "";

  lines.push(colorize(`[${time}] ${status} ${method} ${path}${duration}`, category));

  // Request headers
  lines.push(colorize("  Request Headers:", category));
  for (const [key, value] of Object.entries(exchange.request.headers)) {
    lines.push(`${AnsiColors.dim}    ${key}: ${value}${AnsiColors.reset}`);
  }

  // Response headers (if available)
  if (exchange.response !== null) {
    lines.push(colorize("  Response Headers:", category));
    for (const [key, value] of Object.entries(exchange.response.headers)) {
      lines.push(`${AnsiColors.dim}    ${key}: ${value}${AnsiColors.reset}`);
    }
  }

  // Empty line separator
  lines.push("");

  return {
    lines,
    lineCount: lines.length,
    category,
  };
}

/**
 * Level 5: Level 4 + truncated body
 */
function formatLevel5(exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  const base = formatLevel4(exchange, category);
  const lines = [...base.lines];

  // Remove the trailing empty line from level 4
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  // Request body
  if (exchange.request.body !== null && exchange.request.body.length > 0) {
    lines.push(colorize("  Request Body:", category));
    const truncated = truncateBody(exchange.request.body, BODY_TRUNCATE_LENGTH);
    lines.push(`${AnsiColors.dim}    ${truncated}${AnsiColors.reset}`);
  }

  // Response body
  const responseBody5 = exchange.response?.body;
  if (responseBody5 !== null && responseBody5 !== undefined && responseBody5.length > 0) {
    lines.push(colorize("  Response Body:", category));
    const truncated = truncateBody(responseBody5, BODY_TRUNCATE_LENGTH);
    lines.push(`${AnsiColors.dim}    ${truncated}${AnsiColors.reset}`);
  }

  // Empty line separator
  lines.push("");

  return {
    lines,
    lineCount: lines.length,
    category,
  };
}

/**
 * Level 6: Level 4 + full body
 */
function formatLevel6(exchange: HttpExchange, category: HttpStatusCategory): FormattedExchange {
  const base = formatLevel4(exchange, category);
  const lines = [...base.lines];

  // Remove the trailing empty line from level 4
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }

  // Request body
  if (exchange.request.body !== null && exchange.request.body.length > 0) {
    lines.push(colorize("  Request Body:", category));
    const bodyLines = formatBody(exchange.request.body);
    for (const bodyLine of bodyLines) {
      lines.push(`${AnsiColors.dim}    ${bodyLine}${AnsiColors.reset}`);
    }
  }

  // Response body
  const responseBody6 = exchange.response?.body;
  if (responseBody6 !== null && responseBody6 !== undefined && responseBody6.length > 0) {
    lines.push(colorize("  Response Body:", category));
    const bodyLines = formatBody(responseBody6);
    for (const bodyLine of bodyLines) {
      lines.push(`${AnsiColors.dim}    ${bodyLine}${AnsiColors.reset}`);
    }
  }

  // Empty line separator
  lines.push("");

  return {
    lines,
    lineCount: lines.length,
    category,
  };
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format status code, handling null (unreachable)
 */
function formatStatusCode(statusCode: number | null): string {
  if (statusCode === null) {
    return "---";
  }
  return String(statusCode);
}

/**
 * Truncate body to max length, adding ellipsis if needed.
 */
function truncateBody(body: string, maxLength: number): string {
  // Remove newlines for single-line display
  const singleLine = body.replace(/\r?\n/g, " ").trim();

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return singleLine.substring(0, maxLength - 3) + "...";
}

/**
 * Format body for multi-line display.
 */
function formatBody(body: string): string[] {
  return body.split(/\r?\n/);
}

/**
 * Calculate total line count for a list of formatted exchanges.
 */
export function calculateTotalLines(formatted: FormattedExchange[]): number {
  return formatted.reduce((sum, f) => sum + f.lineCount, 0);
}
