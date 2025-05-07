import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as notificacaoController from '../notificacaoController';
import Notificacao, { INotificacao, NotificacaoTipoEnum, NotificacaoOrigemEnum, EntidadeTipoEnum } from '../../models/Notificacao';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Notificacao');
jest.mock('../../models/User');

describe('Notificacao Controller', () => {
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

  describe('createNotificacaoInterna', () => {
    const mockNotificacaoPayload = {
      usuarioId: new mongoose.Types.ObjectId().toString(),
      titulo: 'Notificação de Teste',
      mensagem: 'Mensagem de teste',
      origem: NotificacaoOrigemEnum.SISTEMA,
      tipoNotificacao: NotificacaoTipoEnum.ANUNCIO_SISTEMA,
      linkRelacionado: 'https://example.com',
      entidadeRelacionada: {
        id: new mongoose.Types.ObjectId().toString(),
        tipo: EntidadeTipoEnum.ANUNCIO
      }
    };

    it('should create a notification successfully', async () => {
      // Arrange
      const saveMock = jest.fn().mockResolvedValue({
        ...mockNotificacaoPayload,
        _id: new mongoose.Types.ObjectId().toString(),
        lida: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      (Notificacao as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      const result = await notificacaoController.createNotificacaoInterna(mockNotificacaoPayload);

      // Assert
      expect(Notificacao).toHaveBeenCalledWith(expect.objectContaining({
        usuarioId: mockNotificacaoPayload.usuarioId,
        titulo: mockNotificacaoPayload.titulo,
        mensagem: mockNotificacaoPayload.mensagem,
        lida: false,
        origem: mockNotificacaoPayload.origem,
        tipoNotificacao: mockNotificacaoPayload.tipoNotificacao,
        linkRelacionado: mockNotificacaoPayload.linkRelacionado,
        entidadeRelacionada: expect.objectContaining({
          id: mockNotificacaoPayload.entidadeRelacionada.id,
          tipo: mockNotificacaoPayload.entidadeRelacionada.tipo
        })
      }));
      expect(saveMock).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should return null if required fields are missing', async () => {
      // Arrange
      const incompletePayload = {
        usuarioId: mockNotificacaoPayload.usuarioId,
        // Missing titulo and mensagem
        origem: mockNotificacaoPayload.origem,
        tipoNotificacao: mockNotificacaoPayload.tipoNotificacao
      };

      // Act
      const result = await notificacaoController.createNotificacaoInterna(incompletePayload as any);

      // Assert
      expect(Notificacao).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if an error occurs during save', async () => {
      // Arrange
      const saveMock = jest.fn().mockRejectedValue(new Error('Database error'));

      (Notificacao as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      const result = await notificacaoController.createNotificacaoInterna(mockNotificacaoPayload);

      // Assert
      expect(Notificacao).toHaveBeenCalled();
      expect(saveMock).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle invalid ObjectId in entidadeRelacionada', async () => {
      // Arrange
      const payloadWithInvalidId = {
        ...mockNotificacaoPayload,
        entidadeRelacionada: {
          id: 'invalid-id',
          tipo: EntidadeTipoEnum.ANUNCIO
        }
      };

      // Mock isValid to return false for the invalid ID
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      const saveMock = jest.fn().mockResolvedValue({
        ...payloadWithInvalidId,
        _id: new mongoose.Types.ObjectId().toString(),
        lida: false,
        entidadeRelacionada: undefined, // Should be undefined due to validation
        createdAt: new Date(),
        updatedAt: new Date()
      });

      (Notificacao as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      const result = await notificacaoController.createNotificacaoInterna(payloadWithInvalidId as any);

      // Assert
      expect(Notificacao).toHaveBeenCalledWith(expect.objectContaining({
        entidadeRelacionada: undefined
      }));
      expect(saveMock).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });

  describe('adminCreateNotificacao', () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const mockNotificacaoPayload = {
      usuarioId: new mongoose.Types.ObjectId().toString(),
      titulo: 'Notificação de Admin',
      mensagem: 'Mensagem de teste do admin',
      tipoNotificacao: NotificacaoTipoEnum.ANUNCIO_SISTEMA,
      linkRelacionado: 'https://example.com'
    };

    it('should create a notification as admin successfully', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.body = mockNotificacaoPayload;

      const mockSavedNotificacao = {
        ...mockNotificacaoPayload,
        _id: new mongoose.Types.ObjectId().toString(),
        origem: NotificacaoOrigemEnum.ADMIN,
        lida: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the internal function
      jest.spyOn(notificacaoController, 'createNotificacaoInterna').mockResolvedValue(mockSavedNotificacao as any);

      // Act
      await notificacaoController.adminCreateNotificacao(req as Request, res as Response, next);

      // Assert
      expect(notificacaoController.createNotificacaoInterna).toHaveBeenCalledWith(expect.objectContaining({
        ...mockNotificacaoPayload,
        origem: NotificacaoOrigemEnum.ADMIN
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Notificação criada com sucesso.',
        notificacao: mockSavedNotificacao
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an admin', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockNotificacaoPayload;

      // Act
      await notificacaoController.adminCreateNotificacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(notificacaoController.createNotificacaoInterna).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if notification creation fails', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.body = mockNotificacaoPayload;

      // Mock the internal function to return null (failure)
      jest.spyOn(notificacaoController, 'createNotificacaoInterna').mockResolvedValue(null);

      // Act
      await notificacaoController.adminCreateNotificacao(req as Request, res as Response, next);

      // Assert
      expect(notificacaoController.createNotificacaoInterna).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não foi possível criar a notificação (verifique os dados).' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.body = mockNotificacaoPayload;

      const error = new Error('Database error');
      jest.spyOn(notificacaoController, 'createNotificacaoInterna').mockRejectedValue(error);

      // Act
      await notificacaoController.adminCreateNotificacao(req as Request, res as Response, next);

      // Assert
      expect(notificacaoController.createNotificacaoInterna).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getNotificacoes', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockNotificacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: userId,
        titulo: 'Notificação 1',
        mensagem: 'Mensagem 1',
        lida: false,
        origem: NotificacaoOrigemEnum.SISTEMA,
        tipoNotificacao: NotificacaoTipoEnum.ANUNCIO_SISTEMA,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: userId,
        titulo: 'Notificação 2',
        mensagem: 'Mensagem 2',
        lida: true,
        origem: NotificacaoOrigemEnum.ADMIN,
        tipoNotificacao: NotificacaoTipoEnum.AVALIACAO_RECEBIDA,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list notifications for the authenticated user', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = { page: '1', limit: '10' };

      (Notificacao.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockNotificacoes)
      });

      (Notificacao.countDocuments as jest.Mock).mockResolvedValueOnce(2); // Total count
      (Notificacao.countDocuments as jest.Mock).mockResolvedValueOnce(1); // Unread count

      // Act
      await notificacaoController.getNotificacoes(req as Request, res as Response, next);

      // Assert
      expect(Notificacao.find).toHaveBeenCalledWith({ usuarioId: userId });
      expect(Notificacao.countDocuments).toHaveBeenCalledWith({ usuarioId: userId });
      expect(Notificacao.countDocuments).toHaveBeenCalledWith({ usuarioId: userId, lida: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notificacoes: mockNotificacoes,
        totalPages: 1,
        currentPage: 1,
        totalNotificacoes: 2,
        naoLidasCount: 1
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter notifications by lida status', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = { page: '1', limit: '10', lida: 'false' };

      const unreadNotifications = [mockNotificacoes[0]]; // Only the unread notification

      (Notificacao.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(unreadNotifications)
      });

      (Notificacao.countDocuments as jest.Mock).mockResolvedValueOnce(1); // Total count of unread
      (Notificacao.countDocuments as jest.Mock).mockResolvedValueOnce(1); // Same as total since we're filtering

      // Act
      await notificacaoController.getNotificacoes(req as Request, res as Response, next);

      // Assert
      expect(Notificacao.find).toHaveBeenCalledWith({ usuarioId: userId, lida: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notificacoes: unreadNotifications,
        totalPages: 1,
        currentPage: 1,
        totalNotificacoes: 1,
        naoLidasCount: 1
      }));
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await notificacaoController.getNotificacoes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Notificacao.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = { page: '1', limit: '10' };

      const error = new Error('Database error');
      (Notificacao.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      // Act
      await notificacaoController.getNotificacoes(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const notificacaoId = new mongoose.Types.ObjectId().toString();

    const mockNotificacao = {
      _id: notificacaoId,
      usuarioId: userId,
      titulo: 'Notificação de Teste',
      mensagem: 'Mensagem de teste',
      lida: false,
      origem: NotificacaoOrigemEnum.SISTEMA,
      tipoNotificacao: NotificacaoTipoEnum.ANUNCIO_SISTEMA,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should mark a notification as read successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      // Explicitly mock the implementation for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      const updatedNotificacao = {
        ...mockNotificacao,
        lida: true
      };
      (Notificacao.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedNotificacao);

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Notificação marcada como lida.',
        notificacao: expect.objectContaining({ lida: true })
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { notificacaoId };

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Notificacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if notificacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da notificação inválido.' });
      expect(Notificacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if notification not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      // Explicitly mock the implementation for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      (Notificacao.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notificação não encontrada ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle CastError and return 400', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      const castError = new Error('Cast Error');
      (castError as any).name = 'CastError';
      (Notificacao.findOneAndUpdate as jest.Mock).mockRejectedValue(castError);

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da notificação inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      const error = new Error('Database error');
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      (Notificacao.findOneAndUpdate as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act
      await notificacaoController.markAsRead(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('marcarTodasComoLidas', () => {
    const userId = new mongoose.Types.ObjectId().toString();

    it('should mark all unread notifications as read successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      (Notificacao.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 });

      // Act
      await notificacaoController.marcarTodasComoLidas(req as Request, res as Response, next);

      // Assert
      expect(Notificacao.updateMany).toHaveBeenCalledWith(
        { usuarioId: userId, lida: false },
        { $set: { lida: true } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '5 notificações marcadas como lidas.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await notificacaoController.marcarTodasComoLidas(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Notificacao.updateMany).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle case when no notifications are updated', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      (Notificacao.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 0 });

      // Act
      await notificacaoController.marcarTodasComoLidas(req as Request, res as Response, next);

      // Assert
      expect(Notificacao.updateMany).toHaveBeenCalledWith(
        { usuarioId: userId, lida: false },
        { $set: { lida: true } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: '0 notificações marcadas como lidas.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };

      const error = new Error('Database error');
      (Notificacao.updateMany as jest.Mock).mockRejectedValue(error);

      // Act
      await notificacaoController.marcarTodasComoLidas(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotificacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const notificacaoId = new mongoose.Types.ObjectId().toString();

    const mockNotificacao = {
      _id: notificacaoId,
      usuarioId: userId,
      titulo: 'Notificação de Teste',
      mensagem: 'Mensagem de teste',
      lida: false,
      origem: NotificacaoOrigemEnum.SISTEMA,
      tipoNotificacao: NotificacaoTipoEnum.ANUNCIO_SISTEMA
    };

    it('should delete a notification successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      (Notificacao.findOneAndDelete as jest.Mock).mockResolvedValue(mockNotificacao);

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(Notificacao.findOneAndDelete).toHaveBeenCalledWith({ _id: notificacaoId, usuarioId: userId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notificação excluída com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { notificacaoId };

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Notificacao.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if notificacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da notificação inválido.' });
      expect(Notificacao.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if notification not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      // Explicitly mock the implementation for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      (Notificacao.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notificação não encontrada ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle CastError and return 400', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      const castError = new Error('Cast Error');
      (castError as any).name = 'CastError';
      (Notificacao.findOneAndDelete as jest.Mock).mockRejectedValue(castError);

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da notificação inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { notificacaoId };

      const error = new Error('Database error');
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
      (Notificacao.findOneAndDelete as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act
      await notificacaoController.deleteNotificacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
