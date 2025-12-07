# 🥪 httpSandwich

**A transparent HTTP proxy for monitoring traffic between client and server.**

[![CI](https://github.com/dx-tooling/httpSandwich/actions/workflows/ci.yml/badge.svg)](https://github.com/dx-tooling/httpSandwich/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)](https://nodejs.org/)

<p align="center">
  <img src="https://github.com/manuelkiessling/gh-assets/blob/main/httpSandwich-terminal-and-browserinspect.png?raw=true" alt="httpSandwich in action - Terminal TUI and Browser Inspect view" width="100%">
</p>

---

## What is httpSandwich?

httpSandwich is a lightweight HTTP monitor-in-the-middle tool that sits between your client and server, capturing and displaying all HTTP traffic in real-time. Perfect for debugging API integrations, understanding service communication, or troubleshooting network issues.

Unlike heavyweight solutions, httpSandwich is:

- **Zero-config** — Just specify source and target ports
- **Terminal-native** — Beautiful TUI with adjustable detail levels
- **Non-intrusive** — Transparent proxying, no code changes required
- **Inspectable** — Open any request in your browser for detailed analysis

## Features

- 🔄 **Transparent Proxying** — Forward requests without modification
- 📊 **6 Detail Levels** — From minimal dots to full headers and bodies
- ⌨️ **Interactive TUI** — Navigate, select, and inspect requests in real-time
- 🌐 **Browser Inspect** — View any request as a beautifully formatted HTML page
- 💾 **Auto-persistence** — All exchanges saved as JSON for later analysis
- 🎨 **Status Coloring** — Instant visual feedback (green=success, red=error, etc.)
- 📱 **Responsive** — Adapts to terminal size with smart truncation

## Quick Start

### Prerequisites

- Node.js 24 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/dx-tooling/httpSandwich.git
cd httpSandwich

# Install dependencies
npm install

# Build the project
npm run build
```

### Basic Usage

Position httpSandwich between your client and server:

```bash
# Natural language syntax (recommended)
npm start -- between 8000 and localhost:3000

# Traditional flag syntax
npm start -- --from 8000 --to localhost:3000
```

Now point your client to `localhost:8000` instead of `localhost:3000`. All traffic flows through httpSandwich and is displayed in real-time.

## Usage Examples

```bash
# Monitor traffic to a local API server
npm start -- between 8080 and localhost:3000

# Proxy to a remote service
npm start -- between 9000 and api.example.com:443

# Start with minimal output (dots only)
npm start -- between 8000 and 5009 --level 1

# Keep more history in memory
npm start -- between 8000 and 5009 --history 500
```

## Interactive Controls

While httpSandwich is running, use these keyboard shortcuts:

| Key       | Action                                |
| --------- | ------------------------------------- |
| `+` / `=` | Increase detail level                 |
| `-` / `_` | Decrease detail level                 |
| `↑` / `↓` | Select request (enter selection mode) |
| `i`       | Inspect selected request in browser   |
| `ESC`     | Exit selection mode                   |
| `q`       | Quit                                  |

## Detail Levels

| Level | Output                                       |
| ----- | -------------------------------------------- |
| 1     | Dots only (minimal)                          |
| 2     | Timestamp + status code                      |
| 3     | Timestamp + status + method + path (default) |
| 4     | Level 3 + headers (truncated)                |
| 5     | Level 4 + full headers + body preview        |
| 6     | Full headers + complete body                 |

## Browser Inspect

Select any request with arrow keys, then press `i` to open a detailed HTML view in your default browser. The inspect view includes:

- Complete request and response headers
- Formatted JSON bodies with syntax highlighting
- Status code with semantic coloring
- Request duration and timing information
- Collapsible sections for easy navigation

All HTML files are saved alongside the JSON data in your system's temp directory.

## Data Storage

httpSandwich automatically saves all captured exchanges to:

```
{temp-directory}/httpSandwich/{session-id}/
├── {exchange-id}.json    # Raw exchange data
└── {exchange-id}.html    # Browser-viewable format (when inspected)
```

Session IDs are timestamp-based (e.g., `20251207-143052`), making it easy to find and analyze past sessions.

## Development

```bash
# Run in development mode (with hot reload)
npm run dev -- between 8000 and 3000

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Full quality check (lint + format + typecheck + test)
npm run quality

# Auto-fix linting and formatting issues
npm run quality:fix
```

### Project Structure

```
src/
├── cli/            # CLI entry point and argument parsing
├── domain/         # Core business logic and interfaces
├── application/    # Use cases and services
├── infrastructure/ # External concerns (HTTP, terminal, files)
└── shared/         # Cross-cutting utilities
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass: `npm run quality`
2. Code follows the existing style
3. New features include appropriate tests

## License

MIT © 2025 [Manuel Kießling](https://manuel.kiessling.net) [for the DX·Tooling initiative](https://github.com/dx-tooling).
