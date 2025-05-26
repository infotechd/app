// Setup React Native polyfills
// Required for React Native when running in Jest environment

// Mock React Native error utilities
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),
  getGlobalHandler: jest.fn(),
  reportError: jest.fn(),
  reportFatalError: jest.fn(),
};

// Mock the entire @react-native/js-polyfills module
jest.mock('@react-native/js-polyfills', () => {
  return {
    ErrorUtils: global.ErrorUtils,
  };
}, { virtual: true });

// Mock @react-native/js-polyfills/error-guard module
jest.mock('@react-native/js-polyfills/error-guard', () => ({
  ErrorUtils: global.ErrorUtils,
}), { virtual: true });
global.fetch = require('node-fetch');
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// URL and URLSearchParams polyfills
global.URL = require('url').URL;
global.URLSearchParams = require('url').URLSearchParams;

// Animation frame polyfill
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// setImmediate polyfill
global.setImmediate = jest.fn((fn, ...args) => setTimeout(fn, 0, ...args));

// Mock React Native components and APIs
jest.mock('react-native', () => {
  return {
    // Components
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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});
