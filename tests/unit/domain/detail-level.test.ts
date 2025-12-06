import { describe, it, expect } from "vitest";
import { DetailLevel } from "@/domain";

describe("DetailLevel", () => {
  describe("of", () => {
    it("should create level from valid number", () => {
      const level = DetailLevel.of(3);
      expect(level.value).toBe(3);
    });

    it("should clamp to MIN when below range", () => {
      const level = DetailLevel.of(0);
      expect(level.value).toBe(DetailLevel.MIN);
    });

    it("should clamp to MAX when above range", () => {
      const level = DetailLevel.of(10);
      expect(level.value).toBe(DetailLevel.MAX);
    });

    it("should floor decimal values", () => {
      const level = DetailLevel.of(3.7);
      expect(level.value).toBe(3);
    });
  });

  describe("default", () => {
    it("should return level 3", () => {
      const level = DetailLevel.default();
      expect(level.value).toBe(3);
    });
  });

  describe("increment", () => {
    it("should increase level by 1", () => {
      const level = DetailLevel.of(3);
      const incremented = level.increment();
      expect(incremented.value).toBe(4);
    });

    it("should not exceed MAX", () => {
      const level = DetailLevel.of(DetailLevel.MAX);
      const incremented = level.increment();
      expect(incremented.value).toBe(DetailLevel.MAX);
    });

    it("should return same instance at MAX", () => {
      const level = DetailLevel.of(DetailLevel.MAX);
      const incremented = level.increment();
      expect(incremented).toBe(level);
    });
  });

  describe("decrement", () => {
    it("should decrease level by 1", () => {
      const level = DetailLevel.of(3);
      const decremented = level.decrement();
      expect(decremented.value).toBe(2);
    });

    it("should not go below MIN", () => {
      const level = DetailLevel.of(DetailLevel.MIN);
      const decremented = level.decrement();
      expect(decremented.value).toBe(DetailLevel.MIN);
    });

    it("should return same instance at MIN", () => {
      const level = DetailLevel.of(DetailLevel.MIN);
      const decremented = level.decrement();
      expect(decremented).toBe(level);
    });
  });

  describe("isMultiLine", () => {
    it("should return false for levels 1-3", () => {
      expect(DetailLevel.of(1).isMultiLine()).toBe(false);
      expect(DetailLevel.of(2).isMultiLine()).toBe(false);
      expect(DetailLevel.of(3).isMultiLine()).toBe(false);
    });

    it("should return true for levels 4-6", () => {
      expect(DetailLevel.of(4).isMultiLine()).toBe(true);
      expect(DetailLevel.of(5).isMultiLine()).toBe(true);
      expect(DetailLevel.of(6).isMultiLine()).toBe(true);
    });
  });

  describe("showsHeaders", () => {
    it("should return false for levels 1-3", () => {
      expect(DetailLevel.of(1).showsHeaders()).toBe(false);
      expect(DetailLevel.of(2).showsHeaders()).toBe(false);
      expect(DetailLevel.of(3).showsHeaders()).toBe(false);
    });

    it("should return true for levels 4-6", () => {
      expect(DetailLevel.of(4).showsHeaders()).toBe(true);
      expect(DetailLevel.of(5).showsHeaders()).toBe(true);
      expect(DetailLevel.of(6).showsHeaders()).toBe(true);
    });
  });

  describe("showsBody", () => {
    it("should return false for levels 1-4", () => {
      expect(DetailLevel.of(1).showsBody()).toBe(false);
      expect(DetailLevel.of(2).showsBody()).toBe(false);
      expect(DetailLevel.of(3).showsBody()).toBe(false);
      expect(DetailLevel.of(4).showsBody()).toBe(false);
    });

    it("should return true for levels 5-6", () => {
      expect(DetailLevel.of(5).showsBody()).toBe(true);
      expect(DetailLevel.of(6).showsBody()).toBe(true);
    });
  });

  describe("equals", () => {
    it("should return true for same value", () => {
      const a = DetailLevel.of(3);
      const b = DetailLevel.of(3);
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different values", () => {
      const a = DetailLevel.of(3);
      const b = DetailLevel.of(4);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return formatted string", () => {
      const level = DetailLevel.of(3);
      expect(level.toString()).toBe("Level 3");
    });
  });
});
