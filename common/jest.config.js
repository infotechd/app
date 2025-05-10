module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/schemas'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@schemas/(.*)$': '<rootDir>/schemas/$1',
  },
  collectCoverageFrom: [
    'schemas/**/*.ts',
    '!schemas/**/*.d.ts',
    '!schemas/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};