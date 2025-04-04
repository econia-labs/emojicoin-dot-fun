// @ts-check
/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  workerThreads: true,
  testEnvironment: "./tests/fixed-jsdom-environment.ts",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },
};

const nextJest = require("next/jest").default;
const createJestConfig = nextJest({
  dir: "./",
});
module.exports = createJestConfig(config);
