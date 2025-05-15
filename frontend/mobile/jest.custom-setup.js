// This file is a custom setup for Jest that bypasses the React Native setup
// It provides the necessary mocks for React Native components and APIs

// Mock React Native components and APIs
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(),
  reportError: jest.fn(),
  reportFatalError: jest.fn(),
};

// Include the existing setup
require('./jest.setup.js');