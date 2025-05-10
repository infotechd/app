import { API_URL } from '../../config/api';

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import the functions to test
// We need to import the functions after mocking fetch and axios
jest.mock('../api', () => {
  // Get the original module
  const originalModule = jest.requireActual('../api');
  
  // Return a modified module with exposed internal functions for testing
  return {
    ...originalModule,
    // Expose internal functions for testing
    apiRequest: originalModule.apiRequest,
    buildUrl: originalModule.buildUrl,
    parseResponse: originalModule.parseResponse,
    handleApiError: originalModule.handleApiError,
    checkConnectivity: originalModule.checkConnectivity,
    isTestEnvironment: originalModule.isTestEnvironment,
  };
});

// Import the internal functions for testing
import { 
  apiRequest, 
  buildUrl, 
  parseResponse, 
  handleApiError, 
  checkConnectivity, 
  isTestEnvironment 
} from '../api';

describe('API Client Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock the connectivity check
    mockedAxios.head.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {}
    });
  });

  describe('isTestEnvironment', () => {
    test('should return true in test environment', () => {
      // In Jest, NODE_ENV is set to 'test'
      expect(isTestEnvironment()).toBe(true);
    });
  });

  describe('checkConnectivity', () => {
    test('should skip connectivity check in test environment', async () => {
      await checkConnectivity();
      expect(mockedAxios.head).not.toHaveBeenCalled();
    });

    test('should continue even if connectivity check fails', async () => {
      // Force NODE_ENV to be something other than 'test'
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock a failed connectivity check
      mockedAxios.head.mockRejectedValueOnce(new Error('Network error'));
      
      // Should not throw an error
      await expect(checkConnectivity()).resolves.not.toThrow();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('buildUrl', () => {
    test('should return the base URL when no params are provided', () => {
      const baseUrl = 'https://api.example.com/endpoint';
      expect(buildUrl(baseUrl)).toBe(baseUrl);
    });

    test('should append query parameters to the URL', () => {
      const baseUrl = 'https://api.example.com/endpoint';
      const params = { page: 1, limit: 10 };
      expect(buildUrl(baseUrl, params)).toBe(`${baseUrl}?page=1&limit=10`);
    });

    test('should handle array parameters', () => {
      const baseUrl = 'https://api.example.com/endpoint';
      const params = { categories: ['cat1', 'cat2'] };
      expect(buildUrl(baseUrl, params)).toBe(`${baseUrl}?categories=cat1&categories=cat2`);
    });

    test('should ignore null and undefined parameters', () => {
      const baseUrl = 'https://api.example.com/endpoint';
      const params = { page: 1, filter: null, sort: undefined };
      expect(buildUrl(baseUrl, params)).toBe(`${baseUrl}?page=1`);
    });
  });

  describe('parseResponse', () => {
    test('should parse JSON response', async () => {
      const mockData = { success: true };
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue(mockData),
        text: jest.fn()
      } as unknown as Response;

      const result = await parseResponse(mockResponse);
      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockResponse.text).not.toHaveBeenCalled();
    });

    test('should parse text response', async () => {
      const mockText = 'Hello, world!';
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue(mockText)
      } as unknown as Response;

      const result = await parseResponse(mockResponse);
      expect(result).toEqual(mockText);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.text).toHaveBeenCalled();
    });

    test('should throw error when parsing fails', async () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn()
      } as unknown as Response;

      await expect(parseResponse(mockResponse)).rejects.toThrow('Erro ao processar resposta da API');
    });
  });

  describe('handleApiError', () => {
    test('should throw error with message from API response', async () => {
      const errorMessage = 'Invalid credentials';
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ message: errorMessage })
      } as unknown as Response;

      await expect(handleApiError(mockResponse)).rejects.toThrow(errorMessage);
    });

    test('should throw error with status code when API response has no message', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({})
      } as unknown as Response;

      await expect(handleApiError(mockResponse)).rejects.toThrow('Erro na API: 500 Internal Server Error');
    });

    test('should throw error with status code when API response cannot be parsed', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Response;

      await expect(handleApiError(mockResponse)).rejects.toThrow('Erro na API: 404 Not Found');
    });
  });

  describe('apiRequest', () => {
    test('should make a successful GET request', async () => {
      const mockData = { success: true };
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue(mockData)
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await apiRequest('/endpoint', { method: 'GET' });
      
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/endpoint`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    test('should make a successful POST request with body', async () => {
      const requestBody = { name: 'Test' };
      const mockData = { success: true, id: '123' };
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue(mockData)
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await apiRequest('/endpoint', { 
        method: 'POST',
        body: requestBody
      });
      
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/endpoint`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(requestBody)
        })
      );
      expect(result).toEqual(mockData);
    });

    test('should make a request with authentication token', async () => {
      const token = 'test-token';
      const mockData = { success: true };
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValue(mockData)
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      const result = await apiRequest('/endpoint', { 
        method: 'GET',
        token
      });
      
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/endpoint`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    test('should handle error response', async () => {
      const errorMessage = 'Resource not found';
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({ message: errorMessage })
      };
      mockedFetch.mockResolvedValueOnce(mockResponse as unknown as Response);

      await expect(apiRequest('/endpoint', { method: 'GET' })).rejects.toThrow(errorMessage);
    });
  });
});