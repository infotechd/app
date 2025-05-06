import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as avaliacaoController from '../avaliacaoController';
import Avaliacao, { IAvaliacao } from '../../models/Avaliacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../../models/Contratacao';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Avaliacao');
jest.mock('../../models/Contratacao');
jest.mock('../../models/User', () => ({
  __esModule: true,
  default: jest.fn(),
  TipoUsuarioEnum: {
    COMPRADOR: 'COMPRADOR',
    PRESTADOR: 'PRESTADOR',
    ADMIN: 'ADMIN'
  }
}));
jest.mock('mongoose');

describe('Avaliacao Controller', () => {
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

  describe('registrarAvaliacao', () => {
    const autorId = new mongoose.Types.ObjectId().toString();
    const receptorId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();

    const mockContratacao = {
      _id: contratacaoId,
      buyerId: autorId,
      prestadorId: receptorId,
      status: ContratacaoStatusEnum.CONCLUIDO,
      valorTotal: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockAvaliacao = {
      _id: new mongoose.Types.ObjectId().toString(),
      contratacaoId,
      autor: autorId,
      receptor: receptorId,
      nota: 5,
      comentario: 'Ótimo serviço!',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should register a new evaluation successfully', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { 
        contratacaoId, 
        nota: 5, 
        comentario: 'Ótimo serviço!' 
      };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        buyerId: {
          toString: () => autorId
        },
        prestadorId: {
          toString: () => receptorId
        }
      });

      const saveMock = jest.fn().mockResolvedValue(mockAvaliacao);
      (Avaliacao as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await avaliacaoController.registrarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(contratacaoId);
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(Avaliacao).toHaveBeenCalledWith({
        contratacaoId,
        autor: autorId,
        receptor: receptorId,
        nota: 5,
        comentario: 'Ótimo serviço!'
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Avaliação registrada com sucesso.',
        avaliacao: mockAvaliacao
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = { contratacaoId, nota: 5 };

      // Act
      await avaliacaoController.registrarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(Avaliacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('editarAvaliacao', () => {
    const autorId = new mongoose.Types.ObjectId().toString();
    const receptorId = new mongoose.Types.ObjectId().toString();
    const avaliacaoId = new mongoose.Types.ObjectId().toString();

    const mockAvaliacao = {
      _id: avaliacaoId,
      contratacaoId: new mongoose.Types.ObjectId().toString(),
      autor: autorId,
      receptor: receptorId,
      nota: 4,
      comentario: 'Bom serviço',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should edit an evaluation successfully', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = { nota: 5, comentario: 'Excelente serviço!' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Avaliacao.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockAvaliacao,
        nota: 5,
        comentario: 'Excelente serviço!'
      });

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(avaliacaoId);
      expect(Avaliacao.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: avaliacaoId, autor: autorId },
        { $set: { nota: 5, comentario: 'Excelente serviço!' } },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Avaliação atualizada com sucesso.',
        avaliacao: expect.objectContaining({
          nota: 5,
          comentario: 'Excelente serviço!'
        })
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { avaliacaoId };
      req.body = { nota: 5 };

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Avaliacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if avaliacaoId is invalid', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId: 'invalid-id' };
      req.body = { nota: 5 };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da avaliação inválido.' });
      expect(Avaliacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if nota is invalid', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = { nota: 6 };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nota inválida. Deve ser um número entre 1 e 5.' });
      expect(Avaliacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields provided for update', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = {}; // Empty body
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido (nota ou comentario).' });
      expect(Avaliacao.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if evaluation not found or user not authorized', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = { nota: 5 };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Avaliacao.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(Avaliacao.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: avaliacaoId, autor: autorId },
        { $set: { nota: 5 } },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Avaliação não encontrada ou você não tem permissão para editá-la.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle CastError', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = { nota: 5 };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Cast Error');
      (error as any).name = 'CastError';
      (Avaliacao.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da avaliação inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: autorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { avaliacaoId };
      req.body = { nota: 5 };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (Avaliacao.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await avaliacaoController.editarAvaliacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarAvaliacoesRecebidas', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockAvaliacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        contratacaoId: new mongoose.Types.ObjectId().toString(),
        autor: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 1',
          foto: 'foto1.jpg'
        },
        receptor: userId,
        nota: 5,
        comentario: 'Excelente!',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        contratacaoId: new mongoose.Types.ObjectId().toString(),
        autor: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Autor 2',
          foto: 'foto2.jpg'
        },
        receptor: userId,
        nota: 4,
        comentario: 'Muito bom!',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list evaluations received by a user', async () => {
      // Arrange
      req.params = { userId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Avaliacao.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockAvaliacoes)
      });

      // Act
      await avaliacaoController.listarAvaliacoesRecebidas(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(userId);
      expect(Avaliacao.find).toHaveBeenCalledWith({ receptor: userId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAvaliacoes);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if userId is invalid', async () => {
      // Arrange
      req.params = { userId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await avaliacaoController.listarAvaliacoesRecebidas(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do usuário inválido.' });
      expect(Avaliacao.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.params = { userId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (Avaliacao.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await avaliacaoController.listarAvaliacoesRecebidas(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarAvaliacoesDaContratacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();
    const mockAvaliacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        contratacaoId,
        autor: {
          _id: userId,
          nome: 'Autor',
          foto: 'foto.jpg'
        },
        receptor: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Receptor',
          foto: 'foto.jpg'
        },
        nota: 5,
        comentario: 'Excelente!',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list evaluations for a contratacao', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const populateMock = jest.fn().mockReturnThis();
      const secondPopulateMock = jest.fn().mockResolvedValue(mockAvaliacoes);

      (Avaliacao.find as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      populateMock().populate = secondPopulateMock;

      // Act
      await avaliacaoController.listarAvaliacoesDaContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(contratacaoId);
      expect(Avaliacao.find).toHaveBeenCalledWith({ contratacaoId: contratacaoId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAvaliacoes);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { contratacaoId };

      // Act
      await avaliacaoController.listarAvaliacoesDaContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Avaliacao.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if contratacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await avaliacaoController.listarAvaliacoesDaContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da contratação inválido.' });
      expect(Avaliacao.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      const populateMock = jest.fn().mockReturnThis();
      const secondPopulateMock = jest.fn().mockRejectedValue(error);

      (Avaliacao.find as jest.Mock).mockReturnValue({
        populate: populateMock
      });

      populateMock().populate = secondPopulateMock;

      // Act
      await avaliacaoController.listarAvaliacoesDaContratacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
