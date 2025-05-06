import mongoose from 'mongoose';
import Treinamento, { ITreinamento, TreinamentoFormatoEnum, TreinamentoStatusEnum } from '../Treinamento';
import { IUser } from '../User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid treinamento object
const createValidTreinamentoData = () => ({
  anuncianteId: new mongoose.Types.ObjectId(),
  titulo: 'Curso de TypeScript Avançado',
  descricao: 'Um curso completo sobre TypeScript para desenvolvedores experientes',
  formato: TreinamentoFormatoEnum.VIDEO,
  conteudoUrl: 'https://example.com/curso-typescript',
  preco: 99.90,
  status: TreinamentoStatusEnum.RASCUNHO
} as any); // Using 'as any' to allow property deletion in tests

describe('Treinamento Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a treinamento with valid data', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.anuncianteId).toEqual(treinamentoData.anuncianteId);
      expect(savedTreinamento.titulo).toBe(treinamentoData.titulo);
      expect(savedTreinamento.descricao).toBe(treinamentoData.descricao);
      expect(savedTreinamento.formato).toBe(treinamentoData.formato);
      expect(savedTreinamento.conteudoUrl).toBe(treinamentoData.conteudoUrl);
      expect(savedTreinamento.preco).toBe(treinamentoData.preco);
      expect(savedTreinamento.status).toBe(treinamentoData.status);
      expect(savedTreinamento.createdAt).toBeDefined();
      expect(savedTreinamento.updatedAt).toBeDefined();
    });

    it('should require anuncianteId field', async () => {
      // Arrange
      const { anuncianteId, ...treinamentoData } = createValidTreinamentoData();

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData as any);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should require titulo field', async () => {
      // Arrange
      const { titulo, ...treinamentoData } = createValidTreinamentoData();

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData as any);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should require descricao field', async () => {
      // Arrange
      const { descricao, ...treinamentoData } = createValidTreinamentoData();

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData as any);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should require formato field', async () => {
      // Arrange
      const { formato, ...treinamentoData } = createValidTreinamentoData();

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData as any);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should require conteudoUrl field', async () => {
      // Arrange
      const { conteudoUrl, ...treinamentoData } = createValidTreinamentoData();

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData as any);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should set default preco to 0 if not provided', async () => {
      // Arrange
      const { preco, ...treinamentoData } = createValidTreinamentoData();

      // Act
      const treinamento = new Treinamento(treinamentoData as any);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.preco).toBe(0);
    });

    it('should set default status to RASCUNHO if not provided', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      delete treinamentoData.status;

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento.status).toBe(TreinamentoStatusEnum.RASCUNHO);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.status = 'invalid_status' as any;

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should validate formato enum values', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.formato = 'invalid_formato' as any;

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should validate titulo maximum length', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.titulo = 'a'.repeat(151); // Exceeds 150 character limit

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should validate descricao maximum length', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.descricao = 'a'.repeat(2001); // Exceeds 2000 character limit

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should validate preco minimum value', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.preco = -1; // Below minimum (0)

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should validate conteudoUrl format', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.conteudoUrl = 'invalid-url';

      // Act & Assert
      const treinamento = new Treinamento(treinamentoData);
      await expect(treinamento.save()).rejects.toThrow();
    });

    it('should allow motivoRejeicao to be optional', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.motivoRejeicao = undefined;

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.motivoRejeicao).toBeUndefined();
    });

    it('should allow setting motivoRejeicao with valid data', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.status = TreinamentoStatusEnum.REJEITADO;
      treinamentoData.motivoRejeicao = 'Conteúdo não atende aos padrões de qualidade';

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento.motivoRejeicao).toBe('Conteúdo não atende aos padrões de qualidade');
    });

    it('should trim whitespace from titulo', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.titulo = '  Curso de TypeScript Avançado  ';

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento.titulo).toBe('Curso de TypeScript Avançado');
    });

    it('should trim whitespace from descricao', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.descricao = '  Descrição com espaços extras  ';

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento.descricao).toBe('Descrição com espaços extras');
    });

    it('should trim whitespace from conteudoUrl', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.conteudoUrl = '  https://example.com/curso  ';

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento.conteudoUrl).toBe('https://example.com/curso');
    });
  });

  describe('Special Validations', () => {
    it('should allow webinar format with dataHora', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.formato = TreinamentoFormatoEnum.WEBINAR;
      treinamentoData.dataHora = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.formato).toBe(TreinamentoFormatoEnum.WEBINAR);
      expect(savedTreinamento.dataHora).toBeInstanceOf(Date);
    });

    it('should allow dataHora to be undefined for non-webinar formats', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.formato = TreinamentoFormatoEnum.VIDEO;
      treinamentoData.dataHora = undefined;

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.dataHora).toBeUndefined();
    });

    it('should accept valid dataHora for webinar format', async () => {
      // Arrange
      const treinamentoData = createValidTreinamentoData();
      treinamentoData.formato = TreinamentoFormatoEnum.WEBINAR;
      treinamentoData.dataHora = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Act
      const treinamento = new Treinamento(treinamentoData);
      const savedTreinamento = await treinamento.save();

      // Assert
      expect(savedTreinamento._id).toBeDefined();
      expect(savedTreinamento.dataHora).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should have an index on anuncianteId', async () => {
      // Check if the index exists
      const indexes = await Treinamento.collection.indexes();
      const anuncianteIndex = indexes.find(index => index.key.anuncianteId === 1);
      expect(anuncianteIndex).toBeDefined();
    });

    it('should have an index on formato', async () => {
      // Check if the index exists
      const indexes = await Treinamento.collection.indexes();
      const formatoIndex = indexes.find(index => index.key.formato === 1);
      expect(formatoIndex).toBeDefined();
    });

    it('should have an index on status', async () => {
      // Check if the index exists
      const indexes = await Treinamento.collection.indexes();
      const statusIndex = indexes.find(index => index.key.status === 1);
      expect(statusIndex).toBeDefined();
    });
  });

  describe('Enum Values', () => {
    it('should have the correct values for TreinamentoFormatoEnum', () => {
      expect(TreinamentoFormatoEnum.VIDEO).toBe('video');
      expect(TreinamentoFormatoEnum.PDF).toBe('pdf');
      expect(TreinamentoFormatoEnum.WEBINAR).toBe('webinar');
      expect(TreinamentoFormatoEnum.ARTIGO).toBe('artigo');
      expect(TreinamentoFormatoEnum.CURSO_INTERATIVO).toBe('curso_interativo');
      expect(TreinamentoFormatoEnum.LINK_EXTERNO).toBe('link_externo');
    });

    it('should have the correct values for TreinamentoStatusEnum', () => {
      expect(TreinamentoStatusEnum.RASCUNHO).toBe('rascunho');
      expect(TreinamentoStatusEnum.PENDENTE_REVISAO).toBe('pendente_revisao');
      expect(TreinamentoStatusEnum.PUBLICADO).toBe('publicado');
      expect(TreinamentoStatusEnum.REJEITADO).toBe('rejeitado');
      expect(TreinamentoStatusEnum.ARQUIVADO).toBe('arquivado');
    });
  });
});
