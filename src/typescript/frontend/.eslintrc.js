module.exports = {
  env: {
    browser: true,
    es2024: true,
    jest: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  globals: {
    JSX: true,
    React: true,
  },
  ignorePatterns: [
    "dist/**",
    "node_modules/**",
    ".eslintrc.js",
    "config-overrides.js",
    "playwright.config.ts",
    "postcss.config.js",
    "tailwind.config.js",
    "example.spec.ts",
    "jest.config.js",
    "jest.setup.js",
    "next.config.mjs",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["tsconfig.json", "tests/jest/tsconfig.json"],
    warnOnUnsupportedTypeScriptVersion: false,
  },
  plugins: ["@typescript-eslint", "import", "prettier"],
  rules: {
    "prettier/prettier": ["error"],
    "import/no-cycle": [
      "error",
      {
        ignoreExternal: true,
      },
    ],
    "@typescript-eslint/lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true },
    ],
    "@typescript-eslint/no-throw-literal": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-types": [
      "error",
      {
        extendDefaults: true,
        types: {
          "{}": false,
        },
      },
    ],
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-use-before-define": 0,
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "debug", "clear", "trace"],
      },
    ],
    "no-unreachable": "error",
    "react/prop-types": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
