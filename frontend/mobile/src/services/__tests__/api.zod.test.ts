import { login, register, getProfile, updateProfile, deleteAccount } from '../api';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { z } from 'zod';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service with Zod Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the connectivity check (axios.head call to Google)
    mockedAxios.head.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {}
    });
  });

  // Tests for login function with Zod validation
  describe('login with Zod validation', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';

    // Valid user object that matches the Zod schema
    const mockUser = { 
      idUsuario: '123', 
      nome: 'Test User', 
      email: validEmail,
      tipoUsuario: 'comprador',
      token: 'user-token'
    };

    const mockToken = 'mock-jwt-token';
    const mockLoginResponse = { user: mockUser, token: mockToken };

    test('should validate and return data when login response is valid', async () => {
      // Mock successful axios response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockLoginResponse,
      });

      const result = await login(validEmail, validPassword);

      // Verify the result matches the mock response
      expect(result).toEqual(mockLoginResponse);
      expect(result.user.idUsuario).toBe('123');
      expect(result.user.nome).toBe('Test User');
      expect(result.token).toBe(mockToken);
    });

    test('should throw error when login response is missing required fields', async () => {
      // Mock response with missing required fields
      const invalidResponse = { 
        user: { 
          // Missing idUsuario
          nome: 'Test User', 
          email: validEmail,
          tipoUsuario: 'comprador',
          token: 'user-token'
        }, 
        token: mockToken 
      };

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: invalidResponse,
      });

      // Verify the function throws a validation error
      await expect(login(validEmail, validPassword)).rejects.toThrow('Erro de validação');
    });

    test('should throw error when login credentials are invalid', async () => {
      // Verify the function throws a validation error for invalid email
      await expect(login('invalid-email', validPassword)).rejects.toThrow('Erro de validação');

      // Verify the function throws a validation error for short password
      await expect(login(validEmail, '12345')).rejects.toThrow('Erro de validação');
    });
  });

  // Tests for register function with Zod validation
  describe('register with Zod validation', () => {
    const validUserData = {
      nome: 'New User',
      email: 'newuser@example.com',
      senha: 'password123',
      cpfCnpj: '12345678901',
      tipoUsuario: 'comprador',
    };

    const mockRegisterResponse = { message: 'User registered successfully' };

    test('should validate and return data when registration is successful', async () => {
      // Mock successful axios response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockRegisterResponse,
      });

      const result = await register(validUserData);

      // Verify the result matches the mock response
      expect(result).toEqual(mockRegisterResponse);
      expect(result.message).toBe('User registered successfully');
    });

    test('should throw error when registration data is invalid', async () => {
      const invalidUserData = {
        // Missing nome
        email: 'newuser@example.com',
        senha: 'password123',
        cpfCnpj: '12345678901',
        tipoUsuario: 'comprador',
      };

      // Verify the function throws a validation error
      await expect(register(invalidUserData as any)).rejects.toThrow('Erro de validação');
    });

    test('should throw error when registration response is invalid', async () => {
      // Mock response with missing required fields
      const invalidResponse = {}; // Missing message field

      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: invalidResponse,
      });

      // Verify the function throws a validation error
      await expect(register(validUserData)).rejects.toThrow('Erro de validação');
    });
  });

  // Tests for getProfile function with Zod validation
  describe('getProfile with Zod validation', () => {
    const mockToken = 'valid-token';

    // Valid user object that matches the Zod schema
    const mockUser = { 
      idUsuario: '123', 
      nome: 'Test User', 
      email: 'test@example.com',
      tipoUsuario: 'comprador',
      token: mockToken
    };

    test('should validate and return data when profile response is valid', async () => {
      // Mock successful axios response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockUser,
      });

      const result = await getProfile(mockToken);

      // Verify the result matches the mock response
      expect(result).toEqual(mockUser);
      expect(result.idUsuario).toBe('123');
      expect(result.nome).toBe('Test User');
    });

    test('should throw error when profile response is missing required fields', async () => {
      // Mock response with missing required fields
      const invalidResponse = { 
        // Missing idUsuario
        nome: 'Test User', 
        email: 'test@example.com',
        tipoUsuario: 'comprador',
        token: mockToken
      };

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: invalidResponse,
      });

      // Verify the function throws a validation error
      await expect(getProfile(mockToken)).rejects.toThrow('Erro de validação');
    });

    test('should throw error when token is invalid', async () => {
      // Verify the function throws an error for invalid token
      await expect(getProfile('')).rejects.toThrow('Token inválido');
      await expect(getProfile(null as any)).rejects.toThrow('Token inválido');
    });
  });

  // Tests for updateProfile function with Zod validation
  describe('updateProfile with Zod validation', () => {
    const mockToken = 'valid-token';

    const validProfileData = {
      nome: 'Updated User',
      email: 'updated@example.com',
      telefone: '1234567890'
    };

    const mockUpdateResponse = { 
      message: 'Profile updated successfully',
      user: { 
        idUsuario: '123', 
        nome: 'Updated User', 
        email: 'updated@example.com',
        tipoUsuario: 'comprador',
        token: mockToken,
        telefone: '1234567890'
      }
    };

    test('should validate and return data when profile update is successful', async () => {
      // Mock successful axios response
      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockUpdateResponse,
      });

      const result = await updateProfile(mockToken, validProfileData);

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.user?.nome).toBe('Updated User');
    });

    test('should throw error when profile update data is invalid', async () => {
      const invalidProfileData = {
        email: 'invalid-email', // Invalid email format
        nome: 'Updated User'
      };

      // Verify the function throws a validation error
      await expect(updateProfile(mockToken, invalidProfileData as any)).rejects.toThrow('Erro de validação');
    });

    test('should throw error when profile update response is invalid', async () => {
      // Mock response with missing required fields
      const invalidResponse = {}; // Missing message field

      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: invalidResponse,
      });

      // Verify the function throws a validation error
      await expect(updateProfile(mockToken, validProfileData)).rejects.toThrow('Erro de validação');
    });
  });

  // Tests for deleteAccount function with Zod validation
  describe('deleteAccount with Zod validation', () => {
    const mockToken = 'valid-token';
    const mockDeleteResponse = { message: 'Account deleted successfully' };

    test('should validate and return data when account deletion is successful', async () => {
      // Mock successful axios response
      mockedAxios.delete.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: mockDeleteResponse,
      });

      const result = await deleteAccount(mockToken);

      // Verify the result matches the mock response
      expect(result).toEqual(mockDeleteResponse);
      expect(result.message).toBe('Account deleted successfully');
    });

    test('should throw error when token is invalid', async () => {
      // Verify the function throws an error for invalid token
      await expect(deleteAccount('')).rejects.toThrow('Token inválido');
      await expect(deleteAccount(null as any)).rejects.toThrow('Token inválido');
    });

    test('should throw error when account deletion response is invalid', async () => {
      // Mock response with missing required fields
      const invalidResponse = {}; // Missing message field

      mockedAxios.delete.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: invalidResponse,
      });

      // Verify the function throws a validation error
      await expect(deleteAccount(mockToken)).rejects.toThrow('Erro de validação');
    });
  });
});
