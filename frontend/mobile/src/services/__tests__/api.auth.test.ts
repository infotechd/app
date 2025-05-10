import { login, register, getProfile, updateProfile, deleteAccount } from '../api';
import axios from 'axios';
import { API_URL } from '../../config/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Authentication API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock the connectivity check (axios.head call to Google)
    mockedAxios.head.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {}
    });
  });

  // Tests for login function
  describe('login', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';
    const mockUser = { id: '123', name: 'Test User', email: validEmail };
    const mockToken = 'mock-jwt-token';
    const mockLoginResponse = { user: mockUser, token: mockToken };

    test('should return user data and token when login is successful', async () => {
      // Mock successful axios response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockLoginResponse,
      });

      const result = await login(validEmail, validPassword);

      // Verify axios was called with correct parameters
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/auth/login`,
        { email: validEmail, senha: validPassword },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockLoginResponse);
    });

    test('should throw error when login fails with API error', async () => {
      // Mock failed axios response
      const errorMessage = 'Invalid credentials';
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          data: { message: errorMessage },
        },
      });

      // Verify the function throws the expected error
      await expect(login(validEmail, 'wrong-password')).rejects.toThrow(errorMessage);
    });

    test('should throw error when login fails with network error', async () => {
      // Mock network error
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      });

      // Verify the function throws the expected error
      await expect(login(validEmail, validPassword)).rejects.toThrow('Tempo limite excedido');
    });
  });

  // Tests for register function
  describe('register', () => {
    const validUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'password123',
      userType: 'provider',
    };
    const mockRegisterResponse = { message: 'User registered successfully' };

    test('should return success message when registration is successful', async () => {
      // Mock successful fetch response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockRegisterResponse),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await register(validUserData);

      // Verify fetch was called with correct parameters
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          body: JSON.stringify(validUserData),
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockRegisterResponse);
    });

    test('should throw error when registration fails', async () => {
      // Mock failed fetch response
      const errorMessage = 'Email already in use';
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      // Verify the function throws the expected error
      await expect(register(validUserData)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for getProfile function
  describe('getProfile', () => {
    const validToken = 'valid-jwt-token';
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
    const mockProfileResponse = { user: mockUser };

    test('should return user profile when token is valid', async () => {
      // Mock successful fetch response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockProfileResponse),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await getProfile(validToken);

      // Verify fetch was called with correct parameters
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/profile`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${validToken}`,
            'Accept': 'application/json',
          }),
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockProfileResponse);
    });

    test('should throw error when token is invalid', async () => {
      // Mock failed fetch response
      const errorMessage = 'Invalid or expired token';
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      // Verify the function throws the expected error
      await expect(getProfile('invalid-token')).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateProfile function
  describe('updateProfile', () => {
    const validToken = 'valid-jwt-token';
    const validProfileData = {
      name: 'Updated Name',
      bio: 'Updated bio information',
    };
    const mockUpdateResponse = { message: 'Profile updated successfully' };

    test('should return success message when profile update is successful', async () => {
      // Mock successful fetch response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockUpdateResponse),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await updateProfile(validToken, validProfileData);

      // Verify fetch was called with correct parameters
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/profile`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${validToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          body: JSON.stringify(validProfileData),
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when profile update fails', async () => {
      // Mock failed fetch response
      const errorMessage = 'Invalid data provided';
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      // Verify the function throws the expected error
      await expect(updateProfile(validToken, validProfileData)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for deleteAccount function
  describe('deleteAccount', () => {
    const validToken = 'valid-jwt-token';
    const mockDeleteResponse = { message: 'Account deleted successfully' };

    test('should return success message when account deletion is successful', async () => {
      // Mock successful fetch response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockDeleteResponse),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await deleteAccount(validToken);

      // Verify fetch was called with correct parameters
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/profile`,
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${validToken}`,
            'Accept': 'application/json',
          }),
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockDeleteResponse);
    });

    test('should throw error when account deletion fails', async () => {
      // Mock failed fetch response
      const errorMessage = 'Unauthorized action';
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ message: errorMessage }),
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      // Verify the function throws the expected error
      await expect(deleteAccount('invalid-token')).rejects.toThrow(errorMessage);
    });
  });
});
