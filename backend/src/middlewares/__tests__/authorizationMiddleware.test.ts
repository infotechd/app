import { Request, Response, NextFunction } from 'express';
import { TipoUsuarioEnum } from '../../models/User';
import { 
  checkRole, 
  checkAnyRole, 
  isPrestador, 
  isAdmin, 
  isComprador, 
  isAnunciante, 
  isAdminOrPrestador, 
  isCompradorOrAnunciante 
} from '../authorizationMiddleware';

describe('Authorization Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Setup request, response, and next function
    req = {
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

  describe('checkRole function', () => {
    it('should call next() if user has the required role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ADMIN
      };
      const middleware = checkRole(TipoUsuarioEnum.ADMIN);

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have the required role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      const middleware = checkRole(TipoUsuarioEnum.ADMIN);
      const expectedMessage = `Acesso proibido: Requer privilégios de ${TipoUsuarioEnum.ADMIN}.`;

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });

    it('should return 403 if user is not defined', () => {
      // Arrange
      req.user = undefined;
      const middleware = checkRole(TipoUsuarioEnum.ADMIN);
      const expectedMessage = `Acesso proibido: Requer privilégios de ${TipoUsuarioEnum.ADMIN}.`;

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });

    it('should use custom error message if provided', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      const customMessage = 'Custom error message';
      const middleware = checkRole(TipoUsuarioEnum.ADMIN, customMessage);

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: customMessage });
    });
  });

  describe('checkAnyRole function', () => {
    it('should call next() if user has one of the required roles', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ADMIN
      };
      const middleware = checkAnyRole([TipoUsuarioEnum.ADMIN, TipoUsuarioEnum.PRESTADOR]);

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have any of the required roles', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      const roles = [TipoUsuarioEnum.ADMIN, TipoUsuarioEnum.PRESTADOR];
      const middleware = checkAnyRole(roles);
      const expectedMessage = `Acesso proibido: Requer privilégios de ${roles.join(' ou ')}.`;

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });

    it('should return 403 if user is not defined', () => {
      // Arrange
      req.user = undefined;
      const roles = [TipoUsuarioEnum.ADMIN, TipoUsuarioEnum.PRESTADOR];
      const middleware = checkAnyRole(roles);
      const expectedMessage = `Acesso proibido: Requer privilégios de ${roles.join(' ou ')}.`;

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });

    it('should use custom error message if provided', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      const customMessage = 'Custom error message';
      const middleware = checkAnyRole([TipoUsuarioEnum.ADMIN, TipoUsuarioEnum.PRESTADOR], customMessage);

      // Act
      middleware(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: customMessage });
    });
  });

  describe('Specific middleware functions', () => {
    it('isPrestador should check for PRESTADOR role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      };

      // Act
      isPrestador(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isAdmin should check for ADMIN role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ADMIN
      };

      // Act
      isAdmin(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isComprador should check for COMPRADOR role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Act
      isComprador(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isAnunciante should check for ANUNCIANTE role', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ANUNCIANTE
      };

      // Act
      isAnunciante(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isAdminOrPrestador should check for ADMIN or PRESTADOR role', () => {
      // Test with ADMIN role
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ADMIN
      };
      isAdminOrPrestador(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test with PRESTADOR role
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      };
      isAdminOrPrestador(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isCompradorOrAnunciante should check for COMPRADOR or ANUNCIANTE role', () => {
      // Test with COMPRADOR role
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      isCompradorOrAnunciante(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();

      // Test with ANUNCIANTE role
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ANUNCIANTE
      };
      isCompradorOrAnunciante(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('isAdminOrPrestador should return 403 for non-ADMIN and non-PRESTADOR roles', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      const expectedMessage = 'Acesso proibido: Requer privilégios de Administrador ou Prestador de Serviço.';

      // Act
      isAdminOrPrestador(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });

    it('isCompradorOrAnunciante should return 403 for non-COMPRADOR and non-ANUNCIANTE roles', () => {
      // Arrange
      req.user = {
        userId: 'user-123',
        tipoUsuario: TipoUsuarioEnum.ADMIN
      };
      const expectedMessage = 'Acesso proibido: Requer privilégios de Comprador ou Anunciante.';

      // Act
      isCompradorOrAnunciante(req as Request, res as Response, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: expectedMessage });
    });
  });
});