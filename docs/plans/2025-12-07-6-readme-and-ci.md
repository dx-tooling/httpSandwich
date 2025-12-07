# CI and README Setup

## Summary

Set up GitHub Actions for continuous integration and create a professional README.md with status badges targeting software engineers and DevOps professionals.

## Files to Create

### 1. `.github/workflows/ci.yml`

GitHub Actions workflow that:

- Triggers on push to `main` and pull requests
- Uses Node.js 24 (matching `.nvmrc`)
- Runs the full `npm run quality` suite (lint, format, typecheck, test)
- Caches npm dependencies for speed

### 2. `README.md`

Professional documentation including:

**Header Section:**

- Project name with sandwich emoji
- One-line description
- CI status badge (GitHub Actions)
- License badge
- Node.js version badge

**Sections:**

- What is httpSandwich? (clear value proposition)
- Features (bullet list of key capabilities)
- Quick Start (installation + basic usage)
- Usage Examples (sandwich-style syntax highlighted)
- Interactive Controls (keyboard shortcuts)
- Browser Inspect Feature
- Development (contributing info)
- License

## Badge URLs

```markdown
![CI](https://github.com/dx-tooling/httpSandwich/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen.svg)
```

## CI Workflow Structure

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup Node.js 24
      - Install dependencies (with cache)
      - Run quality checks
```
