/** @type {import("ts-jest/dist/types").InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["src/helpers/aptos-client.ts", "src/utils/env.ts"],
  testPathIgnorePatterns: ["dist/*"],
  collectCoverage: true,
  setupFiles: ["dotenv/config"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },
  maxWorkers: 4,
  globalSetup: "./tests/pre-test.js",
  globalTeardown: "./tests/post-test.js",
};
