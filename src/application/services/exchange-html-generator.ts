import { type HttpExchange } from "@/domain";

/**
 * Generate a beautifully formatted HTML page for an HTTP exchange.
 * The page is self-contained with embedded CSS and requires no external dependencies.
 */
export function generateExchangeHtml(exchange: HttpExchange): string {
  const timestamp = exchange.timestamp.toISOString();
  const localTime = exchange.timestamp.toLocaleString();
  const duration = exchange.durationMs !== null ? `${String(exchange.durationMs)}ms` : "N/A";
  const statusCode = exchange.response?.statusCode ?? null;
  const statusClass = getStatusClass(statusCode);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(exchange.request.method)} ${escapeHtml(exchange.request.path)} - httpSandwich</title>
  <style>
${getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">
        <span class="brand-icon">🥪</span>
        <span class="brand-name">httpSandwich</span>
      </div>
      <div class="meta">
        <span class="meta-item" title="${escapeHtml(timestamp)}">
          <span class="meta-icon">🕐</span>
          ${escapeHtml(localTime)}
        </span>
        <span class="meta-item duration">
          <span class="meta-icon">⚡</span>
          ${escapeHtml(duration)}
        </span>
      </div>
    </header>

    <main class="content">
      <section class="section request-section">
        <h2 class="section-title">
          <span class="method-badge method-${exchange.request.method.toLowerCase()}">${escapeHtml(exchange.request.method)}</span>
          <span class="path">${escapeHtml(exchange.request.path)}</span>
        </h2>
        
        <details class="collapsible" open>
          <summary class="collapsible-header">Request Headers</summary>
          <div class="collapsible-content">
            ${renderHeaders(exchange.request.headers)}
          </div>
        </details>

        ${
          exchange.request.body !== null
            ? `
        <details class="collapsible" open>
          <summary class="collapsible-header">Request Body</summary>
          <div class="collapsible-content">
            ${renderBody(exchange.request.body, exchange.request.headers["content-type"] ?? exchange.request.headers["Content-Type"])}
          </div>
        </details>
        `
            : ""
        }
      </section>

      <div class="divider">
        <span class="divider-arrow">↓</span>
      </div>

      <section class="section response-section">
        <h2 class="section-title">
          ${
            statusCode !== null
              ? `<span class="status-badge ${statusClass}">${String(statusCode)} ${getStatusText(statusCode)}</span>`
              : `<span class="status-badge status-error">No Response</span>`
          }
        </h2>

        ${
          exchange.response !== null
            ? `
        <details class="collapsible" open>
          <summary class="collapsible-header">Response Headers</summary>
          <div class="collapsible-content">
            ${renderHeaders(exchange.response.headers)}
          </div>
        </details>

        ${
          exchange.response.body !== null
            ? `
        <details class="collapsible" open>
          <summary class="collapsible-header">Response Body</summary>
          <div class="collapsible-content">
            ${renderBody(exchange.response.body, exchange.response.headers["content-type"] ?? exchange.response.headers["Content-Type"])}
          </div>
        </details>
        `
            : ""
        }
        `
            : `<p class="no-response">The target server was unreachable or did not respond.</p>`
        }
      </section>
    </main>

    <footer class="footer">
      <div class="footer-content">
        <span class="exchange-id">Exchange ID: ${escapeHtml(exchange.id)}</span>
        <a href="https://github.com/dx-tooling/httpSandwich" target="_blank" rel="noopener noreferrer" class="github-link">
          <span class="github-icon">⭐</span>
          httpSandwich on GitHub
        </a>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Get CSS class for status code.
 */
function getStatusClass(statusCode: number | null): string {
  if (statusCode === null) return "status-error";
  if (statusCode >= 100 && statusCode < 200) return "status-info";
  if (statusCode >= 200 && statusCode < 300) return "status-success";
  if (statusCode >= 300 && statusCode < 400) return "status-redirect";
  if (statusCode >= 400 && statusCode < 500) return "status-client-error";
  if (statusCode >= 500) return "status-server-error";
  return "status-unknown";
}

/**
 * Get human-readable status text.
 */
function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    307: "Temporary Redirect",
    308: "Permanent Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[statusCode] ?? "";
}

/**
 * Render headers as a table.
 */
function renderHeaders(headers: Readonly<Record<string, string>>): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return `<p class="empty-message">No headers</p>`;
  }

  const rows = entries
    .map(
      ([name, value]) =>
        `<tr><td class="header-name">${escapeHtml(name)}</td><td class="header-value">${escapeHtml(value)}</td></tr>`
    )
    .join("\n");

  return `<table class="headers-table">
    <tbody>
      ${rows}
    </tbody>
  </table>`;
}

/**
 * Render body content with syntax highlighting for JSON.
 */
function renderBody(body: string, contentType?: string): string {
  const isJson = contentType?.includes("application/json") ?? false;

  if (isJson) {
    try {
      const parsed = JSON.parse(body) as unknown;
      const formatted = JSON.stringify(parsed, null, 2);
      return `<pre class="body-content body-json">${escapeHtml(formatted)}</pre>`;
    } catch {
      // Not valid JSON, render as plain text
    }
  }

  // Check if it looks like HTML
  const isHtml =
    contentType?.includes("text/html") ??
    (body.trim().startsWith("<") && body.trim().endsWith(">"));
  if (isHtml) {
    return `<pre class="body-content body-html">${escapeHtml(body)}</pre>`;
  }

  return `<pre class="body-content">${escapeHtml(body)}</pre>`;
}

/**
 * Get embedded CSS styles.
 */
function getStyles(): string {
  return `
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --text-primary: #e6edf3;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --border-color: #30363d;
      --accent-blue: #58a6ff;
      --accent-green: #3fb950;
      --accent-yellow: #d29922;
      --accent-orange: #db6d28;
      --accent-red: #f85149;
      --accent-purple: #a371f7;
      --accent-cyan: #39c5cf;
      --font-mono: 'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      --radius: 6px;
      --shadow: 0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f6f8fa;
        --bg-tertiary: #eaeef2;
        --text-primary: #1f2328;
        --text-secondary: #656d76;
        --text-muted: #8b949e;
        --border-color: #d0d7de;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--font-sans);
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-radius: var(--radius);
      margin-bottom: 24px;
      border: 1px solid var(--border-color);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 28px;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .meta {
      display: flex;
      gap: 24px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .meta-icon {
      font-size: 16px;
    }

    .duration {
      color: var(--accent-cyan);
      font-weight: 500;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section {
      background: var(--bg-secondary);
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
      font-size: 16px;
      font-weight: 500;
    }

    .method-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--font-mono);
      text-transform: uppercase;
    }

    .method-get { background: rgba(59, 185, 80, 0.15); color: var(--accent-green); }
    .method-post { background: rgba(88, 166, 255, 0.15); color: var(--accent-blue); }
    .method-put { background: rgba(210, 153, 34, 0.15); color: var(--accent-yellow); }
    .method-patch { background: rgba(210, 153, 34, 0.15); color: var(--accent-yellow); }
    .method-delete { background: rgba(248, 81, 73, 0.15); color: var(--accent-red); }
    .method-head { background: rgba(139, 148, 158, 0.15); color: var(--text-secondary); }
    .method-options { background: rgba(163, 113, 247, 0.15); color: var(--accent-purple); }

    .path {
      font-family: var(--font-mono);
      font-size: 14px;
      color: var(--text-primary);
      word-break: break-all;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      font-family: var(--font-mono);
    }

    .status-info { background: rgba(139, 148, 158, 0.15); color: var(--text-secondary); }
    .status-success { background: rgba(59, 185, 80, 0.15); color: var(--accent-green); }
    .status-redirect { background: rgba(88, 166, 255, 0.15); color: var(--accent-blue); }
    .status-client-error { background: rgba(210, 153, 34, 0.15); color: var(--accent-yellow); }
    .status-server-error { background: rgba(248, 81, 73, 0.15); color: var(--accent-red); }
    .status-error { background: rgba(163, 113, 247, 0.15); color: var(--accent-purple); }
    .status-unknown { background: rgba(139, 148, 158, 0.15); color: var(--text-secondary); }

    .collapsible {
      border-top: 1px solid var(--border-color);
    }

    .collapsible:first-of-type {
      border-top: none;
    }

    .collapsible-header {
      display: block;
      padding: 12px 20px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: transparent;
      user-select: none;
      transition: background 0.15s ease;
    }

    .collapsible-header:hover {
      background: var(--bg-tertiary);
    }

    .collapsible[open] .collapsible-header {
      border-bottom: 1px solid var(--border-color);
    }

    .collapsible-content {
      padding: 16px 20px;
    }

    .headers-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .headers-table tr:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    .headers-table td {
      padding: 8px 0;
      vertical-align: top;
    }

    .header-name {
      font-family: var(--font-mono);
      font-weight: 500;
      color: var(--accent-cyan);
      white-space: nowrap;
      padding-right: 24px;
      width: 1%;
    }

    .header-value {
      font-family: var(--font-mono);
      color: var(--text-primary);
      word-break: break-all;
    }

    .body-content {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius);
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.5;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 600px;
      overflow-y: auto;
    }

    .body-json {
      color: var(--accent-green);
    }

    .body-html {
      color: var(--accent-orange);
    }

    .empty-message, .no-response {
      color: var(--text-muted);
      font-style: italic;
      padding: 8px 0;
    }

    .divider {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px 0;
    }

    .divider-arrow {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      font-size: 18px;
      color: var(--text-secondary);
    }

    .footer {
      margin-top: 24px;
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-radius: var(--radius);
      border: 1px solid var(--border-color);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .exchange-id {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
    }

    .github-link {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .github-link:hover {
      color: var(--accent-yellow);
    }

    .github-icon {
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 16px;
      }

      .header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .meta {
        flex-direction: column;
        gap: 8px;
      }

      .section-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `;
}
