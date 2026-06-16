import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    // Use happy-dom for DOM simulation (lighter than jsdom)
    environment: "happy-dom",

    // Setup files run before each test file
    setupFiles: ["./tests/setup.ts"],

    // Test file patterns
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "**/__tests__/**/*.test.ts",
      "**/__tests__/**/*.test.tsx",
    ],

    // Exclude patterns
    exclude: ["node_modules", ".next", "dist", "public"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["lib/**/*.ts", "app/**/*.ts", "app/**/*.tsx"],
      exclude: [
        "node_modules/**",
        "tests/**",
        ".next/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/generated/**",
      ],
      // Thresholds for security-critical modules
      thresholds: {
        "lib/crypto.ts": { lines: 90 },
        "lib/url-security.ts": { lines: 85 },
      },
    },

    // Globals (describe, it, expect available without import)
    globals: true,

    // Timeout for tests
    testTimeout: 10_000,

    // Reporter
    reporters: ["verbose"],
  },
});
