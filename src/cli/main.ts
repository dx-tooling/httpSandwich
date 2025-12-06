/**
 * Malcolm - HTTP monitor-in-the-middle
 *
 * Entry point for the CLI application.
 */

import { parseArguments, getUsage } from "./argument-parser.js";
import { ProxyRequestHandler } from "@/application";
import { ConsoleOutputWriter, HttpProxyServer } from "@/infrastructure";

async function main(): Promise<void> {
  const result = parseArguments(process.argv.slice(2));

  if (!result.ok) {
    console.error(`Error: ${result.error}\n`);
    console.error(getUsage());
    process.exit(1);
  }

  const { from, to } = result.config;

  const outputWriter = new ConsoleOutputWriter();
  const requestHandler = new ProxyRequestHandler(outputWriter);

  const server = new HttpProxyServer({
    from,
    to,
    requestHandler,
  });

  // Handle graceful shutdown
  const shutdown = async (): Promise<void> => {
    console.log("\nShutting down...");
    await server.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  await server.start();
  console.log(`Malcolm proxy listening on ${from.toString()}`);
  console.log(`Forwarding requests to ${to.toString()}`);
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
