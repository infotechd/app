import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as ofertaController from '../ofertaController';
import OfertaServico, { IOfertaServico, OfertaStatusEnum, IDisponibilidade } from '../../models/OfertaServico';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/OfertaServico');
jest.mock('mongoose');

describe('Oferta Controller', () => {
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

  describe('createOferta', () => {
    const mockOfertaData = {
      descricao: 'Serviço de teste',
      preco: 100,
      disponibilidade: {
        recorrenciaSemanal: [
          {
            diaSemana: 1,
            horarios: [{ inicio: '09:00', fim: '12:00' }]
          }
        ],
        duracaoMediaMinutos: 60,
        observacoes: 'Observações de teste'
      }
    };

    const mockSavedOferta = {
      _id: new mongoose.Types.ObjectId().toString(),
      prestadorId: new mongoose.Types.ObjectId().toString(),
      ...mockOfertaData,
      status: OfertaStatusEnum.RASCUNHO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a new offer successfully when user is a provider', async () => {
      // Arrange
      req.user = { userId: mockSavedOferta.prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockOfertaData;

      const saveMock = jest.fn().mockResolvedValue(mockSavedOferta);
      (OfertaServico as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await ofertaController.createOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico).toHaveBeenCalledWith({
        prestadorId: req.user.userId,
        descricao: mockOfertaData.descricao,
        preco: mockOfertaData.preco,
        status: OfertaStatusEnum.RASCUNHO,
        disponibilidade: mockOfertaData.disponibilidade
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Oferta criada como rascunho com sucesso.',
        oferta: mockSavedOferta
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a provider', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = mockOfertaData;

      // Act
      await ofertaController.createOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas prestadores podem criar ofertas.' });
      expect(OfertaServico).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockOfertaData;

      // Act
      await ofertaController.createOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas prestadores podem criar ofertas.' });
      expect(OfertaServico).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('listOfertasByPrestador', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const mockOfertas = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId,
        descricao: 'Oferta 1',
        preco: 100,
        status: OfertaStatusEnum.RASCUNHO,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId,
        descricao: 'Oferta 2',
        preco: 150,
        status: OfertaStatusEnum.DISPONIVEL,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list offers for the authenticated provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = { page: '1', limit: '10' };

      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockOfertas)
      });
      (OfertaServico.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await ofertaController.listOfertasByPrestador(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.find).toHaveBeenCalledWith({ prestadorId });
      expect(OfertaServico.countDocuments).toHaveBeenCalledWith({ prestadorId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        offers: mockOfertas,
        totalPages: 1,
        currentPage: 1,
        totalOffers: 2
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter offers by status if provided', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.query = { page: '1', limit: '10', status: OfertaStatusEnum.DISPONIVEL };

      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOfertas[1]])
      });
      (OfertaServico.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      await ofertaController.listOfertasByPrestador(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.find).toHaveBeenCalledWith({ 
        prestadorId, 
        status: OfertaStatusEnum.DISPONIVEL 
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        offers: [mockOfertas[1]],
        totalPages: 1,
        currentPage: 1,
        totalOffers: 1
      });
    });

    it('should return 403 if user is not a provider', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await ofertaController.listOfertasByPrestador(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(OfertaServico.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      const error = new Error('Database error');
      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(error)
      });

      // Act
      await ofertaController.listOfertasByPrestador(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getOwnOfertaDetails', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const ofertaId = new mongoose.Types.ObjectId().toString();
    const mockOferta = {
      _id: ofertaId,
      prestadorId,
      descricao: 'Oferta de teste',
      preco: 100,
      status: OfertaStatusEnum.RASCUNHO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return offer details for the authenticated provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (OfertaServico.findOne as jest.Mock).mockResolvedValue(mockOferta);
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      // Act
      await ofertaController.getOwnOfertaDetails(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(ofertaId);
      expect(OfertaServico.findOne).toHaveBeenCalledWith({ _id: ofertaId, prestadorId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOferta);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await ofertaController.getOwnOfertaDetails(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido.' });
      expect(OfertaServico.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if offer not found or does not belong to provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await ofertaController.getOwnOfertaDetails(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findOne).toHaveBeenCalledWith({ _id: ofertaId, prestadorId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta não encontrada ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a provider', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { ofertaId };

      // Act
      await ofertaController.getOwnOfertaDetails(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(OfertaServico.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (OfertaServico.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await ofertaController.getOwnOfertaDetails(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateOferta', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const ofertaId = new mongoose.Types.ObjectId().toString();
    const mockUpdateData = {
      descricao: 'Oferta atualizada',
      preco: 150,
      status: OfertaStatusEnum.DISPONIVEL
    };
    const mockUpdatedOferta = {
      _id: ofertaId,
      prestadorId,
      ...mockUpdateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update an offer successfully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      req.body = mockUpdateData;
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOneAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedOferta);

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(ofertaId);
      expect(OfertaServico.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ofertaId, prestadorId },
        { $set: mockUpdateData },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Oferta atualizada com sucesso.',
        oferta: mockUpdatedOferta
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields provided for update', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      req.body = { invalidField: 'value' };

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido.' });
      expect(OfertaServico.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId: 'invalid-id' };
      req.body = mockUpdateData;
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido.' });
      expect(OfertaServico.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if offer not found or does not belong to provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      req.body = mockUpdateData;
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Oferta não encontrada, não pertence a você ou não pode ser editada no status atual.' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a provider', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { ofertaId };
      req.body = mockUpdateData;

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(OfertaServico.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle validation errors from Mongoose', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      req.body = mockUpdateData;
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const validationError = new Error('Validation error') as any;
      validationError.name = 'ValidationError';
      validationError.errors = { preco: { message: 'Preço deve ser positivo' } };

      (OfertaServico.findOneAndUpdate as jest.Mock).mockRejectedValue(validationError);

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro de validação', errors: validationError.errors });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      req.body = mockUpdateData;
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);

      const error = new Error('Database error');
      (OfertaServico.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await ofertaController.updateOferta(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deleteOferta', () => {
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const ofertaId = new mongoose.Types.ObjectId().toString();
    const mockOferta = {
      _id: ofertaId,
      prestadorId,
      descricao: 'Oferta para deletar',
      preco: 100,
      status: OfertaStatusEnum.RASCUNHO
    };

    it('should delete an offer successfully', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOneAndDelete as jest.Mock).mockResolvedValue(mockOferta);

      // Act
      await ofertaController.deleteOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(ofertaId);
      expect(OfertaServico.findOneAndDelete).toHaveBeenCalledWith({ _id: ofertaId, prestadorId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta excluída com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await ofertaController.deleteOferta(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido.' });
      expect(OfertaServico.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if offer not found or does not belong to provider', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await ofertaController.deleteOferta(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findOneAndDelete).toHaveBeenCalledWith({ _id: ofertaId, prestadorId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta não encontrada ou você não tem permissão para excluí-la.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a provider', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { ofertaId };

      // Act
      await ofertaController.deleteOferta(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(OfertaServico.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: prestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (OfertaServico.findOneAndDelete as jest.Mock).mockRejectedValue(error);

      // Act
      await ofertaController.deleteOferta(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('searchPublicOfertas', () => {
    const mockOfertas = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId: new mongoose.Types.ObjectId().toString(),
        descricao: 'Oferta pública 1',
        preco: 100,
        status: OfertaStatusEnum.DISPONIVEL,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        prestadorId: new mongoose.Types.ObjectId().toString(),
        descricao: 'Oferta pública 2',
        preco: 150,
        status: OfertaStatusEnum.DISPONIVEL,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should list public offers with default pagination', async () => {
      // Arrange
      req.query = {};

      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockOfertas)
      });
      (OfertaServico.countDocuments as jest.Mock).mockResolvedValue(2);

      // Act
      await ofertaController.searchPublicOfertas(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.find).toHaveBeenCalledWith({ status: OfertaStatusEnum.DISPONIVEL });
      expect(OfertaServico.countDocuments).toHaveBeenCalledWith({ status: OfertaStatusEnum.DISPONIVEL });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ofertas: mockOfertas,
        totalPages: 1,
        currentPage: 1,
        totalOfertas: 2
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should filter offers by price range', async () => {
      // Arrange
      req.query = { precoMax: '120' };

      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([mockOfertas[0]])
      });
      (OfertaServico.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      await ofertaController.searchPublicOfertas(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.find).toHaveBeenCalledWith({ 
        status: OfertaStatusEnum.DISPONIVEL,
        preco: { $lte: 120 }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ofertas: [mockOfertas[0]],
        totalPages: 1,
        currentPage: 1,
        totalOfertas: 1
      });
    });

    it('should filter offers by text search', async () => {
      // Arrange
      req.query = { textoPesquisa: 'pública 1' };

      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([mockOfertas[0]])
      });
      (OfertaServico.countDocuments as jest.Mock).mockResolvedValue(1);

      // Act
      await ofertaController.searchPublicOfertas(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.find).toHaveBeenCalledWith(expect.objectContaining({ 
        status: OfertaStatusEnum.DISPONIVEL,
        $or: expect.any(Array)
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.query = {};
      const error = new Error('Database error');
      (OfertaServico.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await ofertaController.searchPublicOfertas(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPublicOfertaById', () => {
    const ofertaId = new mongoose.Types.ObjectId().toString();
    const prestadorId = new mongoose.Types.ObjectId().toString();
    const mockOferta = {
      _id: ofertaId,
      prestadorId,
      descricao: 'Oferta pública detalhada',
      preco: 100,
      status: OfertaStatusEnum.DISPONIVEL,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return public offer details by ID', async () => {
      // Arrange
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOferta)
      });

      // Act
      await ofertaController.getPublicOfertaById(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(ofertaId);
      expect(OfertaServico.findOne).toHaveBeenCalledWith({
        _id: ofertaId,
        status: OfertaStatusEnum.DISPONIVEL
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOferta);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ofertaId is invalid', async () => {
      // Arrange
      req.params = { ofertaId: 'invalid-id' };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await ofertaController.getPublicOfertaById(req as Request, res as Response, next);

      // Assert
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID da oferta inválido.' });
      expect(OfertaServico.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if offer not found or not available', async () => {
      // Arrange
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (OfertaServico.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await ofertaController.getPublicOfertaById(req as Request, res as Response, next);

      // Assert
      expect(OfertaServico.findOne).toHaveBeenCalledWith({
        _id: ofertaId,
        status: OfertaStatusEnum.DISPONIVEL
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Oferta não encontrada ou não está disponível.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.params = { ofertaId };
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (OfertaServico.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await ofertaController.getPublicOfertaById(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
