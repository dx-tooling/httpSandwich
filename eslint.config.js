import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jsoncPlugin from "eslint-plugin-jsonc";
import ymlPlugin from "eslint-plugin-yml";

export default [
  // ============================================
  // Global ignores
  // ============================================
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "package-lock.json", "*.lock"],
  },

  // ============================================
  // JavaScript Configuration
  // ============================================
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...eslint.configs.recommended,
  },

  // ============================================
  // TypeScript Configuration
  // ============================================

  // TypeScript strict type-checked rules (source files)
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // TypeScript strict type-checked rules (test files)
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["tests/**/*.ts"],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ["tests/**/*.ts"],
  })),
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.tests.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Custom TypeScript rule overrides
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    rules: {
      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],

      // Require explicit member accessibility
      "@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "explicit" }],

      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
        },
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
        {
          selector: "class",
          format: ["PascalCase"],
        },
        {
          selector: "enum",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["PascalCase"],
        },
      ],

      // Method signature style
      "@typescript-eslint/method-signature-style": ["error", "property"],

      // No unused vars (error, not warning)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Prefer nullish coalescing
      "@typescript-eslint/prefer-nullish-coalescing": "error",
    },
  },

  // Disable type-aware rules for config files (uses JavaScript)
  {
    files: ["*.config.js", "*.config.ts", "*.config.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },

  // ============================================
  // JSON/JSONC Configuration
  // ============================================

  // JSON recommended rules (strict parsing)
  ...jsoncPlugin.configs["flat/recommended-with-json"],

  // Additional JSON rules for package.json
  {
    files: ["**/package.json"],
    rules: {
      "jsonc/sort-keys": [
        "error",
        {
          pathPattern: "^$",
          order: [
            "name",
            "version",
            "description",
            "type",
            "engines",
            "bin",
            "main",
            "types",
            "exports",
            "files",
            "scripts",
            "keywords",
            "author",
            "license",
            "repository",
            "bugs",
            "homepage",
            "dependencies",
            "devDependencies",
            "peerDependencies",
            "optionalDependencies",
          ],
        },
        {
          pathPattern: "^(?:dev|peer|optional)?[Dd]ependencies$",
          order: { type: "asc" },
        },
      ],
      "jsonc/sort-array-values": [
        "error",
        {
          pathPattern: "^files$|^keywords$",
          order: { type: "asc" },
        },
      ],
    },
  },

  // tsconfig files allow comments
  {
    files: ["**/tsconfig*.json"],
    languageOptions: {
      parser: jsoncPlugin.parser,
      parserOptions: {
        jsonSyntax: "JSONC",
      },
    },
    rules: {
      "jsonc/no-comments": "off",
    },
  },

  // ============================================
  // YAML Configuration
  // ============================================

  // YAML standard rules
  ...ymlPlugin.configs["flat/standard"],

  // Additional YAML rules
  {
    files: ["**/*.yaml", "**/*.yml"],
    rules: {
      "yml/quotes": ["error", { prefer: "double", avoidEscape: true }],
      "yml/no-empty-document": "error",
      "yml/no-empty-key": "error",
      "yml/no-empty-sequence-entry": "error",
      "yml/require-string-key": "error",
    },
  },

  // ============================================
  // Prettier (must be last)
  // ============================================
  eslintConfigPrettier,
];
