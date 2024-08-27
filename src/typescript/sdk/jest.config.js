/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  workerThreads: true,
  testEnvironment: "node",
  testEnvironmentOptions: {
    // If we don't add this, all the jest tests that run/import server-only code will fail to
    // import it and thus fail.
    customExportConditions: ["react-server", "node", "node-addons"],
  },
  coveragePathIgnorePatterns: [
    "src/cli/local-node.ts",
    "src/helpers/misc.ts",
    "src/helpers/aptos-client.ts",
    "src/utils/env.ts",
  ],
  testPathIgnorePatterns: ["dist/*"],
  collectCoverage: false,
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },
  maxWorkers: 4,
  globalSetup: process.env.NO_TEST_SETUP !== "true" ? "./tests/pre-test.js" : null,
  globalTeardown: process.env.NO_TEST_SETUP !== "true" ? "./tests/post-test.js" : null,
};
