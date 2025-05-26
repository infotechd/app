// Mock implementation for expo-modules-core
module.exports = {
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
    emit: jest.fn()
  })),
  NativeModule: jest.fn(),
  SharedObject: jest.fn(),
  SharedRef: jest.fn(),
  // Add other exports as needed
};