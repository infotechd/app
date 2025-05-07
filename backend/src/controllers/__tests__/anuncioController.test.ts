import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as anuncioController from '../anuncioController';
import Anuncio, { IAnuncio, AnuncioStatusEnum, AnuncioTipoEnum } from '../../models/Anuncio';
import User, { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Anuncio');
jest.mock('../../models/User');

describe('Anuncio Controller', () => {
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

  describe('criarAnuncio', () => {
    const mockAnuncioData = {
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      imagens: ['imagem1.jpg', 'imagem2.jpg'],
      link: 'https://example.com',
      tipoAnuncio: AnuncioTipoEnum.CARD_FEED,
      dataInicioExibicao: new Date(),
      dataFimExibicao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      segmentacao: {
        regioes: ['São Paulo', 'Rio de Janeiro'],
        tiposUsuario: [TipoUsuarioEnum.COMPRADOR, TipoUsuarioEnum.PRESTADOR]
      }
    };

    it('should create a new ad as draft successfully', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = mockAnuncioData;

      const saveMock = jest.fn().mockResolvedValue({
        ...mockAnuncioData,
        anuncianteId: 'anunciante-id',
        status: AnuncioStatusEnum.RASCUNHO
      });

      (Anuncio as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await anuncioController.criarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio).toHaveBeenCalledWith({
        ...mockAnuncioData,
        anuncianteId: 'anunciante-id',
        status: AnuncioStatusEnum.RASCUNHO
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Anúncio criado como rascunho com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: 'comprador-id', tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = mockAnuncioData;

      // Act
      await anuncioController.criarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem criar anúncios.' });
      expect(Anuncio).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockAnuncioData;

      // Act
      await anuncioController.criarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem criar anúncios.' });
      expect(Anuncio).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = { imagens: ['imagem1.jpg'] }; // Missing titulo and conteudo

      // Act
      await anuncioController.criarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Título e conteúdo são obrigatórios.' });
      expect(Anuncio).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: 'anunciante-id', tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.body = mockAnuncioData;

      const error = new Error('Database error');
      (Anuncio as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(error)
      }));

      // Act
      await anuncioController.criarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('submeterParaRevisao', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      status: AnuncioStatusEnum.RASCUNHO,
      save: jest.fn()
    };

    it('should submit an ad for review successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(mockAnuncio);
      mockAnuncio.save.mockResolvedValue({
        ...mockAnuncio,
        status: AnuncioStatusEnum.PENDENTE_APROVACAO
      });

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(mockAnuncio.status).toBe(AnuncioStatusEnum.PENDENTE_APROVACAO);
      expect(mockAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Anúncio submetido para revisão com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { anuncioId };

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem submeter anúncios.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ad is not in draft status', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      const nonDraftAnuncio = {
        ...mockAnuncio,
        status: AnuncioStatusEnum.PENDENTE_APROVACAO
      };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(nonDraftAnuncio);

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Não é possível submeter para revisão um anúncio com status '${AnuncioStatusEnum.PENDENTE_APROVACAO}'. Só anúncios em Rascunho.` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      const error = new Error('Database error');
      (Anuncio.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.submeterParaRevisao(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarMeusAnuncios', () => {
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncios = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId,
        titulo: 'Anúncio 1',
        conteudo: 'Conteúdo do anúncio 1',
        status: AnuncioStatusEnum.RASCUNHO
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId,
        titulo: 'Anúncio 2',
        conteudo: 'Conteúdo do anúncio 2',
        status: AnuncioStatusEnum.PENDENTE_APROVACAO
      }
    ];

    it('should list ads belonging to the logged-in advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };

      (Anuncio.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAnuncios)
      });

      // Act
      await anuncioController.listarMeusAnuncios(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.find).toHaveBeenCalledWith({ anuncianteId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnuncios);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await anuncioController.listarMeusAnuncios(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas anunciantes podem listar seus anúncios.' });
      expect(Anuncio.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };

      const error = new Error('Database error');
      (Anuncio.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(error)
      });

      // Act
      await anuncioController.listarMeusAnuncios(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('obterMeuAnuncioDetalhes', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      status: AnuncioStatusEnum.RASCUNHO
    };

    it('should get details of a specific ad belonging to the logged-in advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act
      await anuncioController.obterMeuAnuncioDetalhes(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnuncio);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { anuncioId };

      // Act
      await anuncioController.obterMeuAnuncioDetalhes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.obterMeuAnuncioDetalhes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.obterMeuAnuncioDetalhes(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      const error = new Error('Database error');
      (Anuncio.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.obterMeuAnuncioDetalhes(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('atualizarAnuncio', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      status: AnuncioStatusEnum.RASCUNHO,
      imagens: [],
      save: jest.fn()
    };

    const updateData = {
      titulo: 'Anúncio Atualizado',
      conteudo: 'Conteúdo atualizado',
      imagens: ['nova-imagem.jpg']
    };

    it('should update an ad successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = updateData;

      (Anuncio.findOne as jest.Mock).mockResolvedValue(mockAnuncio);
      mockAnuncio.save.mockResolvedValue({
        ...mockAnuncio,
        ...updateData
      });

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(mockAnuncio.titulo).toBe(updateData.titulo);
      expect(mockAnuncio.conteudo).toBe(updateData.conteudo);
      expect(mockAnuncio.imagens).toBe(updateData.imagens);
      expect(mockAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Anúncio atualizado com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { anuncioId };
      req.body = updateData;

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId: 'invalid-id' };
      req.body = updateData;

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if update fields are not allowed', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { invalidField: 'value' };

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Atualização inválida! Campos não permitidos fornecidos.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = updateData;

      (Anuncio.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ad status does not allow updates', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = updateData;

      const approvedAnuncio = {
        ...mockAnuncio,
        status: AnuncioStatusEnum.APROVADO
      };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(approvedAnuncio);

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Não é possível editar um anúncio com status '${AnuncioStatusEnum.APROVADO}'.` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = updateData;

      const error = new Error('Database error');
      (Anuncio.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.atualizarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarAnunciosPublicos', () => {
    const mockAnuncios = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Anunciante 1',
          foto: 'foto1.jpg'
        },
        titulo: 'Anúncio Público 1',
        conteudo: 'Conteúdo do anúncio público 1',
        status: AnuncioStatusEnum.APROVADO
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Anunciante 2',
          foto: 'foto2.jpg'
        },
        titulo: 'Anúncio Público 2',
        conteudo: 'Conteúdo do anúncio público 2',
        status: AnuncioStatusEnum.APROVADO
      }
    ];

    it('should list public approved ads', async () => {
      // Arrange
      (Anuncio.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnuncios)
      });

      // Act
      await anuncioController.listarAnunciosPublicos(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.find).toHaveBeenCalledWith({ status: AnuncioStatusEnum.APROVADO });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnuncios);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      const error = new Error('Database error');
      (Anuncio.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });

      // Act
      await anuncioController.listarAnunciosPublicos(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('obterDetalhesAnuncioPublico', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId: {
        _id: anuncianteId,
        nome: 'Anunciante Teste',
        email: 'anunciante@teste.com',
        foto: 'foto.jpg'
      },
      titulo: 'Anúncio Público',
      conteudo: 'Conteúdo do anúncio público',
      status: AnuncioStatusEnum.APROVADO
    };

    it('should get details of a specific public ad', async () => {
      // Arrange
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockAnuncio)
      });

      // Act
      await anuncioController.obterDetalhesAnuncioPublico(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({
        _id: anuncioId,
        status: AnuncioStatusEnum.APROVADO
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnuncio);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.params = { anuncioId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.obterDetalhesAnuncioPublico(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or not approved', async () => {
      // Arrange
      req.params = { anuncioId };

      (Anuncio.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await anuncioController.obterDetalhesAnuncioPublico(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({
        _id: anuncioId,
        status: AnuncioStatusEnum.APROVADO
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não está ativo.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.params = { anuncioId };

      const error = new Error('Database error');
      (Anuncio.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await anuncioController.obterDetalhesAnuncioPublico(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('atualizarStatusAnuncioAnunciante', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      status: AnuncioStatusEnum.APROVADO,
      save: jest.fn()
    };

    it('should update ad status from APROVADO to PAUSADO successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.PAUSADO };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(mockAnuncio);
      mockAnuncio.save.mockResolvedValue({
        ...mockAnuncio,
        status: AnuncioStatusEnum.PAUSADO
      });

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(mockAnuncio.status).toBe(AnuncioStatusEnum.PAUSADO);
      expect(mockAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: `Status do anúncio atualizado para '${AnuncioStatusEnum.PAUSADO}'.`
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should update ad status from PAUSADO to APROVADO successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.APROVADO };

      const pausedAnuncio = {
        ...mockAnuncio,
        status: AnuncioStatusEnum.PAUSADO,
        rejeicaoMotivo: 'Algum motivo',
        save: jest.fn()
      };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(pausedAnuncio);
      pausedAnuncio.save.mockResolvedValue({
        ...pausedAnuncio,
        status: AnuncioStatusEnum.APROVADO,
        rejeicaoMotivo: undefined
      });

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(pausedAnuncio.status).toBe(AnuncioStatusEnum.APROVADO);
      expect(pausedAnuncio.rejeicaoMotivo).toBeUndefined();
      expect(pausedAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: `Status do anúncio atualizado para '${AnuncioStatusEnum.APROVADO}'.`
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.PAUSADO };

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId: 'invalid-id' };
      req.body = { status: AnuncioStatusEnum.PAUSADO };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if status is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: 'invalid-status' };

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Status inválido ou não fornecido.' });
      expect(Anuncio.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.PAUSADO };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if status transition is not allowed', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.PENDENTE_APROVACAO };

      (Anuncio.findOne as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOne).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Mudança de status de '${AnuncioStatusEnum.APROVADO}' para '${AnuncioStatusEnum.PENDENTE_APROVACAO}' não permitida por você.` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { status: AnuncioStatusEnum.PAUSADO };

      const error = new Error('Database error');
      (Anuncio.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.atualizarStatusAnuncioAnunciante(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('deletarAnuncio', () => {
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio de Teste',
      conteudo: 'Conteúdo do anúncio de teste',
      status: AnuncioStatusEnum.RASCUNHO
    };

    it('should delete an ad successfully', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOneAndDelete as jest.Mock).mockResolvedValue(mockAnuncio);

      // Act
      await anuncioController.deletarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOneAndDelete).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio deletado com sucesso.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an advertiser', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.params = { anuncioId };

      // Act
      await anuncioController.deletarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Anuncio.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId: 'invalid-id' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.deletarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findOneAndDelete).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found or does not belong to user', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      (Anuncio.findOneAndDelete as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.deletarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findOneAndDelete).toHaveBeenCalledWith({ _id: anuncioId, anuncianteId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado ou não pertence a você.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: anuncianteId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };

      const error = new Error('Database error');
      (Anuncio.findOneAndDelete as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.deletarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('listarAnunciosPendentes', () => {
    const adminId = new mongoose.Types.ObjectId().toString();

    const mockAnunciosPendentes = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Anunciante 1',
          email: 'anunciante1@teste.com'
        },
        titulo: 'Anúncio Pendente 1',
        conteudo: 'Conteúdo do anúncio pendente 1',
        status: AnuncioStatusEnum.PENDENTE_APROVACAO,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        anuncianteId: {
          _id: new mongoose.Types.ObjectId().toString(),
          nome: 'Anunciante 2',
          email: 'anunciante2@teste.com'
        },
        titulo: 'Anúncio Pendente 2',
        conteudo: 'Conteúdo do anúncio pendente 2',
        status: AnuncioStatusEnum.PENDENTE_APROVACAO,
        createdAt: new Date()
      }
    ];

    it('should list pending ads for admin', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };

      (Anuncio.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnunciosPendentes)
      });

      // Act
      await anuncioController.listarAnunciosPendentes(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.find).toHaveBeenCalledWith({ status: AnuncioStatusEnum.PENDENTE_APROVACAO });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAnunciosPendentes);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an admin', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };

      // Act
      await anuncioController.listarAnunciosPendentes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores.' });
      expect(Anuncio.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await anuncioController.listarAnunciosPendentes(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores.' });
      expect(Anuncio.find).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };

      const error = new Error('Database error');
      (Anuncio.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });

      // Act
      await anuncioController.listarAnunciosPendentes(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('revisarAnuncio', () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const anuncioId = new mongoose.Types.ObjectId().toString();
    const anuncianteId = new mongoose.Types.ObjectId().toString();

    const mockAnuncio = {
      _id: anuncioId,
      anuncianteId,
      titulo: 'Anúncio Pendente',
      conteudo: 'Conteúdo do anúncio pendente',
      status: AnuncioStatusEnum.PENDENTE_APROVACAO,
      rejeicaoMotivo: undefined,
      save: jest.fn()
    };

    it('should approve an ad successfully', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'aprovar' };

      (Anuncio.findById as jest.Mock).mockResolvedValue(mockAnuncio);
      mockAnuncio.save.mockResolvedValue({
        ...mockAnuncio,
        status: AnuncioStatusEnum.APROVADO,
        rejeicaoMotivo: undefined
      });

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findById).toHaveBeenCalledWith(anuncioId);
      expect(mockAnuncio.status).toBe(AnuncioStatusEnum.APROVADO);
      expect(mockAnuncio.rejeicaoMotivo).toBeUndefined();
      expect(mockAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Anúncio aprovado com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject an ad successfully', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'rejeitar', motivo: 'Conteúdo inadequado' };

      (Anuncio.findById as jest.Mock).mockResolvedValue(mockAnuncio);
      mockAnuncio.save.mockResolvedValue({
        ...mockAnuncio,
        status: AnuncioStatusEnum.REJEITADO,
        rejeicaoMotivo: 'Conteúdo inadequado'
      });

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findById).toHaveBeenCalledWith(anuncioId);
      expect(mockAnuncio.status).toBe(AnuncioStatusEnum.REJEITADO);
      expect(mockAnuncio.rejeicaoMotivo).toBe('Conteúdo inadequado');
      expect(mockAnuncio.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Anúncio rejeitado com sucesso.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an admin', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ANUNCIANTE };
      req.params = { anuncioId };
      req.body = { acao: 'aprovar' };

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas administradores.' });
      expect(Anuncio.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if anuncioId is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId: 'invalid-id' };
      req.body = { acao: 'aprovar' };

      // Mock mongoose.Types.ObjectId.isValid to return false
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do anúncio inválido.' });
      expect(Anuncio.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if action is invalid', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'invalid-action' };

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Ação inválida. Use 'aprovar' ou 'rejeitar'." });
      expect(Anuncio.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if rejecting without a reason', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'rejeitar' }; // Missing motivo

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Motivo da rejeição é obrigatório.' });
      expect(Anuncio.findById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if ad not found', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'aprovar' };

      (Anuncio.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findById).toHaveBeenCalledWith(anuncioId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Anúncio não encontrado.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if ad is not pending approval', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'aprovar' };

      const approvedAnuncio = {
        ...mockAnuncio,
        status: AnuncioStatusEnum.APROVADO
      };

      (Anuncio.findById as jest.Mock).mockResolvedValue(approvedAnuncio);

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(Anuncio.findById).toHaveBeenCalledWith(anuncioId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: `Este anúncio não está pendente de aprovação (status atual: ${AnuncioStatusEnum.APROVADO}).` 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: adminId, tipoUsuario: TipoUsuarioEnum.ADMIN };
      req.params = { anuncioId };
      req.body = { acao: 'aprovar' };

      const error = new Error('Database error');
      (Anuncio.findById as jest.Mock).mockRejectedValue(error);

      // Act
      await anuncioController.revisarAnuncio(req as Request, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
