import { describe, it, expect } from "vitest";

describe("Example test suite", () => {
  it("should verify the test setup works", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const message = "Malcolm";
    expect(message).toContain("Mal");
    expect(message).toHaveLength(7);
  });

  it("should work with async operations", async () => {
    const result = await Promise.resolve("success");
    expect(result).toBe("success");
  });
});
