// Use Expo's environment variables instead of react-native-config
// If running on a physical device, use the device's network IP to reach the API server
// If running on an emulator, use 10.0.2.2 (Android) or localhost (iOS)
// For tests, use a mock URL that can be easily identified in test output
import { Platform } from 'react-native';

// Default API URLs for different environments
const getDefaultApiUrl = () => {
  // For Android, use 10.0.2.2 (special IP that routes to host machine)
  // For iOS, use localhost
  // For physical devices, these might not work, but the environment variable should be set correctly
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:3000/api';
  }

  // Fallback to a common local network IP
  return 'http://192.168.1.3:3000/api';
};

// Try multiple API URLs if the primary one fails
export const API_URLS = [
  process.env.EXPO_PUBLIC_API_URL,
  getDefaultApiUrl(),
  'http://localhost:3000/api',
  'http://127.0.0.1:3000/api',
  'http://10.0.2.2:3000/api',
  'http://192.168.1.3:3000/api'
].filter(Boolean) as string[]; // Filter out undefined/null values

// Use the first URL for compatibility with existing code
export const API_URL = 
  process.env.NODE_ENV === 'test' 
    ? 'http://test-api-url/api'
    : (API_URLS[0] || 'http://localhost:3000/api');
