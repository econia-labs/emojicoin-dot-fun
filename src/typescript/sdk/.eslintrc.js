module.exports = {
  env: {
    browser: true,
    es2024: true,
    jest: true,
    node: true,
  },
  ignorePatterns: ["dist/**", "node_modules/**", ".eslintrc.js", "jest.config.js"],
  extends: [
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["tsconfig.json", "tests/tsconfig.json"],
    ecmaVersion: "latest",
    sourceType: "module",
    warnOnUnsupportedTypeScriptVersion: false,
  },
  plugins: ["@typescript-eslint", "unused-imports", "import", "prettier"],
  rules: {
    "prettier/prettier": ["error"],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "debug", "clear", "trace"],
      },
    ],
    "@typescript-eslint/lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true },
    ],
    "@typescript-eslint/no-throw-literal": "error",
    "import/extensions": "off",
    "import/no-commonjs": ["error", { allowRequire: false, allowPrimitiveModules: false }],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: true,
        optionalDependencies: true,
        peerDependencies: true,
      },
    ],
    "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
    "max-classes-per-file": ["error", 10],
    "import/prefer-default-export": "off",
    "object-curly-newline": "off",
    "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: false }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "unused-imports/no-unused-imports": "error",
    "import/no-unused-modules": [
      "warn",
      {
        missingExports: true,
        unusedExports: true,
        ignoreExports: ["tests/**/*", "**/index.ts", "src/types/server-only.d.ts"],
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
