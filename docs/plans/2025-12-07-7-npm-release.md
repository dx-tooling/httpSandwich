# npm Publishing Setup

## Summary

Prepare httpSandwich for public npm release so users can run:

```bash
npm install -g httpsandwich   # Global install
httpSandwich between 8000 and localhost:3000

# Or one-off:
npx httpsandwich between 8000 and localhost:3000
```

## Changes Required

### 1. Update `package.json` Metadata

Add missing fields required/recommended for npm:

```json
{
  "author": "Manuel Kießling <manuel@kiessling.net>",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dx-tooling/httpSandwich.git"
  },
  "homepage": "https://github.com/dx-tooling/httpSandwich#readme",
  "bugs": {
    "url": "https://github.com/dx-tooling/httpSandwich/issues"
  }
}
```

Add safety scripts:

```json
{
  "scripts": {
    "prepublishOnly": "npm run quality && npm run build"
  }
}
```

Expand keywords for discoverability:

```json
{
  "keywords": [
    "cli",
    "debugging",
    "developer-tools",
    "devtools",
    "http",
    "http-proxy",
    "inspector",
    "man-in-the-middle",
    "mitm",
    "monitor",
    "network",
    "proxy",
    "traffic",
    "tui"
  ]
}
```

### 2. Create GitHub Actions Workflow for npm Publishing

Create `.github/workflows/publish.yml` that:

- Triggers on push to `main` when `package.json` changes
- Compares version in `package.json` with latest published npm version
- If version is higher: runs quality checks, then publishes to npm
- If version unchanged: skips (no-op)
- Uses `NPM_TOKEN` repository secret for authentication

**Result: Bump version in package.json → push to main → npm release happens automatically**

No tags. No releases. No manual steps. Just change the version number.

### 3. Update README with npm Installation

Add npm installation section at the top of Quick Start:

````markdown
### Installation

```bash
# Global install (recommended)
npm install -g httpsandwich

# Or run directly without installing
npx httpsandwich between 8000 and localhost:3000
```
````

```

Update all usage examples to show the clean `httpSandwich` command.

### 4. Version Bump Decision

Current: `0.0.1`

Options:

- Keep `0.0.1` for initial "beta" release
- Bump to `1.0.0` for official launch

## Publishing Workflow (Manual First Time)

1. Ensure you're logged into npm: `npm login`
2. Verify package contents: `npm pack --dry-run`
3. Publish: `npm publish`

After that, releases can be automated via GitHub Actions.
```
