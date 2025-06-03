// Este arquivo é executado antes de quaisquer outros arquivos de configuração
// É usado para simular módulos problemáticos que podem causar problemas com o Jest

// Simulação do objeto global expo
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

// Simulação do módulo completo @react-native/js-polyfills e seus submódulos
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

// Simulação específica do módulo error-guard
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
