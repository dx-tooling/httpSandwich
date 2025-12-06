import { describe, it, expect } from "vitest";
import { Address } from "@/domain";

describe("Address", () => {
  describe("parse", () => {
    it("should parse port-only string as localhost", () => {
      const address = Address.parse("5009");

      expect(address.host).toBe("localhost");
      expect(address.port).toBe(5009);
    });

    it("should parse localhost:port format", () => {
      const address = Address.parse("localhost:5009");

      expect(address.host).toBe("localhost");
      expect(address.port).toBe(5009);
    });

    it("should parse IP:port format", () => {
      const address = Address.parse("192.168.1.5:80");

      expect(address.host).toBe("192.168.1.5");
      expect(address.port).toBe(80);
    });

    it("should parse hostname:port format", () => {
      const address = Address.parse("api.example.com:8080");

      expect(address.host).toBe("api.example.com");
      expect(address.port).toBe(8080);
    });

    it("should trim whitespace", () => {
      const address = Address.parse("  localhost:5009  ");

      expect(address.host).toBe("localhost");
      expect(address.port).toBe(5009);
    });

    it("should reject empty string", () => {
      expect(() => Address.parse("")).toThrow("Address cannot be empty");
    });

    it("should reject whitespace-only string", () => {
      expect(() => Address.parse("   ")).toThrow("Address cannot be empty");
    });

    it("should accept port 0 (random port)", () => {
      const address = Address.parse("0");
      expect(address.port).toBe(0);
    });

    it("should reject port above 65535", () => {
      expect(() => Address.parse("65536")).toThrow("Port must be between 0 and 65535");
    });

    it("should reject negative port", () => {
      expect(() => Address.parse("-1")).toThrow("Expected");
    });

    it("should reject non-numeric port", () => {
      expect(() => Address.parse("abc")).toThrow("Expected");
    });

    it("should reject non-numeric port in host:port format", () => {
      expect(() => Address.parse("localhost:abc")).toThrow("Port must be a number");
    });

    it("should reject empty host in host:port format", () => {
      expect(() => Address.parse(":5009")).toThrow("Host cannot be empty");
    });

    it("should handle port at boundary (0)", () => {
      const address = Address.parse("0");
      expect(address.port).toBe(0);
    });

    it("should handle port at boundary (65535)", () => {
      const address = Address.parse("65535");
      expect(address.port).toBe(65535);
    });

    it("should handle port 1", () => {
      const address = Address.parse("1");
      expect(address.port).toBe(1);
    });
  });

  describe("toString", () => {
    it("should return host:port format", () => {
      const address = Address.parse("localhost:8080");

      expect(address.toString()).toBe("localhost:8080");
    });

    it("should include localhost for port-only input", () => {
      const address = Address.parse("3000");

      expect(address.toString()).toBe("localhost:3000");
    });
  });
});
