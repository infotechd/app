// Mock implementation for @react-native/js-polyfills/error-guard
module.exports = {
  ErrorUtils: {
    setGlobalHandler: jest.fn(),
    getGlobalHandler: jest.fn(),
    reportError: jest.fn(),
    reportFatalError: jest.fn(),
  }
};