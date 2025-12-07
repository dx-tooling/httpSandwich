import { exec } from "node:child_process";
import { platform } from "node:os";

/**
 * Open a URL in the system's default web browser.
 * Works cross-platform: macOS, Linux, and Windows.
 *
 * @param url - The URL to open (can be a file:// URL)
 * @returns Promise that resolves when the browser command is executed
 */
export function openBrowser(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = getBrowserCommand(url);

    exec(command, (error) => {
      if (error) {
        reject(new Error(`Failed to open browser: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get the platform-specific command to open a URL in the default browser.
 */
function getBrowserCommand(url: string): string {
  const escapedUrl = escapeShellArg(url);
  const os = platform();

  switch (os) {
    case "darwin":
      // macOS
      return `open ${escapedUrl}`;

    case "win32":
      // Windows - use start command with empty title
      return `start "" ${escapedUrl}`;

    case "linux":
    case "freebsd":
    case "openbsd":
    case "sunos":
      // Linux and Unix-like systems
      return `xdg-open ${escapedUrl}`;

    default:
      // Fallback to xdg-open for unknown platforms
      return `xdg-open ${escapedUrl}`;
  }
}

/**
 * Escape a string for safe use in shell commands.
 */
function escapeShellArg(arg: string): string {
  // On Windows, use double quotes
  if (platform() === "win32") {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }

  // On Unix-like systems, use single quotes (safest)
  // Single quotes preserve everything literally except single quotes themselves
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
