import { uploadImage } from '../uploadApi';
import { API_URL } from '@/config/api';

// Mock global fetch
global.fetch = jest.fn();

// Type the mocked fetch for better TypeScript support
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('uploadApi', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock console methods to prevent output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('uploadImage', () => {
    const validToken = 'valid-jwt-token';
    const mockFormData = new FormData();
    const mockSuccessResponse = {
      message: 'Image uploaded successfully',
      imageUrl: 'https://example.com/images/uploaded-image.jpg'
    };

    test('should upload image successfully', async () => {
      // Mock successful fetch response
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse)
      } as unknown as Response);

      const result = await uploadImage(validToken, mockFormData);

      // Verify fetch was called with correct parameters
      expect(mockedFetch).toHaveBeenCalledWith(
        `${API_URL}/upload/image`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${validToken}`
          },
          body: mockFormData
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockSuccessResponse);
      
      // Verify console.log was called for success message
      expect(console.log).toHaveBeenCalledWith('=== ENVIANDO IMAGEM ===');
      expect(console.log).toHaveBeenCalledWith('✓ Imagem enviada com sucesso!');
    });

    test('should throw error when token is invalid', async () => {
      // Test with null token
      await expect(uploadImage(null as unknown as string, mockFormData))
        .rejects.toThrow('Token inválido');

      // Test with undefined token
      await expect(uploadImage(undefined as unknown as string, mockFormData))
        .rejects.toThrow('Token inválido');

      // Test with non-string token
      await expect(uploadImage(123 as unknown as string, mockFormData))
        .rejects.toThrow('Token inválido');

      // Verify fetch was not called
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    test('should throw error when API returns error response', async () => {
      const errorMessage = 'Failed to upload image';
      const errorResponse = { message: errorMessage };
      
      // Mock failed fetch response
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce(errorResponse)
      } as unknown as Response);

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, mockFormData))
        .rejects.toThrow(errorMessage);

      // Verify fetch was called
      expect(mockedFetch).toHaveBeenCalled();
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        '=== ERRO AO ENVIAR IMAGEM ===',
        expect.any(Error)
      );
    });

    test('should throw generic error when API returns error without message', async () => {
      // Mock failed fetch response without message
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({})
      } as unknown as Response);

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, mockFormData))
        .rejects.toThrow('Erro ao enviar imagem');

      // Verify fetch was called
      expect(mockedFetch).toHaveBeenCalled();
    });

    test('should throw error when network request fails', async () => {
      const networkError = new Error('Network error');
      
      // Mock network error
      mockedFetch.mockRejectedValueOnce(networkError);

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, mockFormData))
        .rejects.toThrow('Network error');

      // Verify fetch was called
      expect(mockedFetch).toHaveBeenCalled();
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        '=== ERRO AO ENVIAR IMAGEM ===',
        networkError
      );
    });

    test('should throw generic error for unknown error types', async () => {
      // Mock a non-Error rejection
      mockedFetch.mockRejectedValueOnce('Not an Error object');

      // Verify the function throws the expected error
      await expect(uploadImage(validToken, mockFormData))
        .rejects.toThrow('Erro desconhecido ao enviar imagem');

      // Verify fetch was called
      expect(mockedFetch).toHaveBeenCalled();
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        '=== ERRO AO ENVIAR IMAGEM ===',
        'Not an Error object'
      );
    });
  });
});