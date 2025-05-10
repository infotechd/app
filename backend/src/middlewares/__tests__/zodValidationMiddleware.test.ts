import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../zodValidationMiddleware';
import { createUserSchema, loginUserSchema, updateUserSchema } from '../../schemas/userSchema';
import { TipoUsuarioEnum } from '../../models/User';

describe('Zod Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Setup request, response, and next function
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    // Create a simple test schema
    const testSchema = z.object({
      name: z.string().min(3),
      age: z.number().min(18)
    });

    it('should call next() if validation passes', async () => {
      // Arrange
      req.body = {
        name: 'Test User',
        age: 25
      };

      const middleware = validate(testSchema);

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      // Check that the data was validated and transformed
      expect(req.body).toEqual({
        name: 'Test User',
        age: 25
      });
    });

    it('should return 400 with errors if validation fails', async () => {
      // Arrange
      req.body = {
        name: 'Te', // Too short
        age: 16 // Too young
      };

      const middleware = validate(testSchema);

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Erro de validação',
          errors: expect.arrayContaining([
            expect.objectContaining({
              path: 'name',
              message: expect.any(String)
            }),
            expect.objectContaining({
              path: 'age',
              message: expect.any(String)
            })
          ])
        })
      );
    });

    it('should validate query parameters when source is "query"', async () => {
      // Arrange
      req.query = {
        name: 'Test User',
        age: '25' // Query params are strings
      };

      // Schema that handles string conversion
      const querySchema = z.object({
        name: z.string().min(3),
        age: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(18))
      });

      const middleware = validate(querySchema, 'query');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({
        name: 'Test User',
        age: 25 // Transformed to number
      });
    });

    it('should validate route parameters when source is "params"', async () => {
      // Arrange
      req.params = {
        id: '123456789012345678901234' // Valid MongoDB ID
      };

      // Schema for route params
      const paramsSchema = z.object({
        id: z.string().refine(val => /^[0-9a-fA-F]{24}$/.test(val), {
          message: 'Invalid ID format'
        })
      });

      const middleware = validate(paramsSchema, 'params');

      // Act
      await middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
    });
  });

  describe('User Schema Validation', () => {
    describe('createUserSchema', () => {
      it('should validate a valid user creation request', async () => {
        // Arrange
        req.body = {
          nome: 'Test User',
          email: 'test@example.com',
          senha: 'Password123',
          cpfCnpj: '12345678901',
          tipoUsuario: TipoUsuarioEnum.COMPRADOR
        };

        const middleware = validate(createUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
      });

      it('should reject an invalid user creation request', async () => {
        // Arrange
        req.body = {
          nome: 'Te', // Too short
          email: 'invalid-email',
          senha: 'weak', // Too weak
          cpfCnpj: '123', // Invalid format
          tipoUsuario: 'invalid-type' // Invalid enum value
        };

        const middleware = validate(createUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            message: 'Erro de validação',
            errors: expect.arrayContaining([
              expect.objectContaining({ path: expect.any(String) })
            ])
          })
        );
      });
    });

    describe('loginUserSchema', () => {
      it('should validate a valid login request', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          senha: 'Password123'
        };

        const middleware = validate(loginUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
      });

      it('should reject an invalid login request', async () => {
        // Arrange
        req.body = {
          email: 'invalid-email',
          senha: '' // Empty password
        };

        const middleware = validate(loginUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('updateUserSchema', () => {
      it('should validate a valid user update request', async () => {
        // Arrange
        req.body = {
          nome: 'Updated Name',
          telefone: '11987654321',
          endereco: 'Rua Exemplo, 123',
          foto: 'https://example.com/photo.jpg'
        };

        const middleware = validate(updateUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
      });

      it('should allow partial updates', async () => {
        // Arrange - Only updating name
        req.body = {
          nome: 'Updated Name Only'
        };

        const middleware = validate(updateUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).toHaveBeenCalled();
      });

      it('should reject an invalid user update request', async () => {
        // Arrange
        req.body = {
          nome: 'A', // Too short
          telefone: 'invalid-phone',
          senha: 'weak' // Too weak
        };

        const middleware = validate(updateUserSchema);

        // Act
        await middleware(req as Request, res as Response, next);

        // Assert
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });
  });
});