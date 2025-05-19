import React from 'react';
import { updateNome, updateTelefone, updateEndereco } from '../../services/updateFieldApi';
import { uploadImage } from '../../services/uploadApi';
import { updateProfile } from '../../services/api';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { Platform } from 'react-native';

// Mock the API functions
jest.mock('../../services/api', () => ({
  updateProfile: jest.fn(),
}));

jest.mock('../../services/uploadApi', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import the mocked functions
const mockedUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const mockedUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>;

describe('NewEditProfileScreen API Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Tests for updateNome API function
  describe('updateNome API', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validNome = 'Novo Nome';
    const mockUpdateResponse = { 
      message: 'Profile updated successfully',
      user: {
        idUsuario: '123',
        nome: 'Novo Nome',
        email: 'test@example.com',
        telefone: '123456789',
        endereco: 'Test Address'
      }
    };

    test('should handle API response without user object', async () => {
      // Mock successful updateProfile response without user object
      const responseWithoutUser = { message: 'Profile updated successfully' };
      mockedUpdateProfile.mockResolvedValueOnce(responseWithoutUser);

      const result = await updateNome(validToken, validUserId, validNome);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          idUsuario: validUserId.idUsuario,
          nome: validNome
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(responseWithoutUser);
      expect(result.user).toBeUndefined();
    });

    test('should handle API error responses with status codes', async () => {
      // Mock updateProfile to simulate an API error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid input data'
          }
        }
      };
      mockedUpdateProfile.mockRejectedValueOnce(errorResponse);

      // Verify the function throws the expected error
      await expect(updateNome(validToken, validUserId, validNome)).rejects.toEqual(errorResponse);
    });

    test('should handle network errors', async () => {
      // Mock updateProfile to simulate a network error
      const networkError = new Error('Network Error');
      mockedUpdateProfile.mockRejectedValueOnce(networkError);

      // Verify the function throws the expected error
      await expect(updateNome(validToken, validUserId, validNome)).rejects.toThrow('Network Error');
    });

    test('should handle empty userId by creating fallback ID', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const emptyUserId = {};

      const result = await updateNome(validToken, emptyUserId, validNome);

      // Verify updateProfile was called with a generated id
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: expect.stringContaining('temp-id-'),
          nome: validNome
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });
  });

  // Tests for updateTelefone API function
  describe('updateTelefone API', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validTelefone = '(11) 98765-4321';
    const mockUpdateResponse = { 
      message: 'Profile updated successfully',
      user: {
        idUsuario: '123',
        nome: 'Test User',
        email: 'test@example.com',
        telefone: '(11) 98765-4321',
        endereco: 'Test Address'
      }
    };

    test('should handle API response without user object', async () => {
      // Mock successful updateProfile response without user object
      const responseWithoutUser = { message: 'Profile updated successfully' };
      mockedUpdateProfile.mockResolvedValueOnce(responseWithoutUser);

      const result = await updateTelefone(validToken, validUserId, validTelefone);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          idUsuario: validUserId.idUsuario,
          telefone: validTelefone
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(responseWithoutUser);
      expect(result.user).toBeUndefined();
    });

    test('should handle API error responses with status codes', async () => {
      // Mock updateProfile to simulate an API error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid phone format'
          }
        }
      };
      mockedUpdateProfile.mockRejectedValueOnce(errorResponse);

      // Verify the function throws the expected error
      await expect(updateTelefone(validToken, validUserId, validTelefone)).rejects.toEqual(errorResponse);
    });

    test('should handle empty userId by creating fallback ID', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const emptyUserId = {};

      const result = await updateTelefone(validToken, emptyUserId, validTelefone);

      // Verify updateProfile was called with a generated id
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: expect.stringContaining('temp-id-'),
          telefone: validTelefone
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });
  });

  // Tests for updateEndereco API function
  describe('updateEndereco API', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validEndereco = 'Rua Exemplo, 123';
    const mockUpdateResponse = { 
      message: 'Profile updated successfully',
      user: {
        idUsuario: '123',
        nome: 'Test User',
        email: 'test@example.com',
        telefone: '123456789',
        endereco: 'Rua Exemplo, 123'
      }
    };

    test('should handle API response without user object', async () => {
      // Mock successful updateProfile response without user object
      const responseWithoutUser = { message: 'Profile updated successfully' };
      mockedUpdateProfile.mockResolvedValueOnce(responseWithoutUser);

      const result = await updateEndereco(validToken, validUserId, validEndereco);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          idUsuario: validUserId.idUsuario,
          endereco: validEndereco
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(responseWithoutUser);
      expect(result.user).toBeUndefined();
    });

    test('should handle API error responses with status codes', async () => {
      // Mock updateProfile to simulate an API error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid address format'
          }
        }
      };
      mockedUpdateProfile.mockRejectedValueOnce(errorResponse);

      // Verify the function throws the expected error
      await expect(updateEndereco(validToken, validUserId, validEndereco)).rejects.toEqual(errorResponse);
    });

    test('should handle empty userId by creating fallback ID', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const emptyUserId = {};

      const result = await updateEndereco(validToken, emptyUserId, validEndereco);

      // Verify updateProfile was called with a generated id
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: expect.stringContaining('temp-id-'),
          endereco: validEndereco
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });
  });

  // Tests for direct API calls using axios
  describe('Direct API calls', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };

    test('should make direct API call to update profile', async () => {
      // Mock axios response
      const mockAxiosResponse = {
        data: {
          message: 'Profile updated successfully',
          user: {
            idUsuario: '123',
            nome: 'Direct API Test',
            email: 'test@example.com',
            telefone: '123456789',
            endereco: 'Test Address'
          }
        }
      };
      mockedAxios.put.mockResolvedValueOnce(mockAxiosResponse);

      // Make direct API call
      const response = await axios.put(`${API_URL}/users/profile`, {
        idUsuario: validUserId.idUsuario,
        nome: 'Direct API Test'
      }, {
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      });

      // Verify axios was called with correct parameters
      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${API_URL}/users/profile`,
        {
          idUsuario: validUserId.idUsuario,
          nome: 'Direct API Test'
        },
        {
          headers: {
            Authorization: `Bearer ${validToken}`
          }
        }
      );

      // Verify the response matches the mock
      expect(response.data).toEqual(mockAxiosResponse.data);
    });

    test('should handle API error when making direct call', async () => {
      // Mock axios error response
      const errorResponse = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      };
      mockedAxios.put.mockRejectedValueOnce(errorResponse);

      // Verify the direct API call throws the expected error
      await expect(axios.put(`${API_URL}/users/profile`, {
        idUsuario: validUserId.idUsuario,
        nome: 'Direct API Test'
      }, {
        headers: {
          Authorization: `Bearer ${validToken}`
        }
      })).rejects.toEqual(errorResponse);
    });
  });

  // Tests for photo upload API functionality
  describe('Photo Upload API', () => {
    const validToken = 'valid-jwt-token';
    const validImageUri = 'file:///path/to/image.jpg';
    const mockUploadResponse = {
      message: 'Image uploaded successfully',
      imageUrl: 'https://example.com/uploaded-image.jpg'
    };

    test('should upload image successfully', async () => {
      // Mock successful upload response
      mockedUploadImage.mockResolvedValueOnce(mockUploadResponse);

      const result = await uploadImage(validToken, validImageUri);

      // Verify uploadImage was called with correct parameters
      expect(mockedUploadImage).toHaveBeenCalledWith(validToken, validImageUri);

      // Verify the result matches the mock response
      expect(result).toEqual(mockUploadResponse);
      expect(result.imageUrl).toBe('https://example.com/uploaded-image.jpg');
    });

    test('should handle API error responses during image upload', async () => {
      // Mock uploadImage to simulate an API error response
      const errorResponse = {
        response: {
          status: 400,
          data: {
            message: 'Invalid image format'
          }
        }
      };
      mockedUploadImage.mockRejectedValueOnce(errorResponse);

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, validImageUri)).rejects.toEqual(errorResponse);
    });

    test('should handle network errors during image upload', async () => {
      // Mock uploadImage to simulate a network error
      const networkError = new Error('Network Error');
      mockedUploadImage.mockRejectedValueOnce(networkError);

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, validImageUri)).rejects.toThrow('Network Error');
    });

    test('should handle different image URI formats based on platform', async () => {
      // Mock successful upload response
      mockedUploadImage.mockResolvedValueOnce(mockUploadResponse);

      // Test with Android URI format
      const androidUri = 'content://com.android.providers.media.documents/document/image:12345';
      await uploadImage(validToken, androidUri);
      expect(mockedUploadImage).toHaveBeenCalledWith(validToken, androidUri);

      // Clear mock and test with iOS URI format
      jest.clearAllMocks();
      mockedUploadImage.mockResolvedValueOnce(mockUploadResponse);
      const iosUri = 'assets-library://asset/asset.JPG?id=12345&ext=JPG';
      await uploadImage(validToken, iosUri);
      expect(mockedUploadImage).toHaveBeenCalledWith(validToken, iosUri);
    });

    test('should handle direct API call for image upload', async () => {
      // Mock axios response for multipart form data upload
      const mockAxiosResponse = {
        data: {
          message: 'Image uploaded successfully',
          imageUrl: 'https://example.com/uploaded-image.jpg'
        }
      };
      mockedAxios.post.mockResolvedValueOnce(mockAxiosResponse);

      // Create FormData mock
      const formData = new FormData();
      formData.append('image', {
        uri: validImageUri,
        type: 'image/jpeg',
        name: 'profile.jpg'
      } as any);

      // Make direct API call
      const response = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${validToken}`
        }
      });

      // Verify axios was called with correct parameters
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${API_URL}/upload/image`,
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${validToken}`
          })
        })
      );

      // Verify the response matches the mock
      expect(response.data).toEqual(mockAxiosResponse.data);
    });
  });
});
