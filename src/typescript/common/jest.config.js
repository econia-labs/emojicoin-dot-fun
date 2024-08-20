/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  workerThreads: true,
  testEnvironment: "node",
  coveragePathIgnorePatterns: [],
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
};
