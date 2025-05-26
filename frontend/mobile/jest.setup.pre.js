// This file runs before any other setup files
// It's used to mock problematic modules that might cause issues with Jest

// Mock the global expo object
globalThis.expo = {
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
    emit: jest.fn()
  })),
  NativeModule: jest.fn(),
  SharedObject: jest.fn(),
  SharedRef: jest.fn(),
};

// Mock the entire @react-native/js-polyfills module and its submodules
jest.mock('@react-native/js-polyfills', () => {
  return {
    ErrorUtils: {
      setGlobalHandler: jest.fn(),
      getGlobalHandler: jest.fn(),
      reportError: jest.fn(),
      reportFatalError: jest.fn(),
    }
  };
}, { virtual: true });

// Specifically mock the error-guard module
jest.mock('@react-native/js-polyfills/error-guard', () => {
  return {
    ErrorUtils: {
      setGlobalHandler: jest.fn(),
      getGlobalHandler: jest.fn(),
      reportError: jest.fn(),
      reportFatalError: jest.fn(),
    }
  };
}, { virtual: true });
