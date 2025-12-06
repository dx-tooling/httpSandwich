import { HttpStatusCategory } from "@/domain";

/**
 * ANSI color codes for terminal output.
 */
export const AnsiColors = {
  /** Reset to default */
  reset: "\x1b[0m",

  /** Magenta/Violet for unreachable */
  unreachable: "\x1b[35m",

  /** Grey for informational (1xx) */
  informational: "\x1b[90m",

  /** Green for success (2xx) */
  success: "\x1b[32m",

  /** Blue for redirect (3xx) */
  redirect: "\x1b[34m",

  /** Yellow/Orange for client error (4xx) */
  clientError: "\x1b[33m",

  /** Red for server error (5xx) */
  serverError: "\x1b[31m",

  /** Dim text */
  dim: "\x1b[2m",

  /** Bold text */
  bold: "\x1b[1m",
} as const;

/**
 * Get the ANSI color code for a status category.
 */
export function getColorForCategory(category: HttpStatusCategory): string {
  switch (category) {
    case HttpStatusCategory.Unreachable:
      return AnsiColors.unreachable;
    case HttpStatusCategory.Informational:
      return AnsiColors.informational;
    case HttpStatusCategory.Success:
      return AnsiColors.success;
    case HttpStatusCategory.Redirect:
      return AnsiColors.redirect;
    case HttpStatusCategory.ClientError:
      return AnsiColors.clientError;
    case HttpStatusCategory.ServerError:
      return AnsiColors.serverError;
  }
}

/**
 * Wrap text with color and reset codes.
 */
export function colorize(text: string, category: HttpStatusCategory): string {
  const color = getColorForCategory(category);
  return `${color}${text}${AnsiColors.reset}`;
}
