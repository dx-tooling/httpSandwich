/**
 * Malcolm - HTTP monitor-in-the-middle
 *
 * Entry point for the CLI application.
 */

import { parseArguments, getUsage } from "./argument-parser.js";
import { ExchangeHistory, ScreenRenderer, TuiLayout } from "@/application";
import {
  HttpProxyServer,
  AnsiTerminalUI,
  RawKeyboardInput,
  NormalizedKeys,
  FileExchangeStore,
} from "@/infrastructure";

async function main(): Promise<void> {
  const result = parseArguments(process.argv.slice(2));

  if (!result.ok) {
    console.error(`Error: ${result.error}\n`);
    console.error(getUsage());
    process.exit(1);
  }

  const { from, to, level, historySize } = result.config;

  // Initialize components
  const terminal = new AnsiTerminalUI();
  const keyboard = new RawKeyboardInput();
  const history = new ExchangeHistory(historySize);
  const store = new FileExchangeStore();
  const layout = new TuiLayout(terminal);

  // Create screen renderer with all config
  const renderer = new ScreenRenderer({
    terminal,
    history,
    layout,
    fromAddress: from,
    toAddress: to,
    storagePath: store.getStorageDir(),
    initialLevel: level,
  });

  // Create proxy server
  const server = new HttpProxyServer({
    from,
    to,
    onExchange: (exchange) => {
      // Store exchange to file (async, don't block)
      void store.save(exchange);

      // Add to history
      history.add(exchange);

      // Redraw screen
      renderer.onNewExchange(exchange);
    },
  });

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    keyboard.stop();
    terminal.showCursor();
    terminal.exitAlternateScreen();
    console.log("Malcolm stopped.");
    await server.stop();
    process.exit(0);
  };

  // Handle keyboard input
  keyboard.onKeyPress((key) => {
    switch (key) {
      case NormalizedKeys.INCREMENT:
        renderer.incrementLevel();
        break;
      case NormalizedKeys.DECREMENT:
        renderer.decrementLevel();
        break;
      case NormalizedKeys.QUIT:
        void shutdown();
        break;
    }
  });

  // Handle terminal resize
  terminal.onResize(() => {
    renderer.redraw();
  });

  // Handle signals for graceful shutdown
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  // Start server
  await server.start();

  // Start keyboard input
  keyboard.start();

  // Enter alternate screen, hide cursor, and draw initial screen
  terminal.enterAlternateScreen();
  terminal.hideCursor();
  renderer.initialize();
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
