// jest.ci.config.js - Configuration for CI testing
module.exports = {
  // Use jest-expo preset for React Native
  preset: 'jest-expo',
  testEnvironment: 'node',

  // Match test files
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],

  // Configure transformIgnorePatterns to handle React Native and Expo modules
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|victory-.*|@react-native/js-polyfills|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|app-common))'
  ],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Configure modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Configure path aliases (@/*)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Use setup files
  setupFilesAfterEnv: ['./jest.custom-setup.js'],
};
