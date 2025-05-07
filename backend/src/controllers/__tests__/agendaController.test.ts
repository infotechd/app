import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as agendaController from '../agendaController';
import { TipoUsuarioEnum } from '../../models/User';

describe('Agenda Controller', () => {
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

  describe('getAgenda', () => {
    it('should return agenda for authenticated user', async () => {
      // Arrange
      const prestadorId = 'prestador-123';
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      // Act
      await agendaController.getAgenda(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        agenda: expect.objectContaining({
          _id: 'agenda-' + prestadorId,
          prestadorId,
          compromissos: expect.arrayContaining([
            expect.objectContaining({
              _id: 'compromisso-1',
              status: 'pendente'
            }),
            expect.objectContaining({
              _id: 'compromisso-2',
              status: 'confirmado'
            })
          ])
        })
      }));
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await agendaController.getAgenda(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não autenticado ou ID não encontrado' });
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const prestadorId = 'prestador-123';
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      // Mock console.error to prevent actual logging
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by making req.user throw when accessed
      Object.defineProperty(req, 'user', {
        get: () => { throw new Error('Test error'); }
      });

      // Act
      await agendaController.getAgenda(req as Request, res as Response);

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao buscar agenda' });
    });
  });

  describe('updateCompromissoStatus', () => {
    const prestadorId = 'prestador-123';
    const agendaId = 'agenda-prestador-123';
    const compromissoId = 'compromisso-1';
    const newStatus = 'confirmado';

    it('should update compromisso status successfully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { agendaId, compromissoId };
      req.body = { status: newStatus };

      // Act
      await agendaController.updateCompromissoStatus(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        agenda: expect.objectContaining({
          _id: agendaId,
          prestadorId,
          compromissos: expect.arrayContaining([
            expect.objectContaining({
              _id: compromissoId,
              status: newStatus
            })
          ])
        }),
        message: `Status do compromisso atualizado com sucesso para ${newStatus}`
      }));
    });

    it('should return 400 if status is missing', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { agendaId, compromissoId };
      req.body = {}; // Missing status

      // Act
      await agendaController.updateCompromissoStatus(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Status é obrigatório' });
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { agendaId, compromissoId };
      req.body = { status: newStatus };

      // Act
      await agendaController.updateCompromissoStatus(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não autenticado ou ID não encontrado' });
    });

    it('should return 403 if agenda does not belong to user', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { agendaId: 'agenda-different-user', compromissoId };
      req.body = { status: newStatus };

      // Act
      await agendaController.updateCompromissoStatus(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado: esta agenda não pertence ao usuário' });
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { agendaId, compromissoId };
      req.body = { status: newStatus };

      // Mock console.error to prevent actual logging
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by making req.params throw when accessed
      Object.defineProperty(req, 'params', {
        get: () => { throw new Error('Test error'); }
      });

      // Act
      await agendaController.updateCompromissoStatus(req as Request, res as Response);

      // Assert
      expect(console.error).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao atualizar status do compromisso' });
    });
  });
});
