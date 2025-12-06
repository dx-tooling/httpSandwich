import { describe, it, expect, vi } from "vitest";
import { ProxyRequestHandler } from "@/application";
import { type OutputWriter } from "@/domain";

describe("ProxyRequestHandler", () => {
  function createMockOutputWriter(): OutputWriter & { writtenText: string[] } {
    const writtenText: string[] = [];
    return {
      write: (text: string) => {
        writtenText.push(text);
      },
      writtenText,
    };
  }

  describe("onRequestProxied", () => {
    it("should write a dot to the output writer", () => {
      const mockWriter = createMockOutputWriter();
      const handler = new ProxyRequestHandler(mockWriter);

      handler.onRequestProxied();

      expect(mockWriter.writtenText).toEqual(["."]);
    });

    it("should write a dot for each call", () => {
      const mockWriter = createMockOutputWriter();
      const handler = new ProxyRequestHandler(mockWriter);

      handler.onRequestProxied();
      handler.onRequestProxied();
      handler.onRequestProxied();

      expect(mockWriter.writtenText).toEqual([".", ".", "."]);
    });

    it("should call the output writer's write method", () => {
      const mockWriter: OutputWriter = {
        write: vi.fn(),
      };
      const handler = new ProxyRequestHandler(mockWriter);

      handler.onRequestProxied();

      expect(mockWriter.write).toHaveBeenCalledWith(".");
      expect(mockWriter.write).toHaveBeenCalledTimes(1);
    });
  });
});
