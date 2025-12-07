import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/main.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist/cli",
  clean: true,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Resolve TypeScript path aliases (directory-based)
  esbuildOptions(options) {
    options.alias = {
      "@/domain": "./src/domain",
      "@/application": "./src/application",
      "@/infrastructure": "./src/infrastructure",
      "@/cli": "./src/cli",
      "@/shared": "./src/shared",
    };
  },
});
