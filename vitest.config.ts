import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist", "tests/e2e/**", "playwright/**"],
  },
});
