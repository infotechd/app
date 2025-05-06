import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import * as curriculoController from '../curriculoController';
import Curriculo, { ICurriculo, IExperiencia, IProjeto } from '../../models/Curriculo';
import { TipoUsuarioEnum } from '../../models/User';

// Mock dependencies
jest.mock('../../models/Curriculo');
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    }
  };
});

describe('Curriculo Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      body: {},
      user: undefined,
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createCurriculo', () => {
    const mockPrestadorId = new mongoose.Types.ObjectId().toString();
    const mockCurriculoData = {
      resumoProfissional: 'Desenvolvedor com experiência em Node.js e React',
      experiencias: [
        {
          cargo: 'Desenvolvedor Full Stack',
          empresa: 'Tech Solutions',
          periodoInicio: new Date('2020-01-01'),
          periodoFim: new Date('2022-01-01'),
          descricao: 'Desenvolvimento de aplicações web'
        }
      ],
      habilidades: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      projetos: [
        {
          nome: 'E-commerce Platform',
          descricao: 'Plataforma de comércio eletrônico',
          link: 'https://example.com/project',
          imagemUrl: 'https://example.com/image.jpg'
        }
      ]
    };

    it('should create a curriculo successfully for a prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockCurriculoData;
      
      (Curriculo.findOne as jest.Mock).mockResolvedValue(null);
      
      const saveMock = jest.fn().mockResolvedValue({
        ...mockCurriculoData,
        prestadorId: mockPrestadorId,
        _id: new mongoose.Types.ObjectId().toString()
      });
      
      (Curriculo as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(Curriculo).toHaveBeenCalledWith({
        prestadorId: mockPrestadorId,
        ...mockCurriculoData
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Currículo cadastrado com sucesso.',
        curriculo: expect.any(Object)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = mockCurriculoData;

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas prestadores podem criar currículos.' });
      expect(Curriculo.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockCurriculoData;

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido: Apenas prestadores podem criar currículos.' });
      expect(Curriculo.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 409 if curriculo already exists for the prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockCurriculoData;
      
      (Curriculo.findOne as jest.Mock).mockResolvedValue({ prestadorId: mockPrestadorId });

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conflito: Já existe um currículo para este prestador.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle duplicate key error from database', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockCurriculoData;
      
      (Curriculo.findOne as jest.Mock).mockResolvedValue(null);
      
      const error = new Error('Duplicate key error');
      (error as any).code = 11000;
      
      const saveMock = jest.fn().mockRejectedValue(error);
      (Curriculo as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock
      }));

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Conflito: Já existe um currículo para este prestador (erro BD).' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockCurriculoData;
      
      const error = new Error('Database error');
      (Curriculo.findOne as jest.Mock).mockRejectedValue(error);

      // Act
      await curriculoController.createCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getCurriculoByPrestador', () => {
    const mockPrestadorId = new mongoose.Types.ObjectId().toString();
    const mockCurriculo = {
      _id: new mongoose.Types.ObjectId().toString(),
      prestadorId: {
        _id: mockPrestadorId,
        nome: 'Prestador Teste',
        email: 'prestador@example.com',
        foto: 'foto.jpg'
      },
      resumoProfissional: 'Desenvolvedor com experiência em Node.js e React',
      experiencias: [
        {
          cargo: 'Desenvolvedor Full Stack',
          empresa: 'Tech Solutions',
          periodoInicio: new Date('2020-01-01'),
          periodoFim: new Date('2022-01-01'),
          descricao: 'Desenvolvimento de aplicações web'
        }
      ],
      habilidades: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      projetos: [
        {
          nome: 'E-commerce Platform',
          descricao: 'Plataforma de comércio eletrônico',
          link: 'https://example.com/project',
          imagemUrl: 'https://example.com/image.jpg'
        }
      ]
    };

    it('should get curriculo for the authenticated prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCurriculo)
      });

      // Act
      await curriculoController.getCurriculoByPrestador(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCurriculo);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };

      // Act
      await curriculoController.getCurriculoByPrestador(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Curriculo.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;

      // Act
      await curriculoController.getCurriculoByPrestador(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Curriculo.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no curriculo found for the prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await curriculoController.getCurriculoByPrestador(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum currículo encontrado para este prestador.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      
      const error = new Error('Database error');
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await curriculoController.getCurriculoByPrestador(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('updateCurriculo', () => {
    const mockPrestadorId = new mongoose.Types.ObjectId().toString();
    const mockUpdateData = {
      resumoProfissional: 'Desenvolvedor atualizado com experiência em Node.js, React e Angular',
      habilidades: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Angular']
    };
    const mockUpdatedCurriculo = {
      _id: new mongoose.Types.ObjectId().toString(),
      prestadorId: mockPrestadorId,
      ...mockUpdateData
    };

    it('should update curriculo successfully for a prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockUpdateData;
      
      (Curriculo.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedCurriculo)
      });

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOneAndUpdate).toHaveBeenCalledWith(
        { prestadorId: mockPrestadorId },
        { $set: mockUpdateData },
        { new: true, runValidators: true, context: 'query', upsert: false }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Currículo atualizado com sucesso.',
        curriculo: mockUpdatedCurriculo
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.COMPRADOR };
      req.body = mockUpdateData;

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Curriculo.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not authenticated', async () => {
      // Arrange
      req.user = undefined;
      req.body = mockUpdateData;

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Acesso proibido.' });
      expect(Curriculo.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if no valid fields provided for update', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = { invalidField: 'value' };

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum campo válido para atualização fornecido.' });
      expect(Curriculo.findOneAndUpdate).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no curriculo found for the prestador', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockUpdateData;
      
      (Curriculo.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Currículo não encontrado para este prestador. Crie um primeiro.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.user = { userId: mockPrestadorId, tipoUsuario: TipoUsuarioEnum.PRESTADOR };
      req.body = mockUpdateData;
      
      const error = new Error('Database error');
      (Curriculo.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      // Act
      await curriculoController.updateCurriculo(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOneAndUpdate).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getPublicCurriculoByUserId', () => {
    const mockPrestadorId = new mongoose.Types.ObjectId().toString();
    const mockCurriculo = {
      _id: new mongoose.Types.ObjectId().toString(),
      prestadorId: {
        _id: mockPrestadorId,
        nome: 'Prestador Teste',
        foto: 'foto.jpg',
        tipoUsuario: TipoUsuarioEnum.PRESTADOR
      },
      resumoProfissional: 'Desenvolvedor com experiência em Node.js e React',
      experiencias: [
        {
          cargo: 'Desenvolvedor Full Stack',
          empresa: 'Tech Solutions',
          periodoInicio: new Date('2020-01-01'),
          periodoFim: new Date('2022-01-01'),
          descricao: 'Desenvolvimento de aplicações web'
        }
      ],
      habilidades: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      projetos: [
        {
          nome: 'E-commerce Platform',
          descricao: 'Plataforma de comércio eletrônico',
          link: 'https://example.com/project',
          imagemUrl: 'https://example.com/image.jpg'
        }
      ]
    };

    it('should get public curriculo by prestador ID', async () => {
      // Arrange
      req.params = { prestadorId: mockPrestadorId };
      
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCurriculo)
      });

      // Act
      await curriculoController.getPublicCurriculoByUserId(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCurriculo);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 if prestador ID is invalid', async () => {
      // Arrange
      req.params = { prestadorId: 'invalid-id' };
      
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(false);

      // Act
      await curriculoController.getPublicCurriculoByUserId(req as Request, res as Response, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID do prestador inválido.' });
      expect(Curriculo.findOne).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if no curriculo found for the prestador', async () => {
      // Arrange
      req.params = { prestadorId: mockPrestadorId };
      
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Act
      await curriculoController.getPublicCurriculoByUserId(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Currículo não encontrado para este prestador.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if an exception occurs', async () => {
      // Arrange
      req.params = { prestadorId: mockPrestadorId };
      
      (mongoose.Types.ObjectId.isValid as jest.Mock).mockReturnValue(true);
      const error = new Error('Database error');
      (Curriculo.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(error)
      });

      // Act
      await curriculoController.getPublicCurriculoByUserId(req as Request, res as Response, next);

      // Assert
      expect(Curriculo.findOne).toHaveBeenCalledWith({ prestadorId: mockPrestadorId });
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});