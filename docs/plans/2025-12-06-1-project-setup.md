# httpSandwich Project Setup

## Core Tooling Stack

| Tool | Purpose | Why |

|------|---------|-----|

| TypeScript 5.x | Type safety | Strict mode, ESM native |

| tsx | Dev runner | Run TS directly without build step |

| Vitest | Testing | Fast, native ESM/TS support, Vite-powered |

| ESLint 9 (flat config) | Linting | Modern flat config, typescript-eslint |

| Prettier | Formatting | Consistent code style |

## Dependencies (Minimal)

**devDependencies only** (CLI will be built/bundled for distribution):

- `typescript` - Type checking and compilation
- `tsx` - TypeScript execution for development
- `vitest` - Test runner
- `eslint` + `typescript-eslint` + `@eslint/js` - Linting
- `prettier` + `eslint-config-prettier` - Formatting
- `@types/node` - Node.js type definitions

## Files to Create

### Configuration Files

1. **[package.json](package.json)** - ESM module, strict engines, scripts:
   - `dev` - Run with tsx watch
   - `build` - TypeScript compilation
   - `test` - Vitest run
   - `test:watch` - Vitest watch mode
   - `test:coverage` - Vitest with coverage
   - `quality` - Lint + format check + type-check
   - `quality:fix` - Auto-fix lint/format issues

2. **[tsconfig.json](tsconfig.json)** - Strict configuration:
   - `"strict": true` plus additional strict flags
   - `"module": "NodeNext"` for ESM
   - `"target": "ES2023"` (Node 24 supports latest ES)
   - Path aliases for clean imports (`@/domain`, `@/application`, etc.)

3. **[eslint.config.js](eslint.config.js)** - Flat config with:
   - `@eslint/js` recommended rules
   - `typescript-eslint` strict type-checked rules
   - Prettier integration (disable conflicting rules)

4. **[.prettierrc](/.prettierrc)** - Formatting rules

5. **[vitest.config.ts](vitest.config.ts)** - Test configuration with path aliases

## Folder Structure (Clean Architecture)

```
src/
  domain/           # Core business logic, interfaces, entities
    index.ts        # Public exports
  application/      # Use cases, orchestration
    index.ts
  infrastructure/   # External concerns (HTTP server, proxy, etc.)
    index.ts
  cli/              # CLI entry point and command handling
    index.ts
    main.ts         # Entry point
  shared/           # Cross-cutting utilities (logging, errors)
    index.ts

tests/
  unit/             # Unit tests (isolated, mocked dependencies)
  integration/      # Integration tests
  helpers/          # Test utilities and fixtures
```

### Architectural Principles Enforced

- **Dependency Inversion**: Domain/Application layers define interfaces; Infrastructure implements them
- **Barrel exports**: Each layer has `index.ts` controlling public API
- **Path aliases**: `@/domain`, `@/application`, etc. for clean imports
- **Test isolation**: Unit tests mirror `src/` structure in `tests/unit/`

## Initial Source Files

Minimal placeholder files to validate the setup works:

- `src/cli/main.ts` - Entry point with simple "httpSandwich starting" log
- `src/domain/index.ts` - Empty barrel export
- `src/application/index.ts` - Empty barrel export
- `src/infrastructure/index.ts` - Empty barrel export
- `src/shared/index.ts` - Empty barrel export
- `tests/unit/example.test.ts` - Sample test to verify Vitest works

## Verification Steps

After setup, I will run:

1. `nvm use` to ensure Node 24
2. `npm install` to install dependencies
3. `npm run quality` to verify linting/type-checking passes
4. `npm test` to verify Vitest runs
5. `npm run dev` to verify the CLI entry point works
