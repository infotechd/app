import React from 'react';
import { render, act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext, AuthProvider, useAuth } from '../AuthContext';
import { User } from '../../types/user';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Helper function to create a wrapper for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Test AuthProvider initialization
  describe('AuthProvider initialization', () => {
    test('should initialize with default values', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initial state should have null user and isLoading true
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isTokenValid).toBe(false);

      // Wait for the useEffect to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify AsyncStorage.getItem was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('appUser');
    });

    test('should load user from AsyncStorage if available', async () => {
      // Mock a stored user with valid token
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      // Setup AsyncStorage to return our mock user
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the useEffect to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User should be loaded and token should be valid
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isTokenValid).toBe(true);
    });

    test('should not load user if token is invalid', async () => {
      // Mock a stored user with invalid token
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'short', // Too short to be valid
        userType: 'provider',
      };

      // Setup AsyncStorage to return our mock user
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the useEffect to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User should not be loaded and token should be invalid
      expect(result.current.user).toBeNull();
      expect(result.current.isTokenValid).toBe(false);

      // AsyncStorage.removeItem should be called to clean up the invalid user
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('appUser');
    });

    test('should handle AsyncStorage errors', async () => {
      // Mock AsyncStorage.getItem to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for the useEffect to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // User should be null and token should be invalid
      expect(result.current.user).toBeNull();
      expect(result.current.isTokenValid).toBe(false);

      // AsyncStorage.removeItem should be called to clean up
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('appUser');
    });
  });

  // Test login function
  describe('login function', () => {
    test('should store user data and update state on successful login', async () => {
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call login function
      await act(async () => {
        await result.current.login(mockUser);
      });

      // Verify state was updated
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isTokenValid).toBe(true);

      // Verify AsyncStorage.setItem was called with correct parameters
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('appUser', JSON.stringify(mockUser));
    });

    test('should throw error if token is invalid', async () => {
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'short', // Too short to be valid
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call login function and expect it to throw
      await expect(
        act(async () => {
          await result.current.login(mockUser);
        })
      ).rejects.toThrow('Token inválido ou ausente');

      // Verify state was not updated
      expect(result.current.user).toBeNull();
      expect(result.current.isTokenValid).toBe(false);

      // Verify AsyncStorage.setItem was not called
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // Test logout function
  describe('logout function', () => {
    test('should clear user data and update state on logout', async () => {
      // First login a user
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login(mockUser);
      });

      // Verify login was successful
      expect(result.current.user).toEqual(mockUser);

      // Call logout function
      await act(async () => {
        await result.current.logout();
      });

      // Verify state was updated
      expect(result.current.user).toBeNull();
      expect(result.current.isTokenValid).toBe(false);

      // Verify AsyncStorage.removeItem was called
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('appUser');
    });

    test('should handle errors during logout', async () => {
      // Mock AsyncStorage.removeItem to throw an error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call logout function and expect it to throw
      await expect(
        act(async () => {
          await result.current.logout();
        })
      ).rejects.toThrow();

      // Verify state was still updated (even with error)
      expect(result.current.user).toBeNull();
      expect(result.current.isTokenValid).toBe(false);
    });
  });

  // Test updateUser function
  describe('updateUser function', () => {
    test('should update user data and store in AsyncStorage', async () => {
      // First login a user
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login(mockUser);
      });

      // Update user data
      const updatedData = { name: 'Updated Name' };
      await act(async () => {
        await result.current.updateUser(updatedData);
      });

      // Verify state was updated
      expect(result.current.user).toEqual({ ...mockUser, ...updatedData });

      // Verify AsyncStorage.setItem was called with updated data
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'appUser',
        JSON.stringify({ ...mockUser, ...updatedData })
      );
    });

    test('should throw error if no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call updateUser function and expect it to throw
      await expect(
        act(async () => {
          await result.current.updateUser({ name: 'Updated Name' });
        })
      ).rejects.toThrow('Nenhum usuário logado para atualizar');
    });

    test('should throw error if updated token is invalid', async () => {
      // First login a user
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login(mockUser);
      });

      // Try to update with invalid token
      await expect(
        act(async () => {
          await result.current.updateUser({ token: 'short' });
        })
      ).rejects.toThrow('Token atualizado é inválido');
    });
  });

  // Test refreshToken function
  describe('refreshToken function', () => {
    test('should update token and return true if successful', async () => {
      // First login a user
      const mockUser: User = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'valid_token_12345678901234567890',
        userType: 'provider',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login
      await act(async () => {
        await result.current.login(mockUser);
      });

      // Call refreshToken function
      let refreshResult: boolean = false;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      // Verify result is true
      expect(refreshResult).toBe(true);

      // Verify user has a new token
      expect(result.current.user?.token).not.toBe(mockUser.token);
      expect(result.current.user?.token).toMatch(/^new_token_\d+$/);
      expect(result.current.isTokenValid).toBe(true);

      // Verify AsyncStorage.setItem was called with updated token
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should throw error if no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call refreshToken function
      let refreshResult: boolean = true;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });

      // Verify result is false
      expect(refreshResult).toBe(false);
    });
  });

  // Test useAuth hook
  describe('useAuth hook', () => {
    test('should throw error when used outside AuthProvider', () => {
      // Attempt to use hook outside provider
      const { result } = renderHook(() => useAuth());

      // Expect error to be thrown
      expect(result.error).toEqual(
        Error('useAuth deve ser utilizado dentro de um AuthProvider')
      );
    });
  });
});