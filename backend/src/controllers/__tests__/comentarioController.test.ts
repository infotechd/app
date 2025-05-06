import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as comentarioController from '../comentarioController';
import Comentario, { IComentario, ComentarioStatusEnum } from '../../models/Comentario';
import PublicacaoComunidade, { PublicacaoStatusEnum } from '../../models/PublicacaoComunidade';
import Curtida, { TipoItemCurtidoEnum } from '../../models/Curtida';
import { TipoUsuarioEnum } from '../../models/User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../models/Comentario');
jest.mock('../../models/PublicacaoComunidade');
jest.mock('../../models/Curtida');
jest.mock('mongoose');
jest.mock('../../config/logger');
jest.mock('../../models/User', () => ({
  __esModule: true,
  default: jest.fn(),
  TipoUsuarioEnum: {
    COMPRADOR: 'COMPRADOR',
    PRESTADOR: 'PRESTADOR',
    ADMIN: 'ADMIN'
  }
}));

describe('Comentario Controller', () => {
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

  describe('criarComentario', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const publicacaoId = new mongoose.Types.ObjectId().toString();
    const comentarioId = new mongoose.Types.ObjectId().toString();

    const mockComentario = {
      _id: comentarioId,
      publicacaoId,
      autorId: userId,
      conteudo: 'Conteúdo do comentário',
      respostaParaComentarioId: null,
      status: ComentarioStatusEnum.APROVADO,
      contagemLikes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      populate: jest.fn().mockReturnThis()
    };

    it('should create a new comment successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = {
        publicacaoId,
        conteudo: 'Conteúdo do comentário'
      };

      const saveMock = jest.fn().mockResolvedValue(mockComentario);
      (Comentario as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
        populate: jest.fn().mockReturnThis()
      }));

      (PublicacaoComunidade.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: publicacaoId,
          status: PublicacaoStatusEnum.APROVADO
        })
      });

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(sessionMock);

      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      // Act
      await comentarioController.criarComentario(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(sessionMock.startTransaction).toHaveBeenCalled();
      expect(PublicacaoComunidade.findById).toHaveBeenCalledWith(publicacaoId);
      expect(Comentario).toHaveBeenCalledWith({
        publicacaoId,
        autorId: userId,
        conteudo: 'Conteúdo do comentário',
        respostaParaComentarioId: null,
        status: ComentarioStatusEnum.APROVADO,
        contagemLikes: 0
      });
      expect(saveMock).toHaveBeenCalled();
      expect(PublicacaoComunidade.findByIdAndUpdate).toHaveBeenCalledWith(
        publicacaoId,
        { $inc: { contagemComentarios: 1 } },
        expect.anything()
      );
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comentário adicionado com sucesso.',
        comentario: mockComentario
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = {
        publicacaoId,
        conteudo: 'Conteúdo do comentário'
      };

      // Act
      await comentarioController.criarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Autenticação necessária para comentar.' });
      expect(Comentario).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listarComentariosPorPublicacao', () => {
    const publicacaoId = new mongoose.Types.ObjectId().toString();
    const mockComentarios = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        publicacaoId,
        autorId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 1',
          foto: 'foto1.jpg'
        },
        conteudo: 'Comentário 1',
        respostaParaComentarioId: null,
        status: ComentarioStatusEnum.APROVADO,
        contagemLikes: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        publicacaoId,
        autorId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 2',
          foto: 'foto2.jpg'
        },
        conteudo: 'Comentário 2',
        respostaParaComentarioId: null,
        status: ComentarioStatusEnum.APROVADO,
        contagemLikes: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list comments for a publication with pagination', async () => {
      // Arrange
      req.params = { publicacaoId };
      req.query = { page: '1', limit: '20' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.exists as jest.Mock).mockResolvedValue(true);

      const sortMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue(mockComentarios);
      const populateMock = jest.fn().mockReturnValue({
        sort: sortMock,
        skip: skipMock,
        limit: limitMock
      });

      (Comentario.find as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      (Comentario.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await comentarioController.listarComentariosPorPublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(publicacaoId);
      expect(PublicacaoComunidade.exists).toHaveBeenCalledWith({ _id: publicacaoId });
      expect(Comentario.find).toHaveBeenCalledWith({
        publicacaoId,
        status: ComentarioStatusEnum.APROVADO,
        respostaParaComentarioId: null
      });
      expect(populateMock).toHaveBeenCalledWith('autorId', 'nome foto');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(Comentario.countDocuments).toHaveBeenCalledWith({
        publicacaoId,
        status: ComentarioStatusEnum.APROVADO,
        respostaParaComentarioId: null
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        comentarios: mockComentarios,
        totalPages: 1,
        currentPage: 1,
        totalComentariosPrincipais: 2
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if publicacaoId is invalid', async () => {
      // Arrange
      req.params = { publicacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await comentarioController.listarComentariosPorPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da publicação inválido.' });
      expect(Comentario.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('editarComentario', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const comentarioId = new mongoose.Types.ObjectId().toString();

    const mockComentario = {
      _id: comentarioId,
      autorId: userId,
      conteudo: 'Conteúdo original',
      status: ComentarioStatusEnum.APROVADO,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      updatedAt: new Date()
    };

    it('should edit user\'s own comment successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Comentario.findOneAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockComentario,
          conteudo: 'Conteúdo atualizado'
        })
      });

      // Act
      await comentarioController.editarComentario(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(comentarioId);
      expect(Comentario.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: comentarioId,
          autorId: userId,
          status: ComentarioStatusEnum.APROVADO,
          createdAt: expect.any(Object)
        }),
        { $set: { conteudo: 'Conteúdo atualizado' } },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comentário atualizado.',
        comentario: expect.objectContaining({
          conteudo: 'Conteúdo atualizado'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { comentarioId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      // Act
      await comentarioController.editarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Comentario.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if comentarioId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId: 'invalid-id' };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await comentarioController.editarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do comentário inválido.' });
      expect(Comentario.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if conteudo is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId };
      req.body = { conteudo: '' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await comentarioController.editarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conteúdo do comentário inválido (1-2000 caracteres).' });
      expect(Comentario.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deletarComentario', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const adminId = new mongoose.Types.ObjectId().toString();
    const comentarioId = new mongoose.Types.ObjectId().toString();
    const publicacaoId = new mongoose.Types.ObjectId().toString();

    const mockComentario = {
      _id: comentarioId,
      publicacaoId,
      autorId: userId,
      conteudo: 'Conteúdo do comentário',
      respostaParaComentarioId: null,
      status: ComentarioStatusEnum.APROVADO,
      contagemLikes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      // Mock mongoose session
      const sessionMock = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn()
      };
      (mongoose.startSession as jest.Mock).mockResolvedValue(sessionMock);
    });

    it('should delete user\'s own comment successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Comentario.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComentario)
      });

      // Mock the recursive function results
      const mockRespostas = [
        { _id: new mongoose.Types.ObjectId() },
        { _id: new mongoose.Types.ObjectId() }
      ];

      (Comentario.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockRespostas)
      });

      (Comentario.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 }); // Main + 2 replies
      (Curtida.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (PublicacaoComunidade.updateOne as jest.Mock).mockResolvedValue({});

      // Act
      await comentarioController.deletarComentario(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(comentarioId);
      expect(Comentario.findById).toHaveBeenCalledWith(comentarioId);
      expect(Comentario.deleteMany).toHaveBeenCalled();
      expect(Curtida.deleteMany).toHaveBeenCalled();
      expect(PublicacaoComunidade.findByIdAndUpdate).toHaveBeenCalledWith(
        publicacaoId,
        { $inc: { contagemComentarios: -3 } },
        expect.anything()
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comentário(s) excluído(s) com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to delete any comment', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { comentarioId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Comentario.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockComentario)
      });

      // Mock the recursive function results
      (Comentario.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });

      (Comentario.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      (Curtida.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (PublicacaoComunidade.updateOne as jest.Mock).mockResolvedValue({});

      // Act
      await comentarioController.deletarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { comentarioId };

      // Act
      await comentarioController.deletarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Comentario.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if comentarioId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId: 'invalid-id' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await comentarioController.deletarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do comentário inválido.' });
      expect(Comentario.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('moderarComentario', () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();
    const comentarioId = new mongoose.Types.ObjectId().toString();

    const mockComentario = {
      _id: comentarioId,
      autorId: userId,
      conteudo: 'Conteúdo do comentário',
      status: ComentarioStatusEnum.APROVADO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow admin to moderate a comment', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { comentarioId };
      req.body = { status: ComentarioStatusEnum.OCULTO_PELO_ADMIN };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Comentario.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockComentario,
          status: ComentarioStatusEnum.OCULTO_PELO_ADMIN
        })
      });

      // Act
      await comentarioController.moderarComentario(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(comentarioId);
      expect(Comentario.findByIdAndUpdate).toHaveBeenCalledWith(
        comentarioId,
        { $set: { status: ComentarioStatusEnum.OCULTO_PELO_ADMIN } },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Comentário atualizado para status '${ComentarioStatusEnum.OCULTO_PELO_ADMIN}'.`,
        comentario: expect.objectContaining({
          status: ComentarioStatusEnum.OCULTO_PELO_ADMIN
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { comentarioId };
      req.body = { status: ComentarioStatusEnum.OCULTO_PELO_ADMIN };

      // Act
      await comentarioController.moderarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores podem moderar.' });
      expect(Comentario.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { comentarioId };
      req.body = { status: ComentarioStatusEnum.OCULTO_PELO_ADMIN };

      // Act
      await comentarioController.moderarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores podem moderar.' });
      expect(Comentario.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if comentarioId is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { comentarioId: 'invalid-id' };
      req.body = { status: ComentarioStatusEnum.OCULTO_PELO_ADMIN };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await comentarioController.moderarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do comentário inválido.' });
      expect(Comentario.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if status is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { comentarioId };
      req.body = { status: 'INVALID_STATUS' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await comentarioController.moderarComentario(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Status inválido fornecido para moderação')
      }));
      expect(Comentario.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});
