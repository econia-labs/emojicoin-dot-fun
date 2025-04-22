// cspell:word nofunc

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
    "next.config.mjs",
    "playwright.config.js",
    "postcss.config.js",
    "tailwind.config.js",
    "jest.config.js",
    "public/static",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["tsconfig.json", "tests/tsconfig.json"],
    warnOnUnsupportedTypeScriptVersion: false,
  },
  plugins: ["@typescript-eslint", "import", "simple-import-sort"],
  rules: {
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
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
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    /**
     * Function hoisting is safe; because of this, "nofunc" is shorthand for allowing it.
     * @see {@link https://eslint.org/docs/latest/rules/no-use-before-define#options}
     */
    "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "debug", "clear", "trace", "info"],
      },
    ],
    "no-unreachable": "error",
    "react/prop-types": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "separate-type-imports", disallowTypeAnnotations: true },
    ],
    "@typescript-eslint/no-import-type-side-effects": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
