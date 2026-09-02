import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/.next/**", "**/coverage/**", "**/node_modules/**", "openapi.yaml"]
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      sourceType: "module"
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly"
      }
    }
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts"]
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "vitest.config.ts",
            "vitest.integration.config.ts",
            "tools/scripts/setup-integration-tests.ts",
            "apps/public-site/prisma/seed.ts",
            "apps/public-site/scripts/seed-c3-fixtures.ts",
            "apps/public-site/scripts/seed-official-templates.ts",
            "apps/public-site/scripts/seed-sample-reviews.ts",
            "apps/public-site/scripts/migrate-portfolio-projects.ts"
          ]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    // Under allowDefaultProject's synthetic tsconfig, types imported
    // from outside apps/public-site (this script reads
    // packages/ui-components/src/data/projects.ts directly) don't
    // resolve, which cascades into "unsafe" errors on every property
    // access — a real limitation of the default-project fallback, not
    // an actual type-safety issue in this one-off script (verified by
    // running it end-to-end against a real database before this file
    // was committed).
    files: ["apps/public-site/scripts/migrate-portfolio-projects.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off"
    }
  }
);
