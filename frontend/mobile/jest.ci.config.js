// jest.ci.config.js - Configuration for CI testing
module.exports = {
  // Use jest-expo preset for React Native
  preset: 'jest-expo',
  testEnvironment: 'jsdom',

  // Match test files
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],

  // Configure transformIgnorePatterns to handle React Native and Expo modules
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native/.*|@react-native\\/js-polyfills|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@expo-google-fonts/.*|victory-.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|app-common|socket.io-client|engine.io-client|socket.io-parser|@socket.io/component-emitter|@testing-library/react-native)'
  ],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Configure modules
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Configure path aliases (@/*) and module mocks
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native/js-polyfills/error-guard': '<rootDir>/__mocks__/error-guard-mock.js',
    'expo-modules-core': '<rootDir>/__mocks__/expo-modules-core.js'
  },

  // Files to run before any tests
  setupFiles: ['./jest.setup.pre.js'],

  // Use setup files
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
};
