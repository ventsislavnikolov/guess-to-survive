const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/auth$": "<rootDir>/auth.ts",
    "^@/tests$": "<rootDir>/__tests__",
  },
  testMatch: [
    "**/__tests__/unit/**/*.(test|spec).[jt]s?(x)",
    "**/*.(test|spec).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["html", "lcov", "text"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/__tests__/e2e/"],
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};

module.exports = createJestConfig(customJestConfig);
