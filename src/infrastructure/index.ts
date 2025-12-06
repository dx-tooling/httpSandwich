/**
 * Infrastructure layer - External concerns and implementations
 *
 * This layer contains:
 * - HTTP server/proxy implementation
 * - Output writer implementations
 * - External service adapters
 *
 * The infrastructure layer implements interfaces defined in domain.
 */

export { ConsoleOutputWriter } from "./console-output-writer.js";
export { HttpProxyServer, type HttpProxyServerConfig } from "./http-proxy-server.js";
