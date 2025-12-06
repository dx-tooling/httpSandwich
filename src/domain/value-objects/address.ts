/**
 * Represents a network address (host:port combination).
 * Immutable value object for type-safe address handling.
 */
export class Address {
  public readonly host: string;
  public readonly port: number;

  private constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  /**
   * Parse an address string into an Address value object.
   *
   * Supported formats:
   * - "5009" → localhost:5009
   * - "localhost:5009" → localhost:5009
   * - "192.168.1.5:80" → 192.168.1.5:80
   *
   * @throws Error if the format is invalid or port is out of range
   */
  public static parse(input: string): Address {
    const trimmed = input.trim();

    if (trimmed === "") {
      throw new Error("Address cannot be empty");
    }

    // Check if it's just a port number
    if (/^\d+$/.test(trimmed)) {
      const port = Address.parsePort(trimmed);
      return new Address("localhost", port);
    }

    // Check for host:port format
    const lastColonIndex = trimmed.lastIndexOf(":");
    if (lastColonIndex === -1) {
      throw new Error(`Invalid address format: "${input}". Expected "port" or "host:port"`);
    }

    const host = trimmed.substring(0, lastColonIndex);
    const portStr = trimmed.substring(lastColonIndex + 1);

    if (host === "") {
      throw new Error(`Invalid address format: "${input}". Host cannot be empty`);
    }

    const port = Address.parsePort(portStr);
    return new Address(host, port);
  }

  private static parsePort(portStr: string): number {
    if (!/^\d+$/.test(portStr)) {
      throw new Error(`Invalid port: "${portStr}". Port must be a number`);
    }

    const port = parseInt(portStr, 10);

    // Port 0 is allowed - it tells the OS to assign a random available port
    if (port < 0 || port > 65535) {
      throw new Error(`Invalid port: ${String(port)}. Port must be between 0 and 65535`);
    }

    return port;
  }

  /**
   * Returns the address as a "host:port" string.
   */
  public toString(): string {
    return `${this.host}:${String(this.port)}`;
  }
}
