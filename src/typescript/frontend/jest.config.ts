/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
import type { Config } from "jest";
import nextJest from "next/jest";
const createJestConfig = nextJest({
  dir: "./",
});
const config: Config = {
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  workerThreads: true,
  testEnvironment: "jsdom",
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
export default createJestConfig(config);
