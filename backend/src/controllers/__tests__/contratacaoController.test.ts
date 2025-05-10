import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as contratacaoController from '../contratacaoController';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../../models/Contratacao';
import OfertaServico, { IOfertaServico, OfertaStatusEnum } from '../../models/OfertaServico';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Contratacao');
jest.mock('../../models/OfertaServico');
jest.mock('mongoose');

describe('Contratacao Controller', () => {
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

  describe('contratarOferta', () => {
    const buyerId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const ofertaId = new mongoose.Types.ObjectId().toString();

    const mockOferta = {
      _id: ofertaId,
      prestadorId,
      descricao: 'Oferta de teste',
      preco: 100,
      status: OfertaStatusEnum.DISPONIVEL,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockContratacao = {
      _id: new mongoose.Types.ObjectId().toString(),
      buyerId,
      prestadorId,
      ofertaId,
      valorTotal: 100,
      status: ContratacaoStatusEnum.PENDENTE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new contract successfully when user is a buyer', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findById as jest.Mock).mockResolvedValue({
        ...mockOferta,
        prestadorId: {
          toString: () => prestadorId
        }
      });

      // Mock para verificar se já existe contratação
      (Contratacao.findOne as jest.Mock).mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(mockContratacao);
      (Contratacao as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(ofertaId);
      expect(OfertaServico.findById).toHaveBeenCalledWith(ofertaId);
      expect(Contratacao.findOne).toHaveBeenCalledWith({
        buyerId: buyerId,
        ofertaId: mockOferta._id,
        status: { 
          $in: [
            ContratacaoStatusEnum.PENDENTE, 
            ContratacaoStatusEnum.ACEITA, 
            ContratacaoStatusEnum.EM_ANDAMENTO
          ] 
        }
      });
      expect(Contratacao).toHaveBeenCalledWith({
        buyerId,
        prestadorId: mockOferta.prestadorId,
        ofertaId: mockOferta._id,
        valorTotal: mockOferta.preco,
        status: ContratacaoStatusEnum.PENDENTE
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Oferta contratada com sucesso. Aguardando aceite do prestador.',
        contratacao: mockContratacao
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a buyer', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = { ofertaId };

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas compradores podem contratar ofertas.' });
      expect(OfertaServico.findById).not.toHaveBeenCalled();
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = { ofertaId };

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas compradores podem contratar ofertas.' });
      expect(OfertaServico.findById).not.toHaveBeenCalled();
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido ou ausente.' });
      expect(OfertaServico.findById).not.toHaveBeenCalled();
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is missing', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = {};

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido ou ausente.' });
      expect(OfertaServico.findById).not.toHaveBeenCalled();
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if offer not found', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findById).toHaveBeenCalledWith(ofertaId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta não encontrada ou não está disponível para contratação.' });
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if offer is not available', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findById as jest.Mock).mockResolvedValue({
        ...mockOferta,
        status: OfertaStatusEnum.RASCUNHO,
        prestadorId: {
          toString: () => prestadorId
        }
      });

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findById).toHaveBeenCalledWith(ofertaId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta não encontrada ou não está disponível para contratação.' });
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if buyer tries to contract their own offer', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findById as jest.Mock).mockResolvedValue({
        ...mockOferta,
        prestadorId: {
          toString: () => prestadorId
        }
      });

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findById).toHaveBeenCalledWith(ofertaId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Você não pode contratar sua própria oferta.' });
      expect(Contratacao.findOne).not.toHaveBeenCalled();
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if buyer already has a pending or active contract for the offer', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findById as jest.Mock).mockResolvedValue({
        ...mockOferta,
        prestadorId: {
          toString: () => prestadorId
        }
      });

      // Mock para simular que já existe uma contratação
      (Contratacao.findOne as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId().toString(),
        buyerId,
        prestadorId,
        ofertaId,
        status: ContratacaoStatusEnum.PENDENTE
      });

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findById).toHaveBeenCalledWith(ofertaId);
      expect(Contratacao.findOne).toHaveBeenCalledWith({
        buyerId: buyerId,
        ofertaId: mockOferta._id,
        status: { 
          $in: [
            ContratacaoStatusEnum.PENDENTE, 
            ContratacaoStatusEnum.ACEITA, 
            ContratacaoStatusEnum.EM_ANDAMENTO
          ] 
        }
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Você já possui uma contratação pendente ou em andamento para esta oferta.' 
      });
      expect(Contratacao).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (OfertaServico.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await contratacaoController.contratarOferta(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  describe('listarMinhasContratacoes', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockContratacoes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        buyerId: userId,
        prestadorId: new mongoose.Types.ObjectId().toString(),
        ofertaId: new mongoose.Types.ObjectId().toString(),
        valorTotal: 100,
        status: ContratacaoStatusEnum.PENDENTE,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        buyerId: new mongoose.Types.ObjectId().toString(),
        prestadorId: userId,
        ofertaId: new mongoose.Types.ObjectId().toString(),
        valorTotal: 150,
        status: ContratacaoStatusEnum.ACEITA,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list contracts where user is buyer or provider', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      (Contratacao.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockContratacoes)
      });

      // Act
      await contratacaoController.listarMinhasContratacoes(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.find).toHaveBeenCalledWith({
        $or: [{ buyerId: userId }, { prestadorId: userId }]
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ contratacoes: mockContratacoes });
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter contracts by status if provided', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.query = { status: ContratacaoStatusEnum.PENDENTE };

      (Contratacao.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockContratacoes[0]])
      });

      // Act
      await contratacaoController.listarMinhasContratacoes(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.find).toHaveBeenCalledWith({
        $or: [{ buyerId: userId }, { prestadorId: userId }],
        status: ContratacaoStatusEnum.PENDENTE
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ contratacoes: [mockContratacoes[0]] });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await contratacaoController.listarMinhasContratacoes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Contratacao.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      const error = new Error('Database error');
      (Contratacao.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });

      // Act
      await contratacaoController.listarMinhasContratacoes(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('obterDetalhesContratacao', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();

    const mockContratacao = {
      _id: contratacaoId,
      buyerId: {
        _id: userId,
        nome: 'Comprador Teste',
        email: 'comprador@teste.com',
        foto: 'foto.jpg',
        telefone: '123456789'
      },
      prestadorId: {
        _id: prestadorId,
        nome: 'Prestador Teste',
        email: 'prestador@teste.com',
        foto: 'foto.jpg',
        telefone: '987654321'
      },
      ofertaId: {
        _id: new mongoose.Types.ObjectId().toString(),
        descricao: 'Oferta de teste',
        preco: 100
      },
      valorTotal: 100,
      status: ContratacaoStatusEnum.PENDENTE,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return contract details when user is buyer', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockContratacao)
      });

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(contratacaoId);
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockContratacao);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return contract details when user is provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockContratacao)
      });

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockContratacao);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { contratacaoId };

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if contratacaoId is invalid', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da contratação inválido.' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if contract not found', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contratação não encontrada.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a participant in the contract', async () => {
      // Arrange
      const otherUserId = new mongoose.Types.ObjectId().toString();
      req.user = { userId: otherUserId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockContratacao)
      });

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Você não participa desta contratação.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (Contratacao.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await contratacaoController.obterDetalhesContratacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('atualizarStatusContratacao', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const buyerId = new mongoose.Types.ObjectId().toString();
    const contratacaoId = new mongoose.Types.ObjectId().toString();

    const mockContratacao = {
      _id: contratacaoId,
      buyerId: buyerId,
      prestadorId: prestadorId,
      ofertaId: new mongoose.Types.ObjectId().toString(),
      valorTotal: 100,
      status: ContratacaoStatusEnum.PENDENTE,
      dataInicioServico: null,
      dataFimServico: null,
      save: jest.fn().mockResolvedValue({
        _id: contratacaoId,
        buyerId: buyerId,
        prestadorId: prestadorId,
        ofertaId: new mongoose.Types.ObjectId().toString(),
        valorTotal: 100,
        status: ContratacaoStatusEnum.ACEITA,
        dataInicioServico: null,
        dataFimServico: null
      })
    };

    beforeEach(() => {
      mockContratacao.status = ContratacaoStatusEnum.PENDENTE;
      mockContratacao.dataInicioServico = null;
      mockContratacao.dataFimServico = null;
      mockContratacao.save.mockClear();
    });

    it('should update contract status from PENDENTE to ACEITA when user is provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.ACEITA, dataInicioServico: '2025-05-15T10:00:00Z' };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(contratacaoId);
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Status da contratação atualizado.',
        contratacao: expect.any(Object)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should update contract status from ACEITA to EM_ANDAMENTO when user is provider and set dataInicioServico if not defined', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.EM_ANDAMENTO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        status: ContratacaoStatusEnum.ACEITA,
        dataInicioServico: null,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(mockContratacao.dataInicioServico).toBeInstanceOf(Date);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update contract status from ACEITA to EM_ANDAMENTO when user is provider and keep existing dataInicioServico', async () => {
      // Arrange
      const existingDate = new Date('2025-05-10T10:00:00Z');
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.EM_ANDAMENTO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        status: ContratacaoStatusEnum.ACEITA,
        dataInicioServico: existingDate,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(mockContratacao.dataInicioServico).toBe(existingDate);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update contract status from EM_ANDAMENTO to CONCLUIDO when user is provider and set dataFimServico', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.CONCLUIDO };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        status: ContratacaoStatusEnum.EM_ANDAMENTO,
        dataFimServico: null,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(mockContratacao.dataFimServico).toBeInstanceOf(Date);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update contract status to CANCELADO_BUYER when user is buyer', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.CANCELADO_BUYER };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        status: ContratacaoStatusEnum.PENDENTE,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should update contract status to CANCELADO_PRESTADOR when user is provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.CANCELADO_PRESTADOR };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        status: ContratacaoStatusEnum.PENDENTE,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(mockContratacao.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.ACEITA };

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if contratacaoId is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId: 'invalid-id' };
      req.body = { status: ContratacaoStatusEnum.ACEITA };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da contratação inválido.' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if status is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: 'INVALID_STATUS' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Status inválido fornecido: INVALID_STATUS' });
      expect(Contratacao.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if contract not found', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.ACEITA };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Contratação não encontrada.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have permission to change status', async () => {
      // Arrange
      req.user = { userId: buyerId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.ACEITA };

      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Contratacao.findById as jest.Mock).mockResolvedValue({
        ...mockContratacao,
        prestadorId: {
          toString: () => prestadorId
        },
        buyerId: {
          toString: () => buyerId
        }
      });

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(Contratacao.findById).toHaveBeenCalledWith(contratacaoId);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Ação não permitida: Impossível mudar status de ${ContratacaoStatusEnum.PENDENTE} para ${ContratacaoStatusEnum.ACEITA} ou você não tem permissão.` 
      });
      expect(mockContratacao.save).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { contratacaoId };
      req.body = { status: ContratacaoStatusEnum.ACEITA };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (Contratacao.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await contratacaoController.atualizarStatusContratacao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
