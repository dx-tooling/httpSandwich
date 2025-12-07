import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exec } from "node:child_process";
import { platform } from "node:os";

// Mock child_process and os modules
vi.mock("node:child_process", () => ({
  exec: vi.fn(),
}));

vi.mock("node:os", () => ({
  platform: vi.fn(),
}));

// Import after mocking
import { openBrowser } from "@/infrastructure/browser-opener.js";

describe("openBrowser", () => {
  const mockExec = vi.mocked(exec);
  const mockPlatform = vi.mocked(platform);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("macOS", () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue("darwin");
    });

    it("should use 'open' command on macOS", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await openBrowser("file:///tmp/test.html");

      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("open"), expect.any(Function));
    });

    it("should properly escape the URL", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await openBrowser("file:///tmp/test file.html");

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("'file:///tmp/test file.html'"),
        expect.any(Function)
      );
    });
  });

  describe("Linux", () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue("linux");
    });

    it("should use 'xdg-open' command on Linux", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await openBrowser("file:///tmp/test.html");

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("xdg-open"),
        expect.any(Function)
      );
    });
  });

  describe("Windows", () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue("win32");
    });

    it("should use 'start' command on Windows", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await openBrowser("file:///C:/temp/test.html");

      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining("start"), expect.any(Function));
    });

    it("should use double quotes on Windows", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await openBrowser("file:///C:/temp/test.html");

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('"file:///C:/temp/test.html"'),
        expect.any(Function)
      );
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockPlatform.mockReturnValue("darwin");
    });

    it("should reject promise on exec error", async () => {
      const testError = new Error("Command failed");
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(testError, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await expect(openBrowser("file:///tmp/test.html")).rejects.toThrow("Failed to open browser");
    });

    it("should resolve promise on success", async () => {
      mockExec.mockImplementation((_cmd, callback) => {
        if (typeof callback === "function") {
          callback(null, "", "");
        }
        return {} as ReturnType<typeof exec>;
      });

      await expect(openBrowser("file:///tmp/test.html")).resolves.toBeUndefined();
    });
  });
});
