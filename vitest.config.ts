import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // @agp/ui-components ships type declarations only (emitDeclarationOnly
      // in its tsconfig — apps/public-site consumes it via Next.js's
      // transpilePackages, which transpiles the TS source directly and
      // never touches dist/*.js). Vitest has no equivalent, so without this
      // alias any test importing from the package resolves dist/index.js's
      // re-exports to real .d.ts files with no matching .js — every named
      // export comes back undefined instead of erroring, which is much
      // harder to diagnose than a resolution failure would have been.
      "@agp/ui-components": path.resolve(__dirname, "packages/ui-components/src/index.ts"),
    },
  },
  test: {
    coverage: {
      reporter: ["text", "html"]
    },
    environment: "node",
    globals: false,
    include: ["**/*.test.ts", "**/*.spec.ts"]
  }
});
