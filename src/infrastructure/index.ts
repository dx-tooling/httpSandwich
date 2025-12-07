/**
 * Infrastructure layer - External concerns and implementations
 *
 * This layer contains:
 * - HTTP server/proxy implementation
 * - Output writer implementations
 * - Terminal UI implementations
 * - External service adapters
 *
 * The infrastructure layer implements interfaces defined in domain.
 */

export { ConsoleOutputWriter } from "./console-output-writer.js";
export { HttpProxyServer, type HttpProxyServerConfig } from "./http-proxy-server.js";
export { AnsiTerminalUI } from "./ansi-terminal-ui.js";
export { RawKeyboardInput, NormalizedKeys, type NormalizedKey } from "./raw-keyboard-input.js";
export { FileExchangeStore } from "./file-exchange-store.js";
export { AnsiColors, getColorForCategory, colorize } from "./color-scheme.js";
export { openBrowser } from "./browser-opener.js";
