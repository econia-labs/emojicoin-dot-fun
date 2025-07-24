module.exports = {
  extends: ["../sdk/.eslintrc.js"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["tsconfig.json"],
    ecmaVersion: "latest",
    sourceType: "module",
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "import/no-unused-modules": "off",
    "no-console": "off",
  },
};
