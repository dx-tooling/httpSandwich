import { type OutputWriter } from "@/domain";

/**
 * Handles the proxying of a single HTTP request.
 * This is the core use case that orchestrates the proxy behavior.
 */
export class ProxyRequestHandler {
  public constructor(private readonly outputWriter: OutputWriter) {}

  /**
   * Called when a request has been successfully proxied.
   * Writes a dot to the output to indicate activity.
   */
  public onRequestProxied(): void {
    this.outputWriter.write(".");
  }
}
