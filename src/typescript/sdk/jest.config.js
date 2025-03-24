const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: "<rootDir>/" }),
  },
  workerThreads: true,
  testEnvironment: "node",
  testEnvironmentOptions: {
    customExportConditions: ["react-server", "node", "node-addons"],
  },
  coveragePathIgnorePatterns: [],
  testPathIgnorePatterns: ["dist/*", "tests/utils/*"],
  collectCoverage: false,
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tests/tsconfig.json",
    }
  },
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 55,
      lines: 55,
      statements: 55,
    },
  },
  maxWorkers: 4,
  globalSetup: process.env.NO_TEST_SETUP !== "true" ? "./tests/global-setup.js" : null,
  globalTeardown: process.env.NO_TEST_SETUP !== "true" ? "./tests/global-teardown.js" : null,
};
