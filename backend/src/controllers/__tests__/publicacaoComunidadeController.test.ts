import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as publicacaoComunidadeController from '../publicacaoComunidadeController';
import PublicacaoComunidade, { IPublicacaoComunidade, PublicacaoStatusEnum, PublicacaoTipoEnum } from '../../models/PublicacaoComunidade';
import Comentario from '../../models/Comentario';
import Curtida from '../../models/Curtida';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/PublicacaoComunidade');
jest.mock('../../models/Comentario');
jest.mock('../../models/Curtida');
jest.mock('mongoose');
jest.mock('../../models/User', () => ({
  __esModule: true,
  default: jest.fn(),
  TipoUsuarioEnum: {
    COMPRADOR: 'COMPRADOR',
    PRESTADOR: 'PRESTADOR',
    ADMIN: 'ADMIN'
  }
}));

describe('PublicacaoComunidade Controller', () => {
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

  describe('createPublicacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockPublicacao = {
      _id: new mongoose.Types.ObjectId().toString(),
      autorId: userId,
      conteudo: 'Conteúdo da publicação',
      tipo: PublicacaoTipoEnum.POST,
      imagens: [],
      status: PublicacaoStatusEnum.PENDENTE_APROVACAO,
      contagemLikes: 0,
      contagemComentarios: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new post successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = {
        conteudo: 'Conteúdo da publicação',
        tipo: PublicacaoTipoEnum.POST,
        imagens: []
      };

      const saveMock = jest.fn().mockResolvedValue(mockPublicacao);
      (PublicacaoComunidade as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await publicacaoComunidadeController.createPublicacao(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade).toHaveBeenCalledWith({
        autorId: userId,
        conteudo: 'Conteúdo da publicação',
        tipo: PublicacaoTipoEnum.POST,
        imagens: [],
        status: PublicacaoStatusEnum.PENDENTE_APROVACAO,
        contagemLikes: 0,
        contagemComentarios: 0
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Publicação criada com sucesso.',
        publicacao: mockPublicacao
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should create a new event successfully', async () => {
      // Arrange
      const eventDate = new Date();
      const mockEvent = {
        ...mockPublicacao,
        tipo: PublicacaoTipoEnum.EVENTO,
        dataEvento: eventDate,
        localEvento: 'Local do evento'
      };

      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = {
        conteudo: 'Conteúdo do evento',
        tipo: PublicacaoTipoEnum.EVENTO,
        imagens: [],
        dataEvento: eventDate.toISOString(),
        localEvento: 'Local do evento'
      };

      const saveMock = jest.fn().mockResolvedValue(mockEvent);
      (PublicacaoComunidade as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await publicacaoComunidadeController.createPublicacao(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade).toHaveBeenCalledWith({
        autorId: userId,
        conteudo: 'Conteúdo do evento',
        tipo: PublicacaoTipoEnum.EVENTO,
        imagens: [],
        dataEvento: expect.any(Date),
        localEvento: 'Local do evento',
        status: PublicacaoStatusEnum.PENDENTE_APROVACAO,
        contagemLikes: 0,
        contagemComentarios: 0
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Publicação criada com sucesso.',
        publicacao: mockEvent
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = { conteudo: 'Conteúdo da publicação' };

      // Act
      await publicacaoComunidadeController.createPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(PublicacaoComunidade).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getPublicacoesAprovadas', () => {
    const mockPublicacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        autorId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 1',
          foto: 'foto1.jpg'
        },
        conteudo: 'Publicação 1',
        tipo: PublicacaoTipoEnum.POST,
        status: PublicacaoStatusEnum.APROVADO,
        contagemLikes: 5,
        contagemComentarios: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        autorId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 2',
          foto: 'foto2.jpg'
        },
        conteudo: 'Publicação 2',
        tipo: PublicacaoTipoEnum.EVENTO,
        dataEvento: new Date(),
        localEvento: 'Local do evento',
        status: PublicacaoStatusEnum.APROVADO,
        contagemLikes: 10,
        contagemComentarios: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list approved publications with pagination', async () => {
      // Arrange
      req.query = { page: '1', limit: '10' };

      const sortMock = jest.fn().mockReturnThis();
      const skipMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue(mockPublicacoes);
      const populateMock = jest.fn().mockReturnValue({
        sort: sortMock,
        skip: skipMock,
        limit: limitMock
      });

      (PublicacaoComunidade.find as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      (PublicacaoComunidade.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await publicacaoComunidadeController.getPublicacoesAprovadas(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade.find).toHaveBeenCalledWith({ status: PublicacaoStatusEnum.APROVADO });
      expect(populateMock).toHaveBeenCalledWith('autorId', 'nome foto');
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(PublicacaoComunidade.countDocuments).toHaveBeenCalledWith({ status: PublicacaoStatusEnum.APROVADO });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        publicacoes: mockPublicacoes,
        totalPages: 1,
        currentPage: 1,
        totalPublicacoes: 2
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with error', async () => {
      // Arrange
      req.query = { page: '1', limit: '10' };

      const error = new Error('Database error');
      (PublicacaoComunidade.find as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act
      await publicacaoComunidadeController.getPublicacoesAprovadas(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPublicacaoAprovadaById', () => {
    const publicacaoId = new mongoose.Types.ObjectId().toString();
    const mockPublicacao = {
      _id: publicacaoId,
      autorId: {
        _id: new mongoose.Types.ObjectId().toString(),
        nome: 'Autor',
        foto: 'foto.jpg'
      },
      conteudo: 'Conteúdo da publicação',
      tipo: PublicacaoTipoEnum.POST,
      status: PublicacaoStatusEnum.APROVADO,
      contagemLikes: 5,
      contagemComentarios: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should get an approved publication by id', async () => {
      // Arrange
      req.params = { publicacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublicacao)
      });

      // Act
      await publicacaoComunidadeController.getPublicacaoAprovadaById(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(publicacaoId);
      expect(PublicacaoComunidade.findOne).toHaveBeenCalledWith({
        _id: publicacaoId,
        status: PublicacaoStatusEnum.APROVADO
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPublicacao);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if publicacaoId is invalid', async () => {
      // Arrange
      req.params = { publicacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await publicacaoComunidadeController.getPublicacaoAprovadaById(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da publicação inválido.' });
      expect(PublicacaoComunidade.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if publication not found or not approved', async () => {
      // Arrange
      req.params = { publicacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await publicacaoComunidadeController.getPublicacaoAprovadaById(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Publicação não encontrada ou não está aprovada.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with error', async () => {
      // Arrange
      req.params = { publicacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const error = new Error('Database error');
      (PublicacaoComunidade.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await publicacaoComunidadeController.getPublicacaoAprovadaById(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateMinhaPublicacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const publicacaoId = new mongoose.Types.ObjectId().toString();

    const mockPublicacao = {
      _id: publicacaoId,
      autorId: userId,
      conteudo: 'Conteúdo original',
      tipo: PublicacaoTipoEnum.POST,
      status: PublicacaoStatusEnum.RASCUNHO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update user\'s own publication successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockPublicacao,
        conteudo: 'Conteúdo atualizado'
      });

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(publicacaoId);
      expect(PublicacaoComunidade.findOneAndUpdate).toHaveBeenCalledWith(
        { 
          _id: publicacaoId, 
          autorId: userId, 
          status: { $in: [PublicacaoStatusEnum.RASCUNHO, PublicacaoStatusEnum.REJEITADO] } 
        },
        { $set: { conteudo: 'Conteúdo atualizado' } },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Publicação atualizada com sucesso.',
        publicacao: expect.objectContaining({
          conteudo: 'Conteúdo atualizado'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { publicacaoId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(PublicacaoComunidade.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if publicacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId: 'invalid-id' };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da publicação inválido.' });
      expect(PublicacaoComunidade.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields provided for update', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };
      req.body = {}; // Empty body

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido.' });
      expect(PublicacaoComunidade.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if publication not found or user not authorized', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Publicação não encontrada, não pertence a você ou não pode ser editada no status atual.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with error', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };
      req.body = { conteudo: 'Conteúdo atualizado' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (PublicacaoComunidade.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await publicacaoComunidadeController.updateMinhaPublicacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deletePublicacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const publicacaoId = new mongoose.Types.ObjectId().toString();

    const mockPublicacao = {
      _id: publicacaoId,
      autorId: userId,
      conteudo: 'Conteúdo da publicação',
      tipo: PublicacaoTipoEnum.POST,
      status: PublicacaoStatusEnum.APROVADO,
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

    it('should delete user\'s own publication successfully', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOneAndDelete as jest.Mock).mockResolvedValue(mockPublicacao);
      (Comentario.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
      (Curtida.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(publicacaoId);
      expect(PublicacaoComunidade.findOneAndDelete).toHaveBeenCalledWith(
        { _id: publicacaoId, autorId: userId },
        expect.anything()
      );
      expect(Comentario.deleteMany).toHaveBeenCalledWith({ publicacaoId: publicacaoId }, expect.anything());
      expect(Curtida.deleteMany).toHaveBeenCalledWith({ 
        itemCurtidoId: publicacaoId, 
        tipoItemCurtido: 'PublicacaoComunidade' 
      }, expect.anything());
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Publicação e seus comentários/curtidas associados foram excluídos com sucesso.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to delete any publication', async () => {
      // Arrange
      const adminId = new mongoose.Types.ObjectId().toString();
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOneAndDelete as jest.Mock).mockResolvedValue(mockPublicacao);
      (Comentario.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });
      (Curtida.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade.findOneAndDelete).toHaveBeenCalledWith(
        { _id: publicacaoId },
        expect.anything()
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { publicacaoId };

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(PublicacaoComunidade.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if publicacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId: 'invalid-id' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da publicação inválido.' });
      expect(PublicacaoComunidade.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if publication not found or user not authorized', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Publicação não encontrada ou você não tem permissão para excluí-la.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with error', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (PublicacaoComunidade.findOneAndDelete as jest.Mock).mockRejectedValue(error);

      // Act
      await publicacaoComunidadeController.deletePublicacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('moderarPublicacao', () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const publicacaoId = new mongoose.Types.ObjectId().toString();

    const mockPublicacao = {
      _id: publicacaoId,
      autorId: new mongoose.Types.ObjectId().toString(),
      conteudo: 'Conteúdo da publicação',
      tipo: PublicacaoTipoEnum.POST,
      status: PublicacaoStatusEnum.PENDENTE_APROVACAO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should allow admin to approve a publication', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockPublicacao,
        status: PublicacaoStatusEnum.APROVADO
      });

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(publicacaoId);
      expect(PublicacaoComunidade.findByIdAndUpdate).toHaveBeenCalledWith(
        publicacaoId,
        {
          status: PublicacaoStatusEnum.APROVADO,
          motivoReprovacaoOuOcultacao: undefined
        },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Publicação atualizada para status '${PublicacaoStatusEnum.APROVADO}'.`,
        publicacao: expect.objectContaining({
          status: PublicacaoStatusEnum.APROVADO
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin to reject a publication with motivo', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { 
        status: PublicacaoStatusEnum.REJEITADO,
        motivo: 'Conteúdo inadequado'
      };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockPublicacao,
        status: PublicacaoStatusEnum.REJEITADO,
        motivoReprovacaoOuOcultacao: 'Conteúdo inadequado'
      });

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(PublicacaoComunidade.findByIdAndUpdate).toHaveBeenCalledWith(
        publicacaoId,
        {
          status: PublicacaoStatusEnum.REJEITADO,
          motivoReprovacaoOuOcultacao: 'Conteúdo inadequado'
        },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Publicação atualizada para status '${PublicacaoStatusEnum.REJEITADO}'.`,
        publicacao: expect.objectContaining({
          status: PublicacaoStatusEnum.REJEITADO,
          motivoReprovacaoOuOcultacao: 'Conteúdo inadequado'
        })
      });
    });

    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user = { userId: new mongoose.Types.ObjectId().toString(), tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores podem moderar.' });
      expect(PublicacaoComunidade.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores podem moderar.' });
      expect(PublicacaoComunidade.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if publicacaoId is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId: 'invalid-id' };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da publicação inválido.' });
      expect(PublicacaoComunidade.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if status is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { status: 'invalid-status' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: expect.stringContaining('Status inválido fornecido para moderação') 
      });
      expect(PublicacaoComunidade.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if rejecting without motivo', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.REJEITADO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Motivo é obrigatório ao rejeitar.' });
      expect(PublicacaoComunidade.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if publication not found', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Publicação não encontrada.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and call next with error', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { publicacaoId };
      req.body = { status: PublicacaoStatusEnum.APROVADO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (PublicacaoComunidade.findByIdAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await publicacaoComunidadeController.moderarPublicacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarPublicacoesPendentes', () => {
    const adminId = new mongoose.Types.ObjectId().toString();

    it('should return 403 if user is not admin', async () => {
      // Arrange
      req.user = { userId: new mongoose.Types.ObjectId().toString(), tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await publicacaoComunidadeController.listarPublicacoesPendentes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 501 as the endpoint is not implemented', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };

      // Act
      await publicacaoComunidadeController.listarPublicacoesPendentes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint listarPublicacoesPendentes não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
