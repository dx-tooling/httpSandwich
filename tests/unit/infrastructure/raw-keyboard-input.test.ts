import { describe, it, expect } from "vitest";
import { NormalizedKeys } from "@/infrastructure";

describe("NormalizedKeys", () => {
  it("should have INCREMENT key", () => {
    expect(NormalizedKeys.INCREMENT).toBe("increment");
  });

  it("should have DECREMENT key", () => {
    expect(NormalizedKeys.DECREMENT).toBe("decrement");
  });

  it("should have QUIT key", () => {
    expect(NormalizedKeys.QUIT).toBe("quit");
  });

  it("should have SCROLL_UP key", () => {
    expect(NormalizedKeys.SCROLL_UP).toBe("scroll_up");
  });

  it("should have SCROLL_DOWN key", () => {
    expect(NormalizedKeys.SCROLL_DOWN).toBe("scroll_down");
  });

  it("should have ESCAPE key", () => {
    expect(NormalizedKeys.ESCAPE).toBe("escape");
  });

  it("should have INSPECT key", () => {
    expect(NormalizedKeys.INSPECT).toBe("inspect");
  });
});
