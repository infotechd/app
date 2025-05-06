import mongoose from 'mongoose';
import Anuncio, { IAnuncio, AnuncioStatusEnum, AnuncioTipoEnum } from '../Anuncio';
import { TipoUsuarioEnum } from '../User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid anuncio object
const createValidAnuncioData = () => ({
  anuncianteId: new mongoose.Types.ObjectId(),
  titulo: 'Anúncio de Teste',
  conteudo: 'Este é um conteúdo de teste para o anúncio',
  imagens: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  link: 'https://example.com/destino',
  status: AnuncioStatusEnum.RASCUNHO,
  tipoAnuncio: AnuncioTipoEnum.BANNER_TOPO,
  dataInicioExibicao: new Date(),
  dataFimExibicao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  segmentacao: {
    regioes: ['São Paulo', 'Rio de Janeiro'],
    tiposUsuario: [TipoUsuarioEnum.COMPRADOR, TipoUsuarioEnum.PRESTADOR]
  }
} as any); // Using 'as any' to allow property deletion in tests

describe('Anuncio Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create an anuncio with valid data', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.anuncianteId).toEqual(anuncioData.anuncianteId);
      expect(savedAnuncio.titulo).toBe(anuncioData.titulo);
      expect(savedAnuncio.conteudo).toBe(anuncioData.conteudo);
      expect(savedAnuncio.imagens).toEqual(anuncioData.imagens);
      expect(savedAnuncio.link).toBe(anuncioData.link);
      expect(savedAnuncio.status).toBe(anuncioData.status);
      expect(savedAnuncio.tipoAnuncio).toBe(anuncioData.tipoAnuncio);
      expect(savedAnuncio.dataInicioExibicao).toEqual(anuncioData.dataInicioExibicao);
      expect(savedAnuncio.dataFimExibicao).toEqual(anuncioData.dataFimExibicao);
      expect(savedAnuncio.segmentacao).toBeDefined();
      expect(savedAnuncio.segmentacao?.regioes).toEqual(anuncioData.segmentacao.regioes);
      expect(savedAnuncio.segmentacao?.tiposUsuario).toEqual(anuncioData.segmentacao.tiposUsuario);
      expect(savedAnuncio.createdAt).toBeDefined();
      expect(savedAnuncio.updatedAt).toBeDefined();
    });

    it('should require anuncianteId field', async () => {
      // Arrange
      const { anuncianteId, ...anuncioData } = createValidAnuncioData();

      // Act & Assert
      const anuncio = new Anuncio(anuncioData as any);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should require titulo field', async () => {
      // Arrange
      const { titulo, ...anuncioData } = createValidAnuncioData();

      // Act & Assert
      const anuncio = new Anuncio(anuncioData as any);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should require conteudo field', async () => {
      // Arrange
      const { conteudo, ...anuncioData } = createValidAnuncioData();

      // Act & Assert
      const anuncio = new Anuncio(anuncioData as any);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should validate titulo maximum length', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.titulo = 'a'.repeat(101); // Exceeds 100 character limit

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should validate conteudo maximum length', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.conteudo = 'a'.repeat(1001); // Exceeds 1000 character limit

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should validate link URL format', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.link = 'invalid-url';

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should allow link to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.link;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.link).toBeUndefined();
    });

    it('should set default status to RASCUNHO if not provided', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.status;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio.status).toBe(AnuncioStatusEnum.RASCUNHO);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.status = 'invalid_status' as any;

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should validate tipoAnuncio enum values', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.tipoAnuncio = 'invalid_tipo' as any;

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should allow tipoAnuncio to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.tipoAnuncio;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.tipoAnuncio).toBeUndefined();
    });

    it('should allow dataInicioExibicao to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.dataInicioExibicao;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.dataInicioExibicao).toBeUndefined();
    });

    it('should allow dataFimExibicao to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.dataFimExibicao;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.dataFimExibicao).toBeUndefined();
    });

    it('should validate that dataFimExibicao is after dataInicioExibicao', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.dataInicioExibicao = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      anuncioData.dataFimExibicao = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now (before dataInicioExibicao)

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should allow segmentacao to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.segmentacao;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.segmentacao).toBeUndefined();
    });

    it('should allow segmentacao.regioes to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.segmentacao.regioes;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.segmentacao?.regioes).toBeUndefined();
    });

    it('should allow segmentacao.tiposUsuario to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.segmentacao.tiposUsuario;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.segmentacao?.tiposUsuario).toBeUndefined();
    });

    it('should validate tiposUsuario enum values in segmentacao', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.segmentacao.tiposUsuario = ['invalid_tipo' as any];

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should allow motivoRejeicao to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.status = AnuncioStatusEnum.REJEITADO;
      anuncioData.motivoRejeicao = 'Conteúdo inadequado';

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.motivoRejeicao).toBe('Conteúdo inadequado');
    });

    it('should validate motivoRejeicao maximum length', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      anuncioData.status = AnuncioStatusEnum.REJEITADO;
      anuncioData.motivoRejeicao = 'a'.repeat(501); // Exceeds 500 character limit

      // Act & Assert
      const anuncio = new Anuncio(anuncioData);
      await expect(anuncio.save()).rejects.toThrow();
    });

    it('should allow imagens to be optional', async () => {
      // Arrange
      const anuncioData = createValidAnuncioData();
      delete anuncioData.imagens;

      // Act
      const anuncio = new Anuncio(anuncioData);
      const savedAnuncio = await anuncio.save();

      // Assert
      expect(savedAnuncio._id).toBeDefined();
      expect(savedAnuncio.imagens).toEqual([]);
    });
  });

  describe('Indexes', () => {
    it('should have an index on anuncianteId', async () => {
      // Check if the index exists
      const indexes = await Anuncio.collection.indexes();
      const anuncianteIndex = indexes.find(index => index.key.anuncianteId === 1);
      expect(anuncianteIndex).toBeDefined();
    });

    it('should have an index on status', async () => {
      // Check if the index exists
      const indexes = await Anuncio.collection.indexes();
      const statusIndex = indexes.find(index => index.key.status === 1);
      expect(statusIndex).toBeDefined();
    });

    it('should have an index on dataInicioExibicao', async () => {
      // Check if the index exists
      const indexes = await Anuncio.collection.indexes();
      const dataInicioIndex = indexes.find(index => index.key.dataInicioExibicao === 1);
      expect(dataInicioIndex).toBeDefined();
    });

    it('should have an index on dataFimExibicao', async () => {
      // Check if the index exists
      const indexes = await Anuncio.collection.indexes();
      const dataFimIndex = indexes.find(index => index.key.dataFimExibicao === 1);
      expect(dataFimIndex).toBeDefined();
    });

    it('should have a compound index on status, dataInicioExibicao, and dataFimExibicao', async () => {
      // Check if the compound index exists
      const indexes = await Anuncio.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key.status === 1 && 
          index.key.dataInicioExibicao === 1 && 
          index.key.dataFimExibicao === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have a compound index on status and segmentacao.tiposUsuario', async () => {
      // Check if the compound index exists
      const indexes = await Anuncio.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key.status === 1 && 
          index.key['segmentacao.tiposUsuario'] === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have a compound index on status and segmentacao.regioes', async () => {
      // Check if the compound index exists
      const indexes = await Anuncio.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key.status === 1 && 
          index.key['segmentacao.regioes'] === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Enum Values', () => {
    it('should have the correct values for AnuncioStatusEnum', () => {
      expect(AnuncioStatusEnum.RASCUNHO).toBe('rascunho');
      expect(AnuncioStatusEnum.PENDENTE_APROVACAO).toBe('pendente_aprovacao');
      expect(AnuncioStatusEnum.APROVADO).toBe('aprovado');
      expect(AnuncioStatusEnum.REJEITADO).toBe('rejeitado');
      expect(AnuncioStatusEnum.PAUSADO).toBe('pausado');
      expect(AnuncioStatusEnum.ENCERRADO).toBe('encerrado');
    });

    it('should have the correct values for AnuncioTipoEnum', () => {
      expect(AnuncioTipoEnum.BANNER_TOPO).toBe('banner_topo');
      expect(AnuncioTipoEnum.CARD_FEED).toBe('card_feed');
      expect(AnuncioTipoEnum.POPUP).toBe('popup');
      expect(AnuncioTipoEnum.OUTRO).toBe('outro');
    });
  });
});