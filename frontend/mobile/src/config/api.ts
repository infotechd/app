// Use Expo's environment variables instead of react-native-config
// If running on a physical device, use the device's network IP to reach the API server
// If running on an emulator, use 10.0.2.2 (Android) or localhost (iOS)
// For tests, use a mock URL that can be easily identified in test output
export const API_URL = 
  process.env.NODE_ENV === 'test' 
    ? 'http://test-api-url/api'
    : (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000/api');
