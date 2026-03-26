import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    // Playwright lives under e2e/ — use `pnpm test:smoke`, not Vitest
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.test.tsx",
    ],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "server/**/*.ts",
        "client/src/**/*.ts",
        "client/src/**/*.tsx",
        "shared/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/drizzle/**",
        "**/_core/types/**",
      ],
      // Enforce minimum coverage thresholds
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    // Global test timeout
    testTimeout: 30000,
    // Setup files
    setupFiles: [],
  },
});
