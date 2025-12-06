import { Address } from "@/domain";

/**
 * Configuration parsed from CLI arguments.
 */
export interface CliConfig {
  readonly from: Address;
  readonly to: Address;
}

/**
 * Result of parsing CLI arguments.
 */
export type ParseResult =
  | { readonly ok: true; readonly config: CliConfig }
  | { readonly ok: false; readonly error: string };

/**
 * Parse CLI arguments into a typed configuration.
 *
 * Expected format:
 *   malcolm --from <port> --to <host:port>
 *
 * @param args - Array of CLI arguments (typically process.argv.slice(2))
 */
export function parseArguments(args: readonly string[]): ParseResult {
  let fromValue: string | undefined;
  let toValue: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--from") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --from" };
      }
      fromValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--to") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --to" };
      }
      toValue = nextArg;
      i++; // Skip next arg since we consumed it
    }
  }

  if (fromValue === undefined) {
    return { ok: false, error: "Missing required argument: --from <port>" };
  }

  if (toValue === undefined) {
    return { ok: false, error: "Missing required argument: --to <host:port>" };
  }

  try {
    const from = Address.parse(fromValue);
    const to = Address.parse(toValue);
    return { ok: true, config: { from, to } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Get usage help text.
 */
export function getUsage(): string {
  return `Usage: malcolm --from <port> --to <host:port>

Options:
  --from <port>       Local port to listen on
  --to <host:port>    Target address to proxy requests to

Examples:
  malcolm --from 8000 --to 5009
  malcolm --from 8000 --to localhost:5009
  malcolm --from 8000 --to 192.168.1.5:80`;
}
