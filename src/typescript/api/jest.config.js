/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  workerThreads: true,
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "src/cli/local-node.ts",
    "src/helpers/misc.ts",
    "src/helpers/aptos-client.ts",
    "src/utils/env.ts",
  ],
  testPathIgnorePatterns: ["dist/*"],
  collectCoverage: false,
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
