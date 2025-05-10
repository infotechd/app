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

    // APIs
    Alert: {
      alert: jest.fn(),
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
