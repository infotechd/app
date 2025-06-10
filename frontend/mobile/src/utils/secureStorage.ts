import * as SecureStore from 'expo-secure-store';

// Keys for storing sensitive data
const KEYS = {
  USER_TOKEN: 'user_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
};

/**
 * Saves a token securely
 * @param token JWT token to store securely
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.USER_TOKEN, token);
  } catch (error) {
    console.error('Error saving token to secure storage:', error);
    throw new Error('Failed to save authentication token securely');
  }
};

/**
 * Retrieves the token from secure storage
 * @returns The stored JWT token or null if not found
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.USER_TOKEN);
  } catch (error) {
    console.error('Error retrieving token from secure storage:', error);
    return null;
  }
};

/**
 * Deletes the token from secure storage
 */
export const deleteToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.USER_TOKEN);
  } catch (error) {
    console.error('Error deleting token from secure storage:', error);
  }
};

/**
 * Saves user data securely (excluding the token)
 * @param userData User data to store securely
 */
export const saveUserData = async (userData: any): Promise<void> => {
  try {
    // Remove token from user data as it's stored separately
    const { token, ...userDataWithoutToken } = userData;
    await SecureStore.setItemAsync(KEYS.USER_DATA, JSON.stringify(userDataWithoutToken));
  } catch (error) {
    console.error('Error saving user data to secure storage:', error);
    throw new Error('Failed to save user data securely');
  }
};

/**
 * Retrieves user data from secure storage
 * @returns The stored user data or null if not found
 */
export const getUserData = async (): Promise<any | null> => {
  try {
    const userData = await SecureStore.getItemAsync(KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data from secure storage:', error);
    return null;
  }
};

/**
 * Deletes user data from secure storage
 */
export const deleteUserData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.USER_DATA);
  } catch (error) {
    console.error('Error deleting user data from secure storage:', error);
  }
};

/**
 * Saves a refresh token securely
 * @param refreshToken Refresh token to store securely
 */
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Error saving refresh token to secure storage:', error);
    throw new Error('Failed to save refresh token securely');
  }
};

/**
 * Retrieves the refresh token from secure storage
 * @returns The stored refresh token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error retrieving refresh token from secure storage:', error);
    return null;
  }
};

/**
 * Deletes the refresh token from secure storage
 */
export const deleteRefreshToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error deleting refresh token from secure storage:', error);
  }
};

/**
 * Clears all secure storage data related to authentication
 */
export const clearAllAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      deleteToken(),
      deleteUserData(),
      deleteRefreshToken()
    ]);
  } catch (error) {
    console.error('Error clearing all auth data from secure storage:', error);
  }
};