import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as treinamentoController from '../treinamentoController';
import Treinamento, { ITreinamento, TreinamentoStatusEnum, TreinamentoFormatoEnum } from '../../models/Treinamento';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Treinamento');
jest.mock('../../models/User');

describe('Treinamento Controller', () => {
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

  describe('createTreinamento', () => {
    const mockTreinamentoData = {
      titulo: 'Treinamento de Teste',
      descricao: 'Descrição do treinamento de teste',
      formato: TreinamentoFormatoEnum.VIDEO,
      conteudoUrl: 'https://example.com/video',
      dataHora: new Date(),
      preco: 99.99
    };

    it('should create a new training as draft successfully', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = mockTreinamentoData;

      const saveMock = jest.fn().mockResolvedValue({
        ...mockTreinamentoData,
        anuncianteId: 'anunciante-id',
        status: TreinamentoStatusEnum.RASCUNHO
      });

      (Treinamento as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(Treinamento).toHaveBeenCalledWith({
        ...mockTreinamentoData,
        anuncianteId: 'anunciante-id',
        status: TreinamentoStatusEnum.RASCUNHO
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Treinamento criado como rascunho.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: 'comprador-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = mockTreinamentoData;

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem criar treinamentos.' });
      expect(Treinamento).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockTreinamentoData;

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem criar treinamentos.' });
      expect(Treinamento).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = { titulo: 'Apenas título' }; // Missing other required fields

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Campos obrigatórios ausentes: titulo, descricao, formato, conteudoUrl.' });
      expect(Treinamento).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if formato is invalid', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = {
        ...mockTreinamentoData,
        formato: 'formato_invalido'
      };

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: `Formato inválido: formato_invalido` });
      expect(Treinamento).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if preco is negative', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = {
        ...mockTreinamentoData,
        preco: -10
      };

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Preço inválido.' });
      expect(Treinamento).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = mockTreinamentoData;

      const error = new Error('Database error');
      (Treinamento as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error)
      }));

      // Act
      await treinamentoController.createTreinamento(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateTreinamento', () => {
    const treinamentoId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockTreinamento = {
      _id: treinamentoId,
      anuncianteId,
      titulo: 'Treinamento de Teste',
      descricao: 'Descrição do treinamento de teste',
      formato: TreinamentoFormatoEnum.VIDEO,
      conteudoUrl: 'https://example.com/video',
      status: TreinamentoStatusEnum.RASCUNHO,
      save: jest.fn()
    };

    const updateData = {
      titulo: 'Treinamento Atualizado',
      descricao: 'Descrição atualizada',
      conteudoUrl: 'https://example.com/video-updated'
    };

    it('should update a training successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId };
      req.body = updateData;

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      (Treinamento.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockTreinamento,
        ...updateData
      });

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(Treinamento.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: treinamentoId,
          anuncianteId: anuncianteId,
          status: { $in: [TreinamentoStatusEnum.RASCUNHO, TreinamentoStatusEnum.REJEITADO] }
        },
        { $set: expect.any(Object) },
        { new: true, runValidators: true, context: 'query' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Treinamento atualizado com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { treinamentoId };
      req.body = updateData;

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Treinamento.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if treinamentoId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId: 'invalid-id' };
      req.body = updateData;

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do treinamento inválido.' });
      expect(Treinamento.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields for update are provided', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId };
      req.body = {}; // Empty update

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido.' });
      expect(Treinamento.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if training not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId };
      req.body = updateData;

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      (Treinamento.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(Treinamento.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Treinamento não encontrado, não pertence a você, ou não pode ser editado no status atual.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId };
      req.body = updateData;

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      const error = new Error('Database error');
      (Treinamento.findOneAndUpdate as jest.Mock).mockRejectedValue(error);

      // Act
      await treinamentoController.updateTreinamento(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarMeusTreinamentos', () => {
    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await treinamentoController.listarMeusTreinamentos(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 501 as the endpoint is not implemented', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };

      // Act
      await treinamentoController.listarMeusTreinamentos(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint listarMeusTreinamentos não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteTreinamento', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.params = { treinamentoId: 'treinamento-id' };

      // Act
      await treinamentoController.deleteTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Não autorizado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 501 as the endpoint is not implemented', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId: 'treinamento-id' };

      // Act
      await treinamentoController.deleteTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint deleteTreinamento não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('submeterOuPublicarTreinamento', () => {
    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: 'user-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { treinamentoId: 'treinamento-id' };

      // Act
      await treinamentoController.submeterOuPublicarTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 501 as the endpoint is not implemented', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { treinamentoId: 'treinamento-id' };

      // Act
      await treinamentoController.submeterOuPublicarTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint submeterOuPublicarTreinamento não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getPublicTreinamentos', () => {
    const mockTreinamentos = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        titulo: 'Treinamento Público 1',
        descricao: 'Descrição do treinamento público 1',
        formato: TreinamentoFormatoEnum.VIDEO,
        status: TreinamentoStatusEnum.PUBLICADO
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        titulo: 'Treinamento Público 2',
        descricao: 'Descrição do treinamento público 2',
        formato: TreinamentoFormatoEnum.PDF,
        status: TreinamentoStatusEnum.PUBLICADO
      }
    ];

    it('should list public trainings successfully', async () => {
      // Arrange
      (Treinamento.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockTreinamentos)
        })
      });

      // Act
      await treinamentoController.getPublicTreinamentos(req as Request, res as Response, next);

      // Assert
      expect(Treinamento.find).toHaveBeenCalledWith({ status: TreinamentoStatusEnum.PUBLICADO });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ treinamentos: mockTreinamentos });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (Treinamento.find as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act
      await treinamentoController.getPublicTreinamentos(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPublicTreinamentoById', () => {
    const treinamentoId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockTreinamento = {
      _id: treinamentoId,
      anuncianteId: {
        _id: anuncianteId,
        nome: 'Anunciante Teste',
        foto: 'foto.jpg'
      },
      titulo: 'Treinamento Público',
      descricao: 'Descrição do treinamento público',
      formato: TreinamentoFormatoEnum.VIDEO,
      conteudoUrl: 'https://example.com/video',
      status: TreinamentoStatusEnum.PUBLICADO
    };

    it('should get details of a specific public training', async () => {
      // Arrange
      req.params = { treinamentoId };

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      (Treinamento.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockTreinamento)
      });

      // Act
      await treinamentoController.getPublicTreinamentoById(req as Request, res as Response, next);

      // Assert
      expect(Treinamento.findOne).toHaveBeenCalledWith({
        _id: treinamentoId,
        status: TreinamentoStatusEnum.PUBLICADO
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTreinamento);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if treinamentoId is invalid', async () => {
      // Arrange
      req.params = { treinamentoId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await treinamentoController.getPublicTreinamentoById(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do treinamento inválido.' });
      expect(Treinamento.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if training not found or not published', async () => {
      // Arrange
      req.params = { treinamentoId };

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      (Treinamento.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await treinamentoController.getPublicTreinamentoById(req as Request, res as Response, next);

      // Assert
      expect(Treinamento.findOne).toHaveBeenCalledWith({
        _id: treinamentoId,
        status: TreinamentoStatusEnum.PUBLICADO
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Treinamento não encontrado ou não está publicado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.params = { treinamentoId };

      // Mock mongoose.Types.ObjectId.isValid to return true
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);

      const error = new Error('Database error');
      (Treinamento.findOne as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act
      await treinamentoController.getPublicTreinamentoById(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarTreinamentosPendentes', () => {
    it('should return 501 as the endpoint is not implemented', async () => {
      // Act
      await treinamentoController.listarTreinamentosPendentes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint listarTreinamentosPendentes não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('revisarTreinamento', () => {
    it('should return 501 as the endpoint is not implemented', async () => {
      // Act
      await treinamentoController.revisarTreinamento(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(501);
      expect(res.json).toHaveBeenCalledWith({ message: 'Endpoint revisarTreinamento não implementado.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
