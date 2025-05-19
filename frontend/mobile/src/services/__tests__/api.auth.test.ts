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
    const validPassword = 'Password123';
    const mockUser = { 
      id: '123', 
      nome: 'Test User', 
      email: validEmail,
      tipoUsuario: 'comprador'
    };
    const mockToken = 'mock-jwt-token';
    const mockLoginResponse = { 
      user: { ...mockUser }, 
      token: mockToken 
    };

    // Add token to user object to match how the API actually works
    mockLoginResponse.user.token = mockToken;

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
      nome: 'New User',
      email: 'newuser@example.com',
      senha: 'Password123',
      tipoUsuario: 'comprador',
      cpfCnpj: '12345678901'
    };
    const mockRegisterResponse = { message: 'User registered successfully' };

    test('should return success message when registration is successful', async () => {
      // Mock successful response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockRegisterResponse,
      });

      const result = await register(validUserData);

      // Verify the result matches the mock response
      expect(result).toEqual(mockRegisterResponse);
    });

    test('should throw error when registration fails', async () => {
      // Mock failed response
      const errorMessage = 'Email already in use';
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          data: { message: errorMessage },
        },
      });

      // Verify the function throws the expected error
      await expect(register(validUserData)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for getProfile function
  describe('getProfile', () => {
    const validToken = 'valid-jwt-token';
    const mockUser = { 
      id: '123', 
      nome: 'Test User', 
      email: 'test@example.com',
      tipoUsuario: 'comprador'
    };

    test('should return user profile when token is valid', async () => {
      // Mock successful response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockUser,
      });

      const result = await getProfile(validToken);

      // Verify the result matches the mock response
      expect(result).toEqual(mockUser);
    });

    test('should throw error when token is invalid', async () => {
      // Mock failed response
      const errorMessage = 'Invalid or expired token';
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          data: { message: errorMessage },
        },
      });

      // Verify the function throws the expected error
      await expect(getProfile('invalid-token')).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateProfile function
  describe('updateProfile', () => {
    const validToken = 'valid-jwt-token';
    const validProfileData = {
      id: '123',
      nome: 'Updated Name',
      endereco: 'Updated address',
    };
    const mockUpdateResponse = { 
      message: 'Profile updated successfully',
      user: {
        id: '123',
        nome: 'Updated Name',
        email: 'test@example.com',
        tipoUsuario: 'comprador',
        endereco: 'Updated address'
      }
    };

    test('should return success message when profile update is successful', async () => {
      // Mock successful response
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockUpdateResponse,
      });

      const result = await updateProfile(validToken, validProfileData);

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when profile update fails', async () => {
      // Mock failed response
      const errorMessage = 'Invalid data provided';
      mockedAxios.put.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          data: { message: errorMessage },
        },
      });

      // Verify the function throws the expected error
      await expect(updateProfile(validToken, validProfileData)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for deleteAccount function
  describe('deleteAccount', () => {
    const validToken = 'valid-jwt-token';
    const mockDeleteResponse = { message: 'Account deleted successfully' };

    test('should return success message when account deletion is successful', async () => {
      // Mock successful response
      mockedAxios.delete.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockDeleteResponse,
      });

      const result = await deleteAccount(validToken);

      // Verify the result matches the mock response
      expect(result).toEqual(mockDeleteResponse);
    });

    test('should throw error when account deletion fails', async () => {
      // Mock failed response
      const errorMessage = 'Unauthorized action';
      mockedAxios.delete.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          data: { message: errorMessage },
        },
      });

      // Verify the function throws the expected error
      await expect(deleteAccount('invalid-token')).rejects.toThrow(errorMessage);
    });
  });
});
