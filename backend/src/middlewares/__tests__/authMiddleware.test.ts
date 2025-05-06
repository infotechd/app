import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { DecodedUserToken } from '../../server';
import { TipoUsuarioEnum } from '../../models/User';
import logger from '../../config/logger';
import authMiddleware from '../authMiddleware';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../config/logger');

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env };
    
    // Setup environment variables
    process.env.JWT_SECRET = 'test-secret';

    // Setup request, response, and next function
    req = {
      cookies: {},
      headers: {},
      user: undefined
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });

  describe('Token Extraction', () => {
    it('should extract token from cookie', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken: DecodedUserToken = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        iat: 1234567890,
        exp: 9999999999
      };
      
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to return a valid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(req.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should extract token from Authorization header', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken: DecodedUserToken = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.PRESTADOR,
        iat: 1234567890,
        exp: 9999999999
      };
      
      req.headers = { authorization: `Bearer ${mockToken}` };
      
      // Mock jwt.verify to return a valid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(req.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      // Arrange - no token in cookies or headers
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token não fornecido.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token Verification', () => {
    it('should return 401 if token is invalid', async () => {
      // Arrange
      const mockToken = 'invalid-token';
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to throw an error
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(logger.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token inválido ou expirado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token structure is invalid', async () => {
      // Arrange
      const mockToken = 'token-with-invalid-structure';
      const invalidDecodedToken = { 
        // Missing required fields
        someOtherField: 'value'
      };
      
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to return an invalid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, invalidDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token com estrutura inválida.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw error if JWT_SECRET is not configured', async () => {
      // Arrange
      const mockToken = 'valid-token';
      req.cookies = { token: mockToken };
      
      // Remove JWT_SECRET from environment
      delete process.env.JWT_SECRET;
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token inválido ou expirado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Token Validation', () => {
    it('should validate token with userId and tipoUsuario', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken: DecodedUserToken = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ANUNCIANTE,
        iat: 1234567890,
        exp: 9999999999
      };
      
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to return a valid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(req.user).toEqual(mockDecodedToken);
      expect(next).toHaveBeenCalled();
    });

    it('should reject token with missing userId', async () => {
      // Arrange
      const mockToken = 'token-missing-userId';
      const invalidDecodedToken = { 
        // Missing userId
        tipoUsuario: TipoUsuarioEnum.COMPRADOR,
        iat: 1234567890,
        exp: 9999999999
      };
      
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to return an invalid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, invalidDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token com estrutura inválida.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token with invalid tipoUsuario', async () => {
      // Arrange
      const mockToken = 'token-invalid-tipoUsuario';
      const invalidDecodedToken = { 
        userId: 'user-123',
        tipoUsuario: 'invalid-type', // Not a valid TipoUsuarioEnum value
        iat: 1234567890,
        exp: 9999999999
      };
      
      req.cookies = { token: mockToken };
      
      // Mock jwt.verify to return an invalid decoded token
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, invalidDecodedToken);
      });
      
      // Act
      await authMiddleware(req as Request, res as Response, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso não autorizado: Token com estrutura inválida.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});