import { updateNome, updateTelefone, updateEndereco } from '../updateFieldApi';
import { updateProfile } from '../api';

// Mock the updateProfile function
jest.mock('../api', () => {
  // Get the original module
  const originalModule = jest.requireActual('../api');
  
  // Return a modified module with mocked updateProfile
  return {
    ...originalModule,
    updateProfile: jest.fn()
  };
});

// Import the mocked updateProfile function
const mockedUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

describe('updateFieldApi', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Tests for updateNome function
  describe('updateNome', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validNome = 'Novo Nome';
    const mockUpdateResponse = { message: 'Profile updated successfully' };

    test('should call updateProfile with correct parameters when userId has idUsuario', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);

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
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should call updateProfile with correct parameters when userId has id', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const userIdWithId = { id: '456' };

      const result = await updateNome(validToken, userIdWithId, validNome);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: userIdWithId.id,
          nome: validNome
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should create fallback ID when userId has no idUsuario or id', async () => {
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

      // Verify console.log was called for fallback ID creation
      expect(console.log).toHaveBeenCalledWith(
        '[updateFieldApi] Adding fallback ID for updateNome'
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when updateProfile fails', async () => {
      // Mock failed updateProfile response
      const errorMessage = 'Failed to update profile';
      mockedUpdateProfile.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(updateNome(validToken, validUserId, validNome)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateTelefone function
  describe('updateTelefone', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validTelefone = '(11) 98765-4321';
    const mockUpdateResponse = { message: 'Profile updated successfully' };

    test('should call updateProfile with correct parameters when userId has idUsuario', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);

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
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should call updateProfile with correct parameters when userId has id', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const userIdWithId = { id: '456' };

      const result = await updateTelefone(validToken, userIdWithId, validTelefone);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: userIdWithId.id,
          telefone: validTelefone
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should create fallback ID when userId has no idUsuario or id', async () => {
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

      // Verify console.log was called for fallback ID creation
      expect(console.log).toHaveBeenCalledWith(
        '[updateFieldApi] Adding fallback ID for updateTelefone'
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when updateProfile fails', async () => {
      // Mock failed updateProfile response
      const errorMessage = 'Failed to update profile';
      mockedUpdateProfile.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(updateTelefone(validToken, validUserId, validTelefone)).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateEndereco function
  describe('updateEndereco', () => {
    const validToken = 'valid-jwt-token';
    const validUserId = { idUsuario: '123' };
    const validEndereco = 'Rua Exemplo, 123';
    const mockUpdateResponse = { message: 'Profile updated successfully' };

    test('should call updateProfile with correct parameters when userId has idUsuario', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);

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
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should call updateProfile with correct parameters when userId has id', async () => {
      // Mock successful updateProfile response
      mockedUpdateProfile.mockResolvedValueOnce(mockUpdateResponse);
      const userIdWithId = { id: '456' };

      const result = await updateEndereco(validToken, userIdWithId, validEndereco);

      // Verify updateProfile was called with correct parameters
      expect(mockedUpdateProfile).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({
          id: userIdWithId.id,
          endereco: validEndereco
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should create fallback ID when userId has no idUsuario or id', async () => {
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

      // Verify console.log was called for fallback ID creation
      expect(console.log).toHaveBeenCalledWith(
        '[updateFieldApi] Adding fallback ID for updateEndereco'
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when updateProfile fails', async () => {
      // Mock failed updateProfile response
      const errorMessage = 'Failed to update profile';
      mockedUpdateProfile.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(updateEndereco(validToken, validUserId, validEndereco)).rejects.toThrow(errorMessage);
    });
  });
});