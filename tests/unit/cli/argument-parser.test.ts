import { describe, it, expect } from "vitest";
import { parseArguments, getUsage } from "@/cli";

describe("parseArguments", () => {
  describe("valid arguments", () => {
    it("should parse --from and --to with port only", () => {
      const result = parseArguments(["--from", "8000", "--to", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.host).toBe("localhost");
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.host).toBe("localhost");
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should parse --from and --to with host:port", () => {
      const result = parseArguments(["--from", "8000", "--to", "localhost:5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.host).toBe("localhost");
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should parse --to with IP address", () => {
      const result = parseArguments(["--from", "8000", "--to", "192.168.1.5:80"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.to.host).toBe("192.168.1.5");
        expect(result.config.to.port).toBe(80);
      }
    });

    it("should parse arguments in reverse order", () => {
      const result = parseArguments(["--to", "5009", "--from", "8000"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should ignore unknown arguments", () => {
      const result = parseArguments(["--from", "8000", "--unknown", "value", "--to", "5009"]);

      expect(result.ok).toBe(true);
    });
  });

  describe("missing arguments", () => {
    it("should return error when --from is missing", () => {
      const result = parseArguments(["--to", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--from");
      }
    });

    it("should return error when --to is missing", () => {
      const result = parseArguments(["--from", "8000"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--to");
      }
    });

    it("should return error when both are missing", () => {
      const result = parseArguments([]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--from");
      }
    });

    it("should return error when --from has no value", () => {
      const result = parseArguments(["--from", "--to", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Missing value for --from");
      }
    });

    it("should return error when --to has no value", () => {
      const result = parseArguments(["--from", "8000", "--to"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Missing value for --to");
      }
    });
  });

  describe("invalid values", () => {
    it("should return error for invalid --from port", () => {
      const result = parseArguments(["--from", "invalid", "--to", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("port");
      }
    });

    it("should return error for invalid --to port", () => {
      const result = parseArguments(["--from", "8000", "--to", "localhost:invalid"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Port must be a number");
      }
    });

    it("should return error for out-of-range port", () => {
      const result = parseArguments(["--from", "99999", "--to", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("between 0 and 65535");
      }
    });
  });
});

describe("getUsage", () => {
  it("should return usage text containing --from", () => {
    const usage = getUsage();
    expect(usage).toContain("--from");
  });

  it("should return usage text containing --to", () => {
    const usage = getUsage();
    expect(usage).toContain("--to");
  });

  it("should include examples", () => {
    const usage = getUsage();
    expect(usage).toContain("Examples:");
  });
});
