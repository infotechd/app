import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { IUser, TipoUsuarioEnum } from '../User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('../../config/logger');

// Helper function to create a valid user object
const createValidUserData = () => ({
  nome: 'Test User',
  email: 'test@example.com',
  senha: 'Password123',
  telefone: '11987654321',
  cpfCnpj: '12345678901',
  tipoUsuario: TipoUsuarioEnum.COMPRADOR,
  endereco: 'Test Address',
  foto: 'test-photo.jpg'
});

describe('User Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database and reset mocks between tests
  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = createValidUserData();

      // Mock bcrypt functions for password hashing
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const user = new User(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.nome).toBe(userData.nome);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.telefone).toBe('(11) 98765-4321'); // Should be formatted
      expect(savedUser.cpfCnpj).toBe(userData.cpfCnpj);
      expect(savedUser.tipoUsuario).toBe(userData.tipoUsuario);
      expect(savedUser.endereco).toBe(userData.endereco);
      expect(savedUser.foto).toBe(userData.foto);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should require nome field', async () => {
      // Arrange
      const { nome, ...userData } = createValidUserData();

      // Act & Assert
      const user = new User(userData as any);
      await expect(user.save()).rejects.toThrow(/nome.*obrigatório/);
    });

    it('should require email field', async () => {
      // Arrange
      const { email, ...userData } = createValidUserData();

      // Act & Assert
      const user = new User(userData as any);
      await expect(user.save()).rejects.toThrow(/email.*obrigatório/);
    });

    it('should require senha field', async () => {
      // Arrange
      const { senha, ...userData } = createValidUserData();

      // Act & Assert
      const user = new User(userData as any);
      await expect(user.save()).rejects.toThrow(/senha.*obrigatório/);
    });

    it('should require cpfCnpj field', async () => {
      // Arrange
      const { cpfCnpj, ...userData } = createValidUserData();

      // Act & Assert
      const user = new User(userData as any);
      await expect(user.save()).rejects.toThrow(/cpfCnpj.*obrigatório/);
    });

    it('should require tipoUsuario field', async () => {
      // Arrange
      const { tipoUsuario, ...userData } = createValidUserData();

      // Act & Assert
      const user = new User(userData as any);
      await expect(user.save()).rejects.toThrow(/tipoUsuario.*obrigatório/);
    });

    it('should validate email format', async () => {
      // Arrange
      const userData = createValidUserData();
      userData.email = 'invalid-email';

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/email válido/);
    });

    it('should validate telefone format', async () => {
      // Arrange
      const userData = createValidUserData();
      userData.telefone = '123'; // Too short

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/telefone/);
    });

    it('should validate tipoUsuario enum values', async () => {
      // Arrange
      const userData = createValidUserData();
      userData.tipoUsuario = 'invalid-type' as TipoUsuarioEnum;

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow(/tipo de usuário/);
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const userData1 = createValidUserData();
      const userData2 = createValidUserData(); // Same email

      // Mock bcrypt functions for password hashing
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act & Assert
      await new User(userData1).save();
      await expect(new User(userData2).save()).rejects.toThrow(/duplicate key/);
    });

    it('should enforce unique cpfCnpj constraint', async () => {
      // Arrange
      const userData1 = createValidUserData();
      const userData2 = {
        ...createValidUserData(),
        email: 'another@example.com' // Different email
      };

      // Mock bcrypt functions for password hashing
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act & Assert
      await new User(userData1).save();
      await expect(new User(userData2).save()).rejects.toThrow(/duplicate key/);
    });
  });

  describe('Pre-save Middleware', () => {
    it('should hash password before saving', async () => {
      // Arrange
      const userData = createValidUserData();
      const hashedPassword = 'hashedPassword123';

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.senha, 'salt');
    });

    it('should not hash password if it was not modified', async () => {
      // Arrange
      const userData = createValidUserData();

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const user = new User(userData);
      await user.save();

      // Reset mocks to check if they're called again
      jest.clearAllMocks();

      // Update a field other than password
      user.nome = 'Updated Name';
      await user.save();

      // Assert
      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should format telefone correctly', async () => {
      // Arrange
      const userData = createValidUserData();
      userData.telefone = '11987654321'; // Raw format

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(user.telefone).toBe('(11) 98765-4321'); // Formatted
    });

    // Skip this test for now due to complexity of mocking String.prototype.replace
    it('should format telefone correctly even with special characters', async () => {
      // Arrange
      const userData = createValidUserData();
      userData.telefone = '(11) 98765-4321'; // Already formatted

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const user = new User(userData);
      await user.save();

      // Assert
      expect(user.telefone).toBe('(11) 98765-4321'); // Should remain correctly formatted
    });

    it('should handle password hashing errors gracefully', async () => {
      // Arrange
      const userData = createValidUserData();
      const error = new Error('Hashing error');

      // Mock bcrypt functions to throw an error
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      const user = new User(userData);
      await expect(user.save()).rejects.toThrow('Hashing error');
      expect(logger.error).toHaveBeenCalledWith(
        "Erro ao gerar hash da senha:",
        expect.objectContaining({
          error: error.message,
          stack: expect.any(String)
        })
      );
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for matching password', async () => {
      // Arrange
      const userData = createValidUserData();
      const plainPassword = userData.senha;

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const user = new User(userData);
      await user.save();

      // Need to manually set senha since it's not selected by default
      (user as any).senha = 'hashedPassword';

      const result = await user.comparePassword(plainPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      // Arrange
      const userData = createValidUserData();
      const wrongPassword = 'wrongPassword';

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      const user = new User(userData);
      await user.save();

      // Need to manually set senha since it's not selected by default
      (user as any).senha = 'hashedPassword';

      const result = await user.comparePassword(wrongPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, 'hashedPassword');
      expect(result).toBe(false);
    });

    it('should throw error if senha field is not selected', async () => {
      // Arrange
      const userData = createValidUserData();

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Act
      const user = new User(userData);
      await user.save();

      // Reset mocks to check if they're called
      jest.clearAllMocks();

      // Explicitly set senha to undefined to simulate select: false behavior
      // This is necessary because in tests, the select: false option doesn't work automatically
      (user as any).senha = undefined;

      // Assert
      await expect(user.comparePassword('anyPassword')).rejects.toThrow(
        "Campo 'senha' não carregado para comparação. Use .select('+senha') na query."
      );
      expect(logger.error).toHaveBeenCalledWith(
        "Erro em comparePassword: Campo 'senha' não foi selecionado na query para este usuário."
      );
    });

    it('should handle bcrypt compare errors gracefully', async () => {
      // Arrange
      const userData = createValidUserData();
      const error = new Error('Compare error');

      // Mock bcrypt functions
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (bcrypt.compare as jest.Mock).mockRejectedValue(error);

      // Act
      const user = new User(userData);
      await user.save();

      // Need to manually set senha since it's not selected by default
      (user as any).senha = 'hashedPassword';

      const result = await user.comparePassword('anyPassword');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('anyPassword', 'hashedPassword');
      expect(logger.error).toHaveBeenCalledWith(
        "Erro ao comparar senhas:",
        expect.objectContaining({
          error: error.message,
          stack: expect.any(String)
        })
      );
      expect(result).toBe(false);
    });
  });
});
