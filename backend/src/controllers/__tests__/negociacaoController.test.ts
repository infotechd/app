import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as negociacaoController from '../negociacaoController';
import Negociacao, { INegociacao, NegociacaoStatusEnum, HistoricoNegociacaoTipoEnum } from '../../models/Negociacao';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../../models/Contratacao';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Negociacao');
jest.mock('../../models/Contratacao');
jest.mock('mongoose');

describe('Negociacao Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        userId: new mongoose.Types.ObjectId().toString(),
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('criarNegociacao', () => {
    const buyerId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();
    const negociacaoId = new mongoose.Types.ObjectId().toString();

    const mockContratacao = {
      _id: contratacaoId,
      buyerId: new mongoose.Types.ObjectId(buyerId),
      prestadorId: new mongoose.Types.ObjectId(prestadorId),
      status: ContratacaoStatusEnum.PENDENTE
    };

    const mockNegociacao = {
      _id: negociacaoId,
      contratacaoId,
      buyerId,
      prestadorId,
      historico: [{
        autorId: buyerId,
        tipo: HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER,
        dados: {
          novoPreco: 100,
          novoPrazo: new Date(),
          observacoes: 'Observações de teste'
        },
        timestamp: new Date()
      }],
      status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR,
      save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      // Mock req.user
      req.user = {
        userId: buyerId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should create a new negotiation successfully', async () => {
      // Arrange
      req.body = {
        contratacaoId,
        proposta: {
          novoPreco: 100,
          novoPrazo: new Date().toISOString(),
          observacoes: 'Observações de teste'
        }
      };

      // Mock Contratacao.findById
      (Contratacao.findById as jest.Mock).mockResolvedValue(mockContratacao);

      // Mock Negociacao constructor and save
      (Negociacao as unknown as jest.Mock).mockImplementation(() => mockNegociacao);

      // Act
      await negociacaoController.criarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(Negociacao).toHaveBeenCalledWith(expect.objectContaining({
        contratacaoId: mockContratacao._id,
        buyerId,
        prestadorId: mockContratacao.prestadorId,
        historico: expect.any(Array),
        status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR
      }));
      expect(mockNegociacao.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Negociação iniciada com sucesso.',
        negociacao: mockNegociacao
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a buyer', async () => {
      // Arrange
      req.user = {
        userId: buyerId,
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      };

      // Act
      await negociacaoController.criarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Apenas compradores podem iniciar negociações')
      }));
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if contratacaoId is invalid', async () => {
      // Arrange
      req.body = {
        contratacaoId: 'invalid-id',
        proposta: {
          observacoes: 'Observações de teste'
        }
      };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await negociacaoController.criarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('ID da contratação inválido')
      }));
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if proposta is missing observacoes', async () => {
      // Arrange
      req.body = {
        contratacaoId,
        proposta: {
          novoPreco: 100
          // Missing observacoes
        }
      };

      // Act
      await negociacaoController.criarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('observacoes são obrigatórias')
      }));
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if contratacao is not found', async () => {
      // Arrange
      req.body = {
        contratacaoId,
        proposta: {
          novoPreco: 100,
          novoPrazo: new Date().toISOString(),
          observacoes: 'Observações de teste'
        }
      };

      // Mock Contratacao.findById to return null
      (Contratacao.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await negociacaoController.criarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Contratação não encontrada')
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('responderNegociacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const buyerId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const negociacaoId = new mongoose.Types.ObjectId().toString();

    const mockNegociacao = {
      _id: negociacaoId,
      buyerId: new mongoose.Types.ObjectId(buyerId),
      prestadorId: new mongoose.Types.ObjectId(prestadorId),
      status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR,
      historico: [],
      save: jest.fn().mockResolvedValue(true)
    };

    beforeEach(() => {
      // Mock req.user
      req.user = {
        userId,
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      };

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should add a prestador response successfully', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.user = {
        userId: prestadorId,
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      };
      req.body = {
        tipo: HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR,
        dados: {
          novoPreco: 150,
          novoPrazo: new Date().toISOString(),
          observacoes: 'Resposta do prestador'
        }
      };

      // Mock Negociacao.findById
      (Negociacao.findById as jest.Mock).mockResolvedValue({
        ...mockNegociacao,
        buyerId: { toString: () => buyerId },
        prestadorId: { toString: () => prestadorId }
      });

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(mockNegociacao.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Resposta/Mensagem adicionada à negociação.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Não autorizado.'
      }));
      expect(Negociacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if negociacaoId is invalid', async () => {
      // Arrange
      req.params = { negociacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ID da negociação inválido.'
      }));
      expect(Negociacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if tipo is invalid', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.body = {
        tipo: 'invalid-tipo',
        dados: {
          observacoes: 'Resposta do prestador'
        }
      };

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Tipo de resposta inválido.'
      }));
      expect(Negociacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if negociacao is not found', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.body = {
        tipo: HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR,
        dados: {
          observacoes: 'Resposta do prestador'
        }
      };

      // Mock Negociacao.findById to return null
      (Negociacao.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Negociação não encontrada.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.body = {
        tipo: HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR,
        dados: {
          observacoes: 'Resposta do prestador'
        }
      };

      const error = new Error('Test error');
      (Negociacao.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await negociacaoController.responderNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('finalizarNegociacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const buyerId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const negociacaoId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();

    const mockNegociacao = {
      _id: negociacaoId,
      contratacaoId,
      buyerId: new mongoose.Types.ObjectId(buyerId),
      prestadorId: new mongoose.Types.ObjectId(prestadorId),
      status: NegociacaoStatusEnum.AGUARDANDO_BUYER,
      historico: [{
        autorId: prestadorId,
        tipo: HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR,
        dados: {
          novoPreco: 150,
          novoPrazo: new Date(),
          observacoes: 'Resposta do prestador'
        },
        timestamp: new Date()
      }],
      save: jest.fn().mockResolvedValue(true)
    };

    const mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    beforeEach(() => {
      // Mock req.user
      req.user = {
        userId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Mock mongoose.startSession
      (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
    });

    it('should accept a negotiation successfully', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.user = {
        userId: buyerId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      req.body = { acao: 'aceitar' };

      // Mock Negociacao.findById
      (Negociacao.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          ...mockNegociacao,
          buyerId: { toString: () => buyerId },
          prestadorId: { toString: () => prestadorId }
        })
      });

      // Mock Contratacao.findByIdAndUpdate
      (Contratacao.findByIdAndUpdate as jest.Mock).mockReturnValue({
        _id: contratacaoId,
        valorTotal: 150,
        dataFimServico: new Date()
      });

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(mockNegociacao.save).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Negociação ACEITA com sucesso')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject a negotiation successfully', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.user = {
        userId: buyerId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      req.body = { acao: 'rejeitar' };

      // Mock Negociacao.findById
      (Negociacao.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockReturnValue({
          ...mockNegociacao,
          buyerId: { toString: () => buyerId },
          prestadorId: { toString: () => prestadorId }
        })
      });

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(mockNegociacao.save).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Negociação REJEITADA com sucesso')
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Não autorizado.'
      }));
      expect(mongoose.startSession).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if negociacaoId is invalid', async () => {
      // Arrange
      req.params = { negociacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ID da negociação inválido.'
      }));
      expect(mongoose.startSession).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if acao is invalid', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.body = { acao: 'invalid-action' };

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Ação inválida. Use "aceitar" ou "rejeitar".'
      }));
      expect(mongoose.startSession).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      req.params = { negociacaoId };
      req.body = { acao: 'aceitar' };

      const error = new Error('Test error');
      (mongoose.startSession as jest.Mock).mockRejectedValue(error);

      // Act
      await negociacaoController.finalizarNegociacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.startSession).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarNegociacoesPorContratacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();

    const mockContratacao = {
      _id: contratacaoId,
      buyerId: { toString: () => userId },
      prestadorId: { toString: () => new mongoose.Types.ObjectId().toString() }
    };

    const mockNegociacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        contratacaoId,
        status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        contratacaoId,
        status: NegociacaoStatusEnum.ACEITA,
        createdAt: new Date()
      }
    ];

    beforeEach(() => {
      // Mock req.user
      req.user = {
        userId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should list negotiations for a contratacao successfully', async () => {
      // Arrange
      req.params = { contratacaoId };

      // Mock Contratacao.findById
      (Contratacao.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockContratacao)
      });

      // Mock Negociacao.find
      const sortMock = jest.fn().mockReturnThis();
      const populateMock = jest.fn().mockResolvedValue(mockNegociacoes);
      (Negociacao.find as jest.Mock).mockReturnValue({
        sort: sortMock,
        populate: populateMock
      });

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(Negociacao.find).toHaveBeenCalledWith({ contratacaoId: contratacaoId });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(populateMock).toHaveBeenCalledWith('historico.autorId', 'nome foto');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNegociacoes);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Não autorizado.'
      }));
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if contratacaoId is invalid', async () => {
      // Arrange
      req.params = { contratacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ID da contratação inválido.'
      }));
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if contratacao is not found', async () => {
      // Arrange
      req.params = { contratacaoId };

      // Mock Contratacao.findById to return null
      (Contratacao.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Contratação não encontrada.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a participant in the contratacao', async () => {
      // Arrange
      const otherUserId = new mongoose.Types.ObjectId().toString();
      req.user = {
        userId: otherUserId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      req.params = { contratacaoId };

      // Mock Contratacao.findById
      (Contratacao.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockContratacao)
      });

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Acesso proibido: Você não participa desta contratação.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      req.params = { contratacaoId };

      const error = new Error('Test error');
      (Contratacao.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await negociacaoController.listarNegociacoesPorContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('obterDetalhesNegociacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const negociacaoId = new mongoose.Types.ObjectId().toString();

    const mockNegociacao = {
      _id: negociacaoId,
      buyerId: { toString: () => userId },
      prestadorId: { toString: () => new mongoose.Types.ObjectId().toString() },
      status: NegociacaoStatusEnum.AGUARDANDO_PRESTADOR,
      historico: []
    };

    beforeEach(() => {
      // Mock req.user
      req.user = {
        userId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };

      // Mock mongoose.Types.ObjectId.isValid
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
    });

    it('should get negotiation details successfully', async () => {
      // Arrange
      req.params = { negociacaoId };

      // Mock Negociacao.findById
      const populateBuyerMock = jest.fn().mockReturnThis();
      const populatePrestadorMock = jest.fn().mockResolvedValue(mockNegociacao);
      const populateHistoricoMock = jest.fn().mockReturnValue({
        populate: populateBuyerMock
      });
      (Negociacao.findById as jest.Mock).mockReturnValue({
        populate: populateHistoricoMock
      });
      (populateBuyerMock as jest.Mock).mockReturnValue({
        populate: populatePrestadorMock
      });

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(populateHistoricoMock).toHaveBeenCalledWith('historico.autorId', 'nome foto');
      expect(populateBuyerMock).toHaveBeenCalledWith('buyerId', 'nome foto');
      expect(populatePrestadorMock).toHaveBeenCalledWith('prestadorId', 'nome foto');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockNegociacao);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Não autorizado.'
      }));
      expect(Negociacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if negociacaoId is invalid', async () => {
      // Arrange
      req.params = { negociacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValueOnce(false);

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'ID da negociação inválido.'
      }));
      expect(Negociacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if negociacao is not found', async () => {
      // Arrange
      req.params = { negociacaoId };

      // Mock Negociacao.findById to return null
      const populateBuyerMock = jest.fn().mockReturnThis();
      const populatePrestadorMock = jest.fn().mockResolvedValue(null);
      const populateHistoricoMock = jest.fn().mockReturnValue({
        populate: populateBuyerMock
      });
      (Negociacao.findById as jest.Mock).mockReturnValue({
        populate: populateHistoricoMock
      });
      (populateBuyerMock as jest.Mock).mockReturnValue({
        populate: populatePrestadorMock
      });

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Negociação não encontrada.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a participant in the negotiation', async () => {
      // Arrange
      const otherUserId = new mongoose.Types.ObjectId().toString();
      req.user = {
        userId: otherUserId,
        tipoUsuario: TipoUsuarioEnum.COMPRADOR
      };
      req.params = { negociacaoId };

      // Mock Negociacao.findById
      const populateBuyerMock = jest.fn().mockReturnThis();
      const populatePrestadorMock = jest.fn().mockResolvedValue({
        ...mockNegociacao,
        buyerId: { toString: () => new mongoose.Types.ObjectId().toString() },
        prestadorId: { toString: () => new mongoose.Types.ObjectId().toString() }
      });
      const populateHistoricoMock = jest.fn().mockReturnValue({
        populate: populateBuyerMock
      });
      (Negociacao.findById as jest.Mock).mockReturnValue({
        populate: populateHistoricoMock
      });
      (populateBuyerMock as jest.Mock).mockReturnValue({
        populate: populatePrestadorMock
      });

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Acesso proibido: Você não participa desta negociação.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      req.params = { negociacaoId };

      const error = new Error('Test error');
      (Negociacao.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await negociacaoController.obterDetalhesNegociacao(req as Request, res as Response, next);

      // Assert
      expect(Negociacao.findById).toHaveBeenCalledWith(negociacaoId);
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
