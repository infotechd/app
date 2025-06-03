// Configuração de polyfills para React Native
// Necessário para React Native quando executado no ambiente Jest

// Simulação de utilitários de erro do React Native
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(),
  reportError: jest.fn(),
  reportFatalError: jest.fn(),
};

// Simulação do módulo completo @react-native/js-polyfills
jest.mock('@react-native/js-polyfills', () => {
  return {
    ErrorUtils: global.ErrorUtils,
  };
}, { virtual: true });

// Simulação do módulo @react-native/js-polyfills/error-guard
jest.mock('@react-native/js-polyfills/error-guard', () => ({
  ErrorUtils: global.ErrorUtils,
}), { virtual: true });
global.fetch = require('node-fetch');
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Polyfills para URL e URLSearchParams
global.URL = require('url').URL;
global.URLSearchParams = require('url').URLSearchParams;

// Polyfill para frames de animação
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Polyfill para setImmediate
global.setImmediate = jest.fn((fn, ...args) => setTimeout(fn, 0, ...args));

// Simulação de componentes e APIs do React Native
jest.mock('react-native', () => {
  return {
    // Componentes
    View: 'View',
    Text: 'Text',
    FlatList: 'FlatList',
    TouchableOpacity: 'TouchableOpacity',
    StyleSheet: {
      create: jest.fn(styles => styles),
    },
    ActivityIndicator: 'ActivityIndicator',
    ScrollView: 'ScrollView',
    RefreshControl: 'RCTRefreshControl',
    Modal: 'Modal',
    Pressable: 'Pressable',
    Image: 'Image',
    TextInput: 'TextInput',
    Button: 'Button',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Platform: {
      OS: 'ios',
      select: jest.fn(obj => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
    Animated: {
      View: 'Animated.View',
      createAnimatedComponent: jest.fn(component => component),
      timing: jest.fn(),
      spring: jest.fn(),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(),
      })),
    },

    // APIs
    Alert: {
      alert: jest.fn(),
    },
    Linking: {
      openURL: jest.fn(),
    },
  };
});

// Simulação do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Simulação da navegação
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});
