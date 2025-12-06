import { describe, it, expect, beforeEach } from "vitest";
import { TuiLayout } from "@/application";
import { Address, DetailLevel } from "@/domain";
import { MockTerminalUI } from "../../helpers/mock-terminal-ui.js";

describe("TuiLayout", () => {
  let terminal: MockTerminalUI;
  let layout: TuiLayout;

  beforeEach(() => {
    terminal = new MockTerminalUI();
    layout = new TuiLayout(terminal);
  });

  describe("calculateRegions", () => {
    it("should calculate correct regions for standard terminal", () => {
      terminal.setSize(24, 80);
      const regions = layout.getRegions();

      expect(regions.headerRow).toBe(1);
      expect(regions.footerRow).toBe(24);
      expect(regions.viewportStartRow).toBe(2);
      expect(regions.viewportEndRow).toBe(23);
      expect(regions.viewportHeight).toBe(22);
      expect(regions.width).toBe(80);
    });

    it("should calculate correct regions for small terminal", () => {
      terminal.setSize(10, 40);
      const regions = layout.getRegions();

      expect(regions.headerRow).toBe(1);
      expect(regions.footerRow).toBe(10);
      expect(regions.viewportStartRow).toBe(2);
      expect(regions.viewportEndRow).toBe(9);
      expect(regions.viewportHeight).toBe(8);
      expect(regions.width).toBe(40);
    });

    it("should handle minimum terminal size", () => {
      terminal.setSize(3, 20);
      const regions = layout.getRegions();

      expect(regions.viewportHeight).toBe(1);
    });
  });

  describe("renderHeader", () => {
    it("should render header at row 1", () => {
      terminal.setSize(24, 80);
      const from = Address.parse("8000");
      const to = Address.parse("localhost:5009");
      const level = DetailLevel.of(3);

      layout.renderHeader(from, to, level);

      expect(terminal.operations).toContain("moveCursor(1,1)");
      expect(terminal.operations).toContain("clearLine@1");
    });

    it("should include proxy addresses and level in header", () => {
      terminal.setSize(24, 80);
      const from = Address.parse("8080");
      const to = Address.parse("api.example.com:443");
      const level = DetailLevel.of(5);

      layout.renderHeader(from, to, level);

      // Should have written something containing the addresses
      const headerContent = terminal.writtenText.join("");
      expect(headerContent).toContain("Malcolm");
      expect(headerContent).toContain("8080");
      expect(headerContent).toContain("api.example.com:443");
      expect(headerContent).toContain("Level 5");
    });
  });

  describe("renderFooter", () => {
    it("should render footer at last row", () => {
      terminal.setSize(24, 80);

      layout.renderFooter(42, 100, "/tmp/malcolm-exchanges");

      expect(terminal.operations).toContain("moveCursor(24,1)");
      expect(terminal.operations).toContain("clearLine@24");
    });

    it("should include exchange count and storage path", () => {
      terminal.setSize(24, 80);

      layout.renderFooter(42, 100, "/tmp/test");

      const footerContent = terminal.writtenText.join("");
      expect(footerContent).toContain("42/100");
      expect(footerContent).toContain("/tmp/test");
    });

    it("should truncate long storage paths", () => {
      terminal.setSize(24, 40);

      const longPath = "/very/long/path/to/malcolm/exchanges/storage";
      layout.renderFooter(1, 100, longPath);

      const footerContent = terminal.writtenText.join("");
      expect(footerContent.length).toBeLessThanOrEqual(80); // Reasonable limit
    });
  });

  describe("clearViewport", () => {
    it("should clear all viewport rows", () => {
      terminal.setSize(24, 80);

      layout.clearViewport();

      // Should clear rows 2-23 (viewport area)
      expect(terminal.operations).toContain("moveCursor(2,1)");
      expect(terminal.operations).toContain("clearLine@2");
      expect(terminal.operations).toContain("moveCursor(23,1)");
      expect(terminal.operations).toContain("clearLine@23");
    });
  });

  describe("writeViewportLine", () => {
    it("should write line at correct viewport row", () => {
      terminal.setSize(24, 80);

      const result = layout.writeViewportLine(0, "Hello");

      expect(result).toBe(true);
      expect(terminal.operations).toContain("moveCursor(2,1)"); // viewport starts at row 2
    });

    it("should return false for lines outside viewport", () => {
      terminal.setSize(10, 80);
      const regions = layout.getRegions();

      // Try to write beyond viewport height
      const result = layout.writeViewportLine(regions.viewportHeight + 1, "Test");

      expect(result).toBe(false);
    });

    it("should truncate long lines", () => {
      terminal.setSize(24, 20); // Narrow terminal

      const longLine = "A".repeat(50);
      layout.writeViewportLine(0, longLine);

      // Written text should be truncated
      const written = terminal.writtenText.find((t) => t.includes("A"));
      expect(written).toBeDefined();
      // Should be truncated to fit width
      if (written !== undefined) {
        expect(written.length).toBeLessThanOrEqual(20);
      }
    });
  });
});
