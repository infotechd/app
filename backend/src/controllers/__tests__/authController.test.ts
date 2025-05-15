import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as authController from '../authController';
import User, { TipoUsuarioEnum } from '../../models/User';
import Contratacao, { ContratacaoStatusEnum } from '../../models/Contratacao';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('../../models/Contratacao');

describe('Auth Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
      user: undefined,
      cookies: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      nome: 'Test User',
      email: 'test@example.com',
      senha: 'password123',
      telefone: '1234567890',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.COMPRADOR,
      endereco: {
        rua: 'Test Street',
        numero: '123',
        complemento: 'Apt 4',
        bairro: 'Test Neighborhood',
        cidade: 'Test City',
        estado: 'TS',
        cep: '12345-678'
      },
      foto: 'profile.jpg'
    };

    it('should register a new user successfully', async () => {
      // Arrange
      req.body = mockUserData;
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const saveMock = jest.fn().mockResolvedValue(mockUserData);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await authController.register(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ email: mockUserData.email }, { cpfCnpj: mockUserData.cpfCnpj }] });
      expect(User).toHaveBeenCalledWith(mockUserData);
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário cadastrado com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 409 if email already exists', async () => {
      // Arrange
      req.body = mockUserData;
      (User.findOne as jest.Mock).mockResolvedValue({ email: mockUserData.email });

      // Act
      await authController.register(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ email: mockUserData.email }, { cpfCnpj: mockUserData.cpfCnpj }] });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email já cadastrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 409 if cpfCnpj already exists', async () => {
      // Arrange
      req.body = mockUserData;
      (User.findOne as jest.Mock).mockResolvedValue({ cpfCnpj: mockUserData.cpfCnpj });

      // Act
      await authController.register(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ $or: [{ email: mockUserData.email }, { cpfCnpj: mockUserData.cpfCnpj }] });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'CPF/CNPJ já cadastrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.body = mockUserData;
      const error = new Error('Database error');
      (User.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await authController.register(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      senha: 'password123'
    };

    const mockUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      nome: 'Test User',
      email: 'test@example.com',
      senha: 'hashedPassword',
      telefone: '1234567890',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.COMPRADOR,
      endereco: {
        rua: 'Test Street',
        numero: '123',
        complemento: 'Apt 4',
        bairro: 'Test Neighborhood',
        cidade: 'Test City',
        estado: 'TS',
        cep: '12345-678'
      },
      foto: 'profile.jpg',
      comparePassword: jest.fn()
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      req.body = mockCredentials;
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      mockUser.comparePassword.mockResolvedValue(true);

      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      process.env.JWT_SECRET = 'test-secret';

      // Act
      await authController.login(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: mockCredentials.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockCredentials.senha);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser._id, tipoUsuario: mockUser.tipoUsuario },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(res.cookie).toHaveBeenCalledWith('token', mockToken, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login realizado com sucesso.',
        token: mockToken,
        user: expect.objectContaining({
          id: mockUser._id,
          nome: mockUser.nome,
          email: mockUser.email
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      // Arrange
      req.body = mockCredentials;
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await authController.login(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: mockCredentials.email });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      req.body = mockCredentials;
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      mockUser.comparePassword.mockResolvedValue(false);

      // Act
      await authController.login(req as Request, res as Response, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: mockCredentials.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockCredentials.senha);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Credenciais inválidas.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.body = mockCredentials;
      const error = new Error('Database error');
      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await authController.login(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the token cookie and return success message', () => {
      // Act
      authController.logout(req as Request, res as Response, next);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout realizado com sucesso.' });
    });
  });

  describe('editProfile', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUpdateData = {
      nome: 'Updated Name',
      telefone: '9876543210',
      endereco: {
        rua: 'New Street',
        numero: '456',
        bairro: 'New Neighborhood',
        cidade: 'New City',
        estado: 'NS',
        cep: '98765-432'
      },
      foto: 'new-profile.jpg'
    };

    const mockUpdatedUser = {
      _id: userId,
      ...mockUpdateData,
      email: 'test@example.com',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.COMPRADOR
    };

    beforeEach(() => {
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
    });

    it('should update user profile successfully', async () => {
      // Arrange
      req.body = mockUpdateData;
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: mockUpdateData },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Perfil atualizado com sucesso.',
        user: mockUpdatedUser
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should hash password if it is being updated', async () => {
      // Arrange
      const updateWithPassword = { ...mockUpdateData, senha: 'newPassword123' };
      req.body = updateWithPassword;

      const hashedPassword = 'hashedNewPassword';
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 'salt');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { ...mockUpdateData, senha: hashedPassword } },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockUpdateData;

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      req.body = mockUpdateData;
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields provided for update', async () => {
      // Arrange
      req.body = { invalidField: 'value' };

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido.' });
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.body = mockUpdateData;
      const error = new Error('Database error');
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await authController.editProfile(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: userId,
      nome: 'Test User',
      email: 'test@example.com'
    };

    beforeEach(() => {
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
    });

    it('should delete user account successfully when no active contracts', async () => {
      // Arrange
      (Contratacao.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await authController.deleteAccount(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.countDocuments).toHaveBeenCalledWith({
        $or: [
          { buyerId: userId, status: { $in: expect.any(Array) } },
          { prestadorId: userId, status: { $in: expect.any(Array) } }
        ]
      });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conta excluída com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if user has active contracts', async () => {
      // Arrange
      (Contratacao.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await authController.deleteAccount(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.countDocuments).toHaveBeenCalled();
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Não é possível excluir sua conta enquanto você possui contratações ativas. Finalize ou cancele todas as contratações pendentes antes de excluir sua conta.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await authController.deleteAccount(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Contratacao.countDocuments).not.toHaveBeenCalled();
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found for deletion', async () => {
      // Arrange
      (Contratacao.countDocuments as jest.Mock).mockResolvedValue(0);
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await authController.deleteAccount(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.countDocuments).toHaveBeenCalled();
      expect(User.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado para exclusão.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (Contratacao.countDocuments as jest.Mock).mockRejectedValue(error);

      // Act
      await authController.deleteAccount(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listUsers', () => {
    const mockUsers = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        nome: 'User 1',
        email: 'user1@example.com',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        nome: 'User 2',
        email: 'user2@example.com',
        tipoUsuario: TipoUsuarioEnum.PRESTADOR,
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      req.user = { userId: 'admin-id', tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.query = {};
    });

    it('should list users with default pagination when user is admin', async () => {
      // Arrange
      (User.countDocuments as jest.Mock).mockResolvedValue(2);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUsers)
      });

      // Act
      await authController.listUsers(req as Request, res as Response, next);

      // Assert
      expect(User.countDocuments).toHaveBeenCalledWith({});
      expect(User.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: mockUsers,
        pagination: {
          totalUsers: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should list users with custom pagination parameters', async () => {
      // Arrange
      req.query = { page: '2', limit: '5' };
      (User.countDocuments as jest.Mock).mockResolvedValue(12);
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUsers)
      });

      // Act
      await authController.listUsers(req as Request, res as Response, next);

      // Assert
      expect(User.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        users: mockUsers,
        pagination: {
          totalUsers: 12,
          totalPages: 3,
          currentPage: 2,
          itemsPerPage: 5,
          hasNextPage: true,
          hasPrevPage: true
        }
      });
    });

    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await authController.listUsers(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Requer privilégios de administrador.' });
      expect(User.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await authController.listUsers(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Requer privilégios de administrador.' });
      expect(User.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (User.countDocuments as jest.Mock).mockRejectedValue(error);

      // Act
      await authController.listUsers(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: userId,
      nome: 'Test User',
      email: 'test@example.com',
      telefone: '1234567890',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.ANUNCIANTE,
      endereco: {
        rua: 'Test Street',
        numero: '123',
        bairro: 'Test Neighborhood',
        cidade: 'Test City',
        estado: 'TS',
        cep: '12345-678'
      },
      foto: 'profile.jpg'
    };

    beforeEach(() => {
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
    });

    it('should return user profile when authenticated', async () => {
      // Arrange
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Act
      await authController.getProfile(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await authController.getProfile(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(User.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await authController.getProfile(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await authController.getProfile(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: userId,
      nome: 'Test User',
      email: 'old@example.com',
      telefone: '1234567890',
      cpfCnpj: '12345678901',
      tipoUsuario: TipoUsuarioEnum.COMPRADOR,
      comparePassword: jest.fn(),
      save: jest.fn()
    };

    beforeEach(() => {
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = {
        currentPassword: 'password123',
        newEmail: 'new@example.com'
      };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      mockUser.comparePassword.mockResolvedValue(true);
      mockUser.save.mockResolvedValue(mockUser);
    });

    it('should change email successfully when all validations pass', async () => {
      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(mockUser.email).toBe('new@example.com');
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email alterado com sucesso.',
        success: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(User.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.body = { currentPassword: 'password123' }; // Missing newEmail

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Senha atual e novo email são obrigatórios.',
        errorCode: 'EMAIL_CHANGE_MISSING_FIELDS'
      });
      expect(User.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if email format is invalid', async () => {
      // Arrange
      req.body.newEmail = 'invalid-email';

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Formato de email inválido.',
        errorCode: 'EMAIL_CHANGE_INVALID_EMAIL_FORMAT'
      });
      expect(User.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      // Arrange
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      mockUser.comparePassword.mockResolvedValue(false);

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Senha incorreta. Por favor, verifique e tente novamente.',
        errorCode: 'EMAIL_CHANGE_INCORRECT_PASSWORD'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if email is already in use', async () => {
      // Arrange
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'another-user-id' });

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Este email já está em uso por outra conta.',
        errorCode: 'EMAIL_CHANGE_EMAIL_IN_USE'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await authController.changeEmail(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
