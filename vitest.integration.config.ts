import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["**/*.integration.test.ts", "**/*.integration.spec.ts"],
    setupFiles: ["./tools/scripts/setup-integration-tests.ts"],
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
});
