import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import errorMiddleware, { ApiError } from '../errorMiddleware';

describe('Error Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let consoleErrorSpy: jest.SpyInstance;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    
    // Setup request, response, and next function
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Spy on console.error to prevent actual logging during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe('ApiError class', () => {
    it('should create an ApiError with default status 500', () => {
      // Act
      const error = new ApiError('Test error');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.stack).toBeDefined();
      expect(error.errors).toBeUndefined();
    });

    it('should create an ApiError with custom status and errors', () => {
      // Act
      const errors = { field: 'Invalid field' };
      const error = new ApiError('Test error', 400, errors);

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.errors).toEqual(errors);
    });
  });

  describe('Error handling middleware', () => {
    it('should handle ApiError', () => {
      // Arrange
      const error = new ApiError('Custom API error', 400, { field: 'Invalid field' });

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Custom API error',
        status: 400,
        errors: { field: 'Invalid field' }
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Mongoose ValidationError', () => {
      // Arrange
      const error = new mongoose.Error.ValidationError();
      error.errors = {
        field1: { message: 'Field1 is required' } as any,
        field2: { message: 'Field2 is invalid' } as any
      };

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Erro de validação dos dados.',
        status: 400,
        errors: ['Field1 is required', 'Field2 is invalid']
      }));
    });

    it('should handle Mongoose CastError', () => {
      // Arrange
      const error = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'id');

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Formato de dados inválido.',
        status: 400
      }));
    });

    it('should handle MongoDB duplicate key error', () => {
      // Arrange
      const error = { code: 11000, message: 'Duplicate key error' };

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Erro de duplicação de campo único.',
        status: 409
      }));
    });

    it('should handle JsonWebTokenError', () => {
      // Arrange
      const error = new JsonWebTokenError('Invalid token');

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Erro de autenticação.',
        status: 401
      }));
    });

    it('should handle TokenExpiredError', () => {
      // Arrange
      const error = new TokenExpiredError('Token expired', new Date());

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Erro de autenticação.',
        status: 401
      }));
    });

    it('should handle error with status code', () => {
      // Arrange
      const error = { message: 'Not found', status: 404 };

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Not found',
        status: 404
      }));
    });

    it('should handle error with statusCode', () => {
      // Arrange
      const error = { message: 'Bad request', statusCode: 400 };

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Bad request',
        status: 400
      }));
    });

    it('should handle unknown error with default 500 status', () => {
      // Arrange
      const error = new Error('Unknown error');

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Ocorreu um erro interno no servidor.',
        status: 500
      }));
    });

    it('should include stack trace in development mode', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Test stack trace';

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        stack: 'Test stack trace'
      }));
    });

    it('should not include stack trace in production mode', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Test stack trace';

      // Act
      errorMiddleware(error, req as Request, res as Response, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(expect.not.objectContaining({
        stack: expect.anything()
      }));
    });
  });
});