import { API_URL } from '../../config/api';
import { 
  login, 
  register, 
  getProfile, 
  updateProfile, 
  deleteAccount,
  fetchTrainings,
  fetchTrainingDetail,
  createTraining
} from '../api';

// Mock the apiRequest function
jest.mock('../api', () => {
  // Get the original module
  const originalModule = jest.requireActual('../api');
  
  // Return a modified module with mocked apiRequest
  return {
    ...originalModule,
    apiRequest: jest.fn(),
    checkConnectivity: jest.fn().mockResolvedValue(undefined)
  };
});

// Import the mocked apiRequest function
import { apiRequest, checkConnectivity } from '../api';
const mockedApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockedCheckConnectivity = checkConnectivity as jest.MockedFunction<typeof checkConnectivity>;

describe('API Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Tests for login function
  describe('login', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'password123';
    const mockUser = { id: '123', name: 'Test User', email: validEmail };
    const mockToken = 'mock-jwt-token';
    const mockLoginResponse = { user: mockUser, token: mockToken };

    test('should return user data and token when login is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockLoginResponse);

      const result = await login(validEmail, validPassword);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: { email: validEmail, senha: validPassword }
        })
      );

      // Verify connectivity check was called
      expect(mockedCheckConnectivity).toHaveBeenCalled();

      // Verify the result matches the mock response
      expect(result).toEqual(mockLoginResponse);
    });

    test('should throw error when login fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Invalid credentials';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(login(validEmail, 'wrong-password')).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is missing user or token', async () => {
      // Mock incomplete response
      mockedApiRequest.mockResolvedValueOnce({ user: mockUser }); // Missing token

      // Verify the function throws the expected error
      await expect(login(validEmail, validPassword)).rejects.toThrow('Resposta da API inválida após login');
    });
  });

  // Tests for register function
  describe('register', () => {
    const validUserData = {
      nome: 'New User',
      email: 'newuser@example.com',
      senha: 'password123',
      tipoUsuario: 'provider',
      cpfCnpj: '12345678901'
    };
    const mockRegisterResponse = { message: 'User registered successfully' };

    test('should return success message when registration is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockRegisterResponse);

      const result = await register(validUserData);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: validUserData
        })
      );

      // Verify connectivity check was called
      expect(mockedCheckConnectivity).toHaveBeenCalled();

      // Verify the result matches the mock response
      expect(result).toEqual(mockRegisterResponse);
    });

    test('should throw error when registration fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Email already in use';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(register(validUserData)).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is missing message', async () => {
      // Mock incomplete response
      mockedApiRequest.mockResolvedValueOnce({}); // Missing message

      // Verify the function throws the expected error
      await expect(register(validUserData)).rejects.toThrow('Resposta da API inválida após registro');
    });
  });

  // Tests for getProfile function
  describe('getProfile', () => {
    const validToken = 'valid-jwt-token';
    const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };

    test('should return user profile when token is valid', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockUser);

      const result = await getProfile(validToken);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          method: 'GET',
          token: validToken
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUser);
    });

    test('should throw error when token is invalid', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Invalid or expired token';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(getProfile('invalid-token')).rejects.toThrow(errorMessage);
    });
  });

  // Tests for updateProfile function
  describe('updateProfile', () => {
    const validToken = 'valid-jwt-token';
    const validProfileData = {
      nome: 'Updated Name',
      bio: 'Updated bio information',
    };
    const mockUpdateResponse = { message: 'Profile updated successfully' };

    test('should return success message when profile update is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockUpdateResponse);

      const result = await updateProfile(validToken, validProfileData);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          method: 'PUT',
          token: validToken,
          body: validProfileData
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockUpdateResponse);
    });

    test('should throw error when profile update fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Invalid data provided';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(updateProfile(validToken, validProfileData)).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is missing message', async () => {
      // Mock incomplete response
      mockedApiRequest.mockResolvedValueOnce({}); // Missing message

      // Verify the function throws the expected error
      await expect(updateProfile(validToken, validProfileData)).rejects.toThrow('Resposta da API inválida após atualizar perfil');
    });
  });

  // Tests for deleteAccount function
  describe('deleteAccount', () => {
    const validToken = 'valid-jwt-token';
    const mockDeleteResponse = { message: 'Account deleted successfully' };

    test('should return success message when account deletion is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockDeleteResponse);

      const result = await deleteAccount(validToken);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/auth/profile',
        expect.objectContaining({
          method: 'DELETE',
          token: validToken
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockDeleteResponse);
    });

    test('should throw error when account deletion fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Unauthorized action';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(deleteAccount('invalid-token')).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is missing message', async () => {
      // Mock incomplete response
      mockedApiRequest.mockResolvedValueOnce({}); // Missing message

      // Verify the function throws the expected error
      await expect(deleteAccount(validToken)).rejects.toThrow('Resposta da API inválida após excluir conta');
    });
  });

  // Tests for fetchTrainings function
  describe('fetchTrainings', () => {
    const mockTrainings = [
      { id: '1', title: 'Training 1', description: 'Description 1' },
      { id: '2', title: 'Training 2', description: 'Description 2' }
    ];
    const mockResponse = { trainings: mockTrainings };

    test('should return trainings when fetch is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockResponse);

      const result = await fetchTrainings();

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/treinamentos',
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    test('should throw error when fetch fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Failed to fetch trainings';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(fetchTrainings()).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is invalid', async () => {
      // Mock invalid response
      mockedApiRequest.mockResolvedValueOnce({ trainings: null }); // Invalid trainings

      // Verify the function throws the expected error
      await expect(fetchTrainings()).rejects.toThrow('Resposta inválida da API ao buscar treinamentos');
    });
  });

  // Tests for fetchTrainingDetail function
  describe('fetchTrainingDetail', () => {
    const trainingId = '1';
    const mockTraining = { id: trainingId, title: 'Training 1', description: 'Description 1' };
    const mockResponse = { treinamento: mockTraining };

    test('should return training details when fetch is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockResponse);

      const result = await fetchTrainingDetail(trainingId);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        `/treinamentos/${trainingId}`,
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    test('should throw error when fetch fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Training not found';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(fetchTrainingDetail(trainingId)).rejects.toThrow(errorMessage);
    });

    test('should throw error when ID is missing', async () => {
      // Verify the function throws the expected error
      await expect(fetchTrainingDetail('')).rejects.toThrow('ID do treinamento é obrigatório');
    });

    test('should throw error when response is invalid', async () => {
      // Mock invalid response
      mockedApiRequest.mockResolvedValueOnce({ treinamento: null }); // Invalid treinamento

      // Verify the function throws the expected error
      await expect(fetchTrainingDetail(trainingId)).rejects.toThrow('Resposta inválida da API ao buscar detalhes do treinamento');
    });
  });

  // Tests for createTraining function
  describe('createTraining', () => {
    const validToken = 'valid-jwt-token';
    const trainingData = {
      title: 'New Training',
      description: 'Training Description',
      price: 100,
      duration: 60
    };
    const mockResponse = { message: 'Training created successfully', trainingId: '3' };

    test('should return success message when training creation is successful', async () => {
      // Mock successful apiRequest response
      mockedApiRequest.mockResolvedValueOnce(mockResponse);

      const result = await createTraining(validToken, trainingData);

      // Verify apiRequest was called with correct parameters
      expect(mockedApiRequest).toHaveBeenCalledWith(
        '/treinamentos',
        expect.objectContaining({
          method: 'POST',
          token: validToken,
          body: trainingData
        })
      );

      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    test('should throw error when training creation fails', async () => {
      // Mock failed apiRequest response
      const errorMessage = 'Invalid training data';
      mockedApiRequest.mockRejectedValueOnce(new Error(errorMessage));

      // Verify the function throws the expected error
      await expect(createTraining(validToken, trainingData)).rejects.toThrow(errorMessage);
    });

    test('should throw error when response is missing message', async () => {
      // Mock incomplete response
      mockedApiRequest.mockResolvedValueOnce({}); // Missing message

      // Verify the function throws the expected error
      await expect(createTraining(validToken, trainingData)).rejects.toThrow('Resposta inválida da API após criar treinamento');
    });
  });
});