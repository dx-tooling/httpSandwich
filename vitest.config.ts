import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts", "src/cli/main.ts"],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@/domain": resolve(__dirname, "./src/domain"),
      "@/application": resolve(__dirname, "./src/application"),
      "@/infrastructure": resolve(__dirname, "./src/infrastructure"),
      "@/cli": resolve(__dirname, "./src/cli"),
      "@/shared": resolve(__dirname, "./src/shared"),
    },
  },
});
