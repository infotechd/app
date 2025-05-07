import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import curtidaController from '../curtidaController';
import Curtida, { TipoItemCurtidoEnum } from '../../models/Curtida';
import PublicacaoComunidade from '../../models/PublicacaoComunidade';
import Comentario from '../../models/Comentario';

// Mock dependencies
jest.mock('../../models/Curtida');
jest.mock('../../models/PublicacaoComunidade');
jest.mock('../../models/Comentario');
jest.mock('mongoose');

describe('Curtida Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
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

  describe('curtirItem', () => {
    const usuarioId = new mongoose.Types.ObjectId().toString();
    const itemCurtidoId = new mongoose.Types.ObjectId().toString();
    const curtidaId = new mongoose.Types.ObjectId().toString();

    const mockCurtida = {
      _id: curtidaId,
      usuarioId,
      itemCurtidoId,
      tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE,
      createdAt: new Date()
    };

    beforeEach(() => {
      // Mock req.usuarioId (added by authMiddleware)
      (req as any).usuarioId = usuarioId;

      // Mock mongoose session
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(sessionMock);

      // Mock Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should create a new like successfully', async () => {
      // Arrange
      req.body = {
        itemCurtidoId,
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      };

      // Mock Curtida.create
      (Curtida.create as jest.Mock).mockResolvedValue([mockCurtida]);

      // Mock PublicacaoComunidade.updateOne
      (PublicacaoComunidade.updateOne as jest.Mock).mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true
      });

      // Act
      await curtidaController.curtirItem(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(Curtida.create).toHaveBeenCalledWith([{
        usuarioId: expect.any(Object),
        itemCurtidoId: expect.any(Object),
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      }], { session: expect.anything() });
      expect(PublicacaoComunidade.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) },
        { $inc: { contagemLikes: 1 } },
        { session: expect.anything() }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCurtida);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if required data is missing', async () => {
      // Arrange
      req.body = {
        // Missing itemCurtidoId and tipoItemCurtido
      };

      // Act
      await curtidaController.curtirItem(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Dados incompletos')
      }));
      expect(mongoose.startSession).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('descurtirItem', () => {
    const usuarioId = new mongoose.Types.ObjectId().toString();
    const itemCurtidoId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      // Mock req.usuarioId (added by authMiddleware)
      (req as any).usuarioId = usuarioId;

      // Mock mongoose session
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(sessionMock);

      // Mock Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should remove a like successfully', async () => {
      // Arrange
      req.body = {
        itemCurtidoId,
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      };

      // Mock Curtida.deleteOne
      (Curtida.deleteOne as jest.Mock).mockResolvedValue({
        deletedCount: 1
      });

      // Mock PublicacaoComunidade.updateOne
      (PublicacaoComunidade.updateOne as jest.Mock).mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true
      });

      // Act
      await curtidaController.descurtirItem(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(Curtida.deleteOne).toHaveBeenCalledWith(
        {
          usuarioId: expect.any(Object),
          itemCurtidoId: expect.any(Object),
          tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
        },
        { session: expect.anything() }
      );
      expect(PublicacaoComunidade.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Object) },
        { $inc: { contagemLikes: -1 } },
        { session: expect.anything() }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Item descurtido com sucesso')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('verificarCurtida', () => {
    const usuarioId = new mongoose.Types.ObjectId().toString();
    const itemCurtidoId = new mongoose.Types.ObjectId().toString();
    const curtidaId = new mongoose.Types.ObjectId().toString();

    const mockCurtida = {
      _id: curtidaId,
      usuarioId,
      itemCurtidoId,
      tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE,
      createdAt: new Date()
    };

    beforeEach(() => {
      // Mock req.usuarioId (added by authMiddleware)
      (req as any).usuarioId = usuarioId;

      // Mock Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should return true if user liked the item', async () => {
      // Arrange
      req.query = {
        itemCurtidoId,
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      };

      // Mock Curtida.findOne
      (Curtida.findOne as jest.Mock).mockResolvedValue(mockCurtida);

      // Act
      await curtidaController.verificarCurtida(req as Request, res as Response, next);

      // Assert
      expect(Curtida.findOne).toHaveBeenCalledWith({
        usuarioId: expect.any(Object),
        itemCurtidoId: expect.any(Object),
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        curtiu: true,
        curtida: mockCurtida
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return false if user did not like the item', async () => {
      // Arrange
      req.query = {
        itemCurtidoId,
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE
      };

      // Mock Curtida.findOne
      (Curtida.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await curtidaController.verificarCurtida(req as Request, res as Response, next);

      // Assert
      expect(Curtida.findOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        curtiu: false
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listarItensCurtidosPeloUsuario', () => {
    const usuarioId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    const mockCurtidas = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: userId,
        itemCurtidoId: new mongoose.Types.ObjectId().toString(),
        tipoItemCurtido: TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: userId,
        itemCurtidoId: new mongoose.Types.ObjectId().toString(),
        tipoItemCurtido: TipoItemCurtidoEnum.COMENTARIO,
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      // Mock req.usuarioId (added by authMiddleware)
      (req as any).usuarioId = usuarioId;

      // Mock Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should list items liked by a user with pagination', async () => {
      // Arrange
      req.params = { userId };
      req.query = { page: '1', limit: '10' };

      // Mock Curtida.countDocuments
      (Curtida.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Curtida.find
      const sortMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue(mockCurtidas);

      (Curtida.find as jest.Mock).mockReturnValue({
        sort: sortMock,
        skip: skipMock,
        limit: limitMock
      });

      // Act
      await curtidaController.listarItensCurtidosPeloUsuario(req as Request, res as Response, next);

      // Assert
      expect(Curtida.countDocuments).toHaveBeenCalledWith({
        usuarioId: expect.any(Object)
      });
      expect(Curtida.find).toHaveBeenCalledWith({
        usuarioId: expect.any(Object)
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: mockCurtidas,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          limit: 10
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listarUsuariosQueCurtiramItem', () => {
    const itemCurtidoId = new mongoose.Types.ObjectId().toString();
    const tipoItemCurtido = TipoItemCurtidoEnum.PUBLICACAO_COMUNIDADE;

    const mockCurtidas = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Usuário 1',
          email: 'usuario1@example.com',
          avatarUrl: 'avatar1.jpg'
        },
        itemCurtidoId,
        tipoItemCurtido,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        usuarioId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Usuário 2',
          email: 'usuario2@example.com',
          avatarUrl: 'avatar2.jpg'
        },
        itemCurtidoId,
        tipoItemCurtido,
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      // Mock Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should list users who liked an item with pagination', async () => {
      // Arrange
      req.params = { tipoItemCurtido, itemCurtidoId };
      req.query = { page: '1', limit: '10' };

      // Mock parent item exists
      (PublicacaoComunidade.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: itemCurtidoId })
      });

      // Mock Curtida.countDocuments
      (Curtida.countDocuments as jest.Mock).mockResolvedValue(2);

      // Mock Curtida.find
      const sortMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue(mockCurtidas);
      const populateMock = jest.fn().mockReturnValue({
        sort: sortMock,
        skip: skipMock,
        limit: limitMock
      });

      (Curtida.find as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      // Act
      await curtidaController.listarUsuariosQueCurtiramItem(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade.findById).toHaveBeenCalledWith(itemCurtidoId);
      expect(Curtida.countDocuments).toHaveBeenCalledWith({
        itemCurtidoId: expect.any(Object),
        tipoItemCurtido
      });
      expect(Curtida.find).toHaveBeenCalledWith({
        itemCurtidoId: expect.any(Object),
        tipoItemCurtido
      });
      expect(populateMock).toHaveBeenCalledWith({
        path: 'usuarioId',
        select: 'nome email avatarUrl _id'
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.any(Array),
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 2,
          limit: 10
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});