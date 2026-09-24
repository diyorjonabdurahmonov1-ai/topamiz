import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      // Isolated per test run — never touches the real .data/topamiz.db.
      TOPAMIZ_DB_PATH: ":memory:",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
