import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleOutputWriter } from "@/infrastructure";

describe("ConsoleOutputWriter", () => {
  let originalStdoutWrite: typeof process.stdout.write;
  let writtenChunks: string[];
  let mockWrite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writtenChunks = [];
    originalStdoutWrite = process.stdout.write.bind(process.stdout);

    // Mock process.stdout.write
    mockWrite = vi.fn((chunk: string | Uint8Array) => {
      if (typeof chunk === "string") {
        writtenChunks.push(chunk);
      }
      return true;
    });
    process.stdout.write = mockWrite as typeof process.stdout.write;
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
  });

  describe("write", () => {
    it("should write to stdout", () => {
      const writer = new ConsoleOutputWriter();

      writer.write("hello");

      expect(writtenChunks).toEqual(["hello"]);
    });

    it("should write without appending newline", () => {
      const writer = new ConsoleOutputWriter();

      writer.write(".");

      expect(writtenChunks).toEqual(["."]);
      expect(writtenChunks[0]).not.toContain("\n");
    });

    it("should write multiple times", () => {
      const writer = new ConsoleOutputWriter();

      writer.write(".");
      writer.write(".");
      writer.write(".");

      expect(writtenChunks).toEqual([".", ".", "."]);
    });

    it("should call process.stdout.write", () => {
      const writer = new ConsoleOutputWriter();

      writer.write("test");

      expect(mockWrite).toHaveBeenCalledWith("test");
    });
  });
});
