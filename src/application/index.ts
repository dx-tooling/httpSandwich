/**
 * Application layer - Use cases and orchestration
 *
 * This layer contains:
 * - Use case implementations
 * - Application services
 * - Orchestration logic
 *
 * The application layer depends only on domain layer interfaces.
 */

export { ProxyRequestHandler } from "./use-cases/proxy-request.js";
export {
  formatExchange,
  calculateTotalLines,
  type FormattedExchange,
} from "./services/exchange-formatter.js";
export { ExchangeHistory, type ExchangeAddedHandler } from "./services/exchange-history.js";
export { ScreenRenderer, type ScreenRendererConfig } from "./services/screen-renderer.js";
export { TuiLayout, type LayoutRegions } from "./services/tui-layout.js";
