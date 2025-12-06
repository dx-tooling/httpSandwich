/**
 * Malcolm - HTTP monitor-in-the-middle
 *
 * Entry point for the CLI application.
 */

import { parseArguments, getUsage } from "./argument-parser.js";
import { ExchangeHistory, ScreenRenderer } from "@/application";
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
  const renderer = new ScreenRenderer(terminal, history, level);

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

  // Graceful shutdown
  const shutdown = async (): Promise<void> => {
    keyboard.stop();
    terminal.showCursor();
    terminal.clearScreen();
    console.log("Malcolm stopped.");
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  // Start server
  await server.start();

  // Start keyboard input
  keyboard.start();

  // Hide cursor and draw initial screen
  terminal.hideCursor();
  renderer.redraw();

  // Show storage location
  const storageDir = store.getStorageDir();
  terminal.moveCursor(terminal.getSize().rows, 1);
  terminal.write(`\x1b[2mExchanges stored in: ${storageDir}\x1b[0m`);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
