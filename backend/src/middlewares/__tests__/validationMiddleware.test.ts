import { Request, Response, NextFunction } from 'express';
import { 
  validateRequest, 
  registerValidation, 
  loginValidation, 
  editProfileValidation 
} from '../validationMiddleware';
import { TipoUsuarioEnum } from '../../models/User';

// Mock express-validator
jest.mock('express-validator', () => {
  // Create a self-returning mock function
  const createMockFunction = () => {
    const fn = jest.fn();
    fn.mockReturnValue(fn);
    return fn;
  };

  // Create a validator chain mock that returns itself for method chaining
  const validatorChain = createMockFunction();

  // Add all the methods we need
  validatorChain.withMessage = createMockFunction();
  validatorChain.notEmpty = createMockFunction();
  validatorChain.isString = createMockFunction();
  validatorChain.isLength = createMockFunction();
  validatorChain.isEmail = createMockFunction();
  validatorChain.normalizeEmail = createMockFunction();
  validatorChain.matches = createMockFunction();
  validatorChain.isMobilePhone = createMockFunction();
  validatorChain.isIn = createMockFunction();
  validatorChain.isObject = createMockFunction();
  validatorChain.optional = createMockFunction();
  validatorChain.custom = createMockFunction();

  return {
    body: jest.fn().mockReturnValue(validatorChain),
    validationResult: jest.fn()
  };
});

import { validationResult, ValidationError } from 'express-validator';

// Create a mock for validationResult
const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

// Helper function to create a mock validation result
const createMockValidationResult = (isEmpty: boolean, errors: any[] = []) => {
  const result = {
    isEmpty: () => isEmpty,
    array: () => errors,
    // Add other required properties to match Result<ValidationError> interface
    formatter: jest.fn(),
    errors: errors,
    mapped: jest.fn(),
    formatWith: jest.fn(),
    throw: jest.fn()
  };
  return result as unknown as ReturnType<typeof validationResult>;
};

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Setup request, response, and next function
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('validateRequest function', () => {
    it('should call next() if there are no validation errors', () => {
      // Arrange
      mockValidationResult.mockReturnValue(createMockValidationResult(true));

      // Act
      validateRequest(req as Request, res as Response, next);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 400 with errors if there are validation errors', () => {
      // Arrange
      const mockErrors = [
        { param: 'email', msg: 'Email is required' },
        { param: 'password', msg: 'Password is required' }
      ];

      mockValidationResult.mockReturnValue(createMockValidationResult(false, mockErrors));

      // Act
      validateRequest(req as Request, res as Response, next);

      // Assert
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });
  });

  describe('Validation Rules', () => {
    // Test that validation rules are defined correctly
    it('should define registerValidation rules', () => {
      expect(registerValidation).toBeDefined();
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(registerValidation.length).toBeGreaterThan(0);
      expect(registerValidation[registerValidation.length - 1]).toBe(validateRequest);
    });

    it('should define loginValidation rules', () => {
      expect(loginValidation).toBeDefined();
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBeGreaterThan(0);
      expect(loginValidation[loginValidation.length - 1]).toBe(validateRequest);
    });

    it('should define editProfileValidation rules', () => {
      expect(editProfileValidation).toBeDefined();
      expect(Array.isArray(editProfileValidation)).toBe(true);
      expect(editProfileValidation.length).toBeGreaterThan(0);
      expect(editProfileValidation[editProfileValidation.length - 1]).toBe(validateRequest);
    });
  });

  // Integration tests for validation rules
  describe('Register Validation Integration', () => {
    it('should validate a valid registration request', async () => {
      // Arrange
      req.body = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'Password123',
        cpfCnpj: '12345678901',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Mock validationResult to return no errors
      mockValidationResult.mockReturnValue(createMockValidationResult(true));

      // Act - Execute all middleware in the chain
      for (const middleware of registerValidation) {
        await middleware(req as Request, res as Response, next);
      }

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject an invalid registration request', async () => {
      // Arrange
      req.body = {
        // Missing required fields
        email: 'invalid-email',
        senha: 'weak'
      };

      // Mock validationResult to return errors
      const mockErrors = [
        { param: 'nome', msg: 'Nome é obrigatório' },
        { param: 'email', msg: 'Email inválido' },
        { param: 'senha', msg: 'Senha deve ter pelo menos 6 caracteres' },
        { param: 'cpfCnpj', msg: 'CPF/CNPJ é obrigatório' },
        { param: 'tipoUsuario', msg: 'Tipo de usuário é obrigatório' }
      ];

      mockValidationResult.mockReturnValue(createMockValidationResult(false, mockErrors));

      // Act - Execute the last middleware (validateRequest)
      await registerValidation[registerValidation.length - 1](req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });
  });

  describe('Login Validation Integration', () => {
    it('should validate a valid login request', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        senha: 'Password123'
      };

      // Mock validationResult to return no errors
      mockValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Act - Execute all middleware in the chain
      for (const middleware of loginValidation) {
        await middleware(req as Request, res as Response, next);
      }

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject an invalid login request', async () => {
      // Arrange
      req.body = {
        // Missing senha
        email: 'invalid-email'
      };

      // Mock validationResult to return errors
      const mockErrors = [
        { param: 'email', msg: 'Email inválido' },
        { param: 'senha', msg: 'Senha é obrigatória' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      // Act - Execute the last middleware (validateRequest)
      await loginValidation[loginValidation.length - 1](req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });
  });

  describe('Edit Profile Validation Integration', () => {
    it('should validate a valid edit profile request', async () => {
      // Arrange
      req.body = {
        nome: 'Updated Name',
        telefone: '11987654321',
        endereco: { cidade: 'São Paulo', estado: 'SP' },
        foto: 'https://example.com/photo.jpg'
      };

      // Mock validationResult to return no errors
      mockValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => []
      });

      // Act - Execute all middleware in the chain
      for (const middleware of editProfileValidation) {
        await middleware(req as Request, res as Response, next);
      }

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject an invalid edit profile request', async () => {
      // Arrange
      req.body = {
        nome: 'A', // Too short
        telefone: 'invalid-phone',
        endereco: 'not-an-object',
        senha: 'weak' // Too weak
      };

      // Mock validationResult to return errors
      const mockErrors = [
        { param: 'nome', msg: 'Nome deve ter pelo menos 3 caracteres' },
        { param: 'telefone', msg: 'Telefone inválido' },
        { param: 'endereco', msg: 'Endereço deve ser um objeto' },
        { param: 'senha', msg: 'Senha deve ter pelo menos 6 caracteres' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      // Act - Execute the last middleware (validateRequest)
      await editProfileValidation[editProfileValidation.length - 1](req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: mockErrors });
    });
  });
});
