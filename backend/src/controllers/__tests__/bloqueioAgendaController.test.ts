import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as bloqueioAgendaController from '../bloqueioAgendaController';
import BloqueioAgenda, { IBloqueioAgenda } from '../../models/BloqueioAgenda';
import { TipoUsuarioEnum } from '../../models/User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../models/BloqueioAgenda');
jest.mock('../../config/logger');

describe('BloqueioAgenda Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
      user: undefined,
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('criarBloqueio', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    const motivo = 'Compromisso pessoal';

    const mockBloqueioData = {
      dataInicio,
      dataFim,
      motivo
    };

    it('should create a new time block successfully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockBloqueioData;

      const saveMock = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId,
        dataInicio,
        dataFim,
        motivo
      });

      (BloqueioAgenda as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(BloqueioAgenda).toHaveBeenCalledWith({
        prestadorId,
        dataInicio,
        dataFim,
        motivo: motivo
      });
      expect(saveMock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Bloqueio de agenda criado com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockBloqueioData;

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(BloqueioAgenda).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = { motivo: 'Apenas motivo' }; // Missing dataInicio and dataFim

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Data de início e Data de fim são obrigatórias.' });
      expect(BloqueioAgenda).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if date format is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = {
        dataInicio: 'invalid-date',
        dataFim: dataFim,
        motivo
      };

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Formato de data inválido.' });
      expect(BloqueioAgenda).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if end date is before start date', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = {
        dataInicio: dataFim, // Swapped
        dataFim: dataInicio, // Swapped
        motivo
      };

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'A data de fim deve ser igual ou posterior à data de início.' });
      expect(BloqueioAgenda).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle validation errors from mongoose', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockBloqueioData;

      const validationError = new Error('Validation error') as any;
      validationError.name = 'ValidationError';
      validationError.errors = { dataInicio: { message: 'Data de início inválida' } };

      (BloqueioAgenda as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(validationError)
      }));

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Erro de validação'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockBloqueioData;

      const error = new Error('Database error');
      (BloqueioAgenda as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error)
      }));

      // Act
      await bloqueioAgendaController.criarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarMeusBloqueios', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();

    const mockBloqueios = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId,
        dataInicio: new Date('2023-01-01T10:00:00Z'),
        dataFim: new Date('2023-01-01T12:00:00Z'),
        motivo: 'Bloqueio 1'
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId,
        dataInicio: new Date('2023-01-02T14:00:00Z'),
        dataFim: new Date('2023-01-02T16:00:00Z'),
        motivo: 'Bloqueio 2'
      }
    ];

    it('should list time blocks for the logged-in provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      (BloqueioAgenda.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBloqueios)
      });

      // Act
      await bloqueioAgendaController.listarMeusBloqueios(req as Request, res as Response, next);

      // Assert
      expect(BloqueioAgenda.find).toHaveBeenCalledWith(expect.objectContaining({
        prestadorId
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBloqueios);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await bloqueioAgendaController.listarMeusBloqueios(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(BloqueioAgenda.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter by date range if provided', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T23:59:59Z'
      };

      (BloqueioAgenda.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBloqueios)
      });

      // Act
      await bloqueioAgendaController.listarMeusBloqueios(req as Request, res as Response, next);

      // Assert
      expect(BloqueioAgenda.find).toHaveBeenCalledWith(expect.objectContaining({
        prestadorId,
        $and: expect.any(Array)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockBloqueios);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle invalid date parameters gracefully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = {
        startDate: 'invalid-date',
        endDate: 'invalid-date'
      };

      (BloqueioAgenda.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockBloqueios)
      });

      // Act
      await bloqueioAgendaController.listarMeusBloqueios(req as Request, res as Response, next);

      // Assert
      // Should not throw an error, just ignore invalid dates
      expect(BloqueioAgenda.find).toHaveBeenCalledWith(expect.objectContaining({
        prestadorId
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      const error = new Error('Database error');
      (BloqueioAgenda.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(error)
      });

      // Act
      await bloqueioAgendaController.listarMeusBloqueios(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deletarBloqueio', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const bloqueioId = new mongoose.Types.ObjectId().toString();

    const mockBloqueio = {
      _id: bloqueioId,
      prestadorId,
      dataInicio: new Date('2023-01-01T10:00:00Z'),
      dataFim: new Date('2023-01-01T12:00:00Z'),
      motivo: 'Bloqueio para teste'
    };

    it('should delete a time block successfully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { bloqueioId };

      (BloqueioAgenda.findOneAndDelete as jest.Mock).mockResolvedValue(mockBloqueio);

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(BloqueioAgenda.findOneAndDelete).toHaveBeenCalledWith({
        _id: bloqueioId,
        prestadorId
      });
      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Bloqueio excluído com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { bloqueioId };

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(BloqueioAgenda.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if bloqueioId is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { bloqueioId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do bloqueio inválido.' });
      expect(BloqueioAgenda.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if time block not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { bloqueioId };

      // Make sure mongoose.Types.ObjectId.isValid returns true for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      (BloqueioAgenda.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Bloqueio não encontrado ou você não tem permissão para excluí-lo.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle CastError for invalid ObjectId format', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { bloqueioId };

      const castError = new Error('Cast Error') as any;
      castError.name = 'CastError';

      (BloqueioAgenda.findOneAndDelete as jest.Mock).mockRejectedValue(castError);

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do bloqueio inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { bloqueioId };

      // Make sure mongoose.Types.ObjectId.isValid returns true for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      // Create an error that is not a CastError
      const error = new Error('Database error');
      // Ensure the error doesn't have a name property that would trigger special handling
      Object.defineProperty(error, 'name', { value: 'Error' });

      (BloqueioAgenda.findOneAndDelete as jest.Mock).mockRejectedValue(error);

      // Act
      await bloqueioAgendaController.deletarBloqueio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      // We don't check the exact error since it might be transformed
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
