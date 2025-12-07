import { describe, it, expect } from "vitest";
import { parseArguments, getUsage } from "@/cli";

describe("parseArguments", () => {
  describe("valid arguments with --from/--to", () => {
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

  describe("sandwich-style syntax: between/and (natural language)", () => {
    it("should parse 'between X and Y' with ports only", () => {
      const result = parseArguments(["between", "8000", "and", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.host).toBe("localhost");
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.host).toBe("localhost");
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should parse 'between X and Y' with host:port", () => {
      const result = parseArguments(["between", "8000", "and", "api.example.com:443"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.host).toBe("api.example.com");
        expect(result.config.to.port).toBe(443);
      }
    });

    it("should parse 'between X and Y' in reverse order", () => {
      const result = parseArguments(["and", "5009", "between", "8000"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should parse with additional options", () => {
      const result = parseArguments(["between", "8000", "and", "5009", "--level", "5"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
        expect(result.config.level.value).toBe(5);
      }
    });
  });

  describe("sandwich-style syntax: --between/--and (dashed)", () => {
    it("should parse --between and --and with ports only", () => {
      const result = parseArguments(["--between", "8000", "--and", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should parse --between and --and with host:port", () => {
      const result = parseArguments(["--between", "8000", "--and", "localhost:5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.host).toBe("localhost");
        expect(result.config.to.port).toBe(5009);
      }
    });
  });

  describe("mixed syntax forms", () => {
    it("should allow 'between X --and Y'", () => {
      const result = parseArguments(["between", "8000", "--and", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should allow '--between X and Y'", () => {
      const result = parseArguments(["--between", "8000", "and", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should allow mixing --from with 'and'", () => {
      const result = parseArguments(["--from", "8000", "and", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });

    it("should allow mixing 'between' with --to", () => {
      const result = parseArguments(["between", "8000", "--to", "5009"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.from.port).toBe(8000);
        expect(result.config.to.port).toBe(5009);
      }
    });
  });

  describe("missing arguments", () => {
    it("should return error when from/between is missing", () => {
      const result = parseArguments(["--to", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("between");
      }
    });

    it("should return error when to/and is missing", () => {
      const result = parseArguments(["--from", "8000"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("and");
      }
    });

    it("should return error when both are missing", () => {
      const result = parseArguments([]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("between");
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

    it("should return error when 'between' has no value", () => {
      const result = parseArguments(["between", "and", "5009"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Missing value for between");
      }
    });

    it("should return error when 'and' has no value", () => {
      const result = parseArguments(["between", "8000", "and"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Missing value for and");
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
  it("should feature sandwich-style syntax prominently", () => {
    const usage = getUsage();
    expect(usage).toContain("between");
    expect(usage).toContain("and");
  });

  it("should include traditional --from/--to syntax", () => {
    const usage = getUsage();
    expect(usage).toContain("--from");
    expect(usage).toContain("--to");
  });

  it("should include sandwich-style examples first", () => {
    const usage = getUsage();
    const betweenIndex = usage.indexOf("between 8000 and");
    const fromIndex = usage.indexOf("--from 8000 --to");
    expect(betweenIndex).toBeLessThan(fromIndex);
  });

  it("should include examples", () => {
    const usage = getUsage();
    expect(usage).toContain("Examples:");
  });
});
