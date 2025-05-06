import mongoose from 'mongoose';
import InscricaoTreinamento, { IInscricaoTreinamento, StatusProgressoEnum } from '../InscricaoTreinamento';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid inscricaoTreinamento object
const createValidInscricaoTreinamentoData = () => ({
  usuarioId: new mongoose.Types.ObjectId(),
  treinamentoId: new mongoose.Types.ObjectId(),
  statusProgresso: StatusProgressoEnum.NAO_INICIADO,
} as any); // Using 'as any' to allow property deletion in tests

describe('InscricaoTreinamento Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create an inscricaoTreinamento with valid data', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.usuarioId).toEqual(inscricaoData.usuarioId);
      expect(savedInscricao.treinamentoId).toEqual(inscricaoData.treinamentoId);
      expect(savedInscricao.statusProgresso).toBe(inscricaoData.statusProgresso);
      expect(savedInscricao.createdAt).toBeDefined();
      expect(savedInscricao.updatedAt).toBeDefined();
    });

    it('should require usuarioId field', async () => {
      // Arrange
      const { usuarioId, ...inscricaoData } = createValidInscricaoTreinamentoData();

      // Act & Assert
      const inscricao = new InscricaoTreinamento(inscricaoData as any);
      await expect(inscricao.save()).rejects.toThrow();
    });

    it('should require treinamentoId field', async () => {
      // Arrange
      const { treinamentoId, ...inscricaoData } = createValidInscricaoTreinamentoData();

      // Act & Assert
      const inscricao = new InscricaoTreinamento(inscricaoData as any);
      await expect(inscricao.save()).rejects.toThrow();
    });

    it('should set default statusProgresso to NAO_INICIADO if not provided', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      delete inscricaoData.statusProgresso;

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao.statusProgresso).toBe(StatusProgressoEnum.NAO_INICIADO);
    });

    it('should validate statusProgresso enum values', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.statusProgresso = 'invalid_status' as any;

      // Act & Assert
      const inscricao = new InscricaoTreinamento(inscricaoData);
      await expect(inscricao.save()).rejects.toThrow();
    });

    it('should allow dataConclusao to be optional', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.dataConclusao = undefined;

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.dataConclusao).toBeUndefined();
    });

    it('should allow setting dataConclusao with valid date', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.statusProgresso = StatusProgressoEnum.CONCLUIDO;
      inscricaoData.dataConclusao = new Date();

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao.dataConclusao).toBeInstanceOf(Date);
    });

    it('should allow pagamentoId to be optional', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.pagamentoId = undefined;

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.pagamentoId).toBeUndefined();
    });

    it('should allow setting pagamentoId with valid ObjectId', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.pagamentoId = new mongoose.Types.ObjectId();

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao.pagamentoId).toEqual(inscricaoData.pagamentoId);
    });

    it('should allow certificadoUrl to be optional', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.certificadoUrl = undefined;

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.certificadoUrl).toBeUndefined();
    });

    it('should allow setting certificadoUrl with valid string', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.certificadoUrl = 'https://example.com/certificate.pdf';

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao.certificadoUrl).toBe('https://example.com/certificate.pdf');
    });

    it('should trim whitespace from certificadoUrl', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.certificadoUrl = '  https://example.com/certificate.pdf  ';

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao.certificadoUrl).toBe('https://example.com/certificate.pdf');
    });
  });

  describe('Special Validations', () => {
    it('should allow setting statusProgresso to CONCLUIDO with dataConclusao', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.statusProgresso = StatusProgressoEnum.CONCLUIDO;
      inscricaoData.dataConclusao = new Date();

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.statusProgresso).toBe(StatusProgressoEnum.CONCLUIDO);
      expect(savedInscricao.dataConclusao).toBeInstanceOf(Date);
    });

    it('should allow setting statusProgresso to EM_ANDAMENTO', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();
      inscricaoData.statusProgresso = StatusProgressoEnum.EM_ANDAMENTO;

      // Act
      const inscricao = new InscricaoTreinamento(inscricaoData);
      const savedInscricao = await inscricao.save();

      // Assert
      expect(savedInscricao._id).toBeDefined();
      expect(savedInscricao.statusProgresso).toBe(StatusProgressoEnum.EM_ANDAMENTO);
    });
  });

  describe('Indexes', () => {
    it('should have an index on usuarioId', async () => {
      // Check if the index exists
      const indexes = await InscricaoTreinamento.collection.indexes();
      const usuarioIdIndex = indexes.find(index => index.key.usuarioId === 1);
      expect(usuarioIdIndex).toBeDefined();
    });

    it('should have an index on treinamentoId', async () => {
      // Check if the index exists
      const indexes = await InscricaoTreinamento.collection.indexes();
      const treinamentoIdIndex = indexes.find(index => index.key.treinamentoId === 1);
      expect(treinamentoIdIndex).toBeDefined();
    });

    it('should have an index on statusProgresso', async () => {
      // Check if the index exists
      const indexes = await InscricaoTreinamento.collection.indexes();
      const statusProgressoIndex = indexes.find(index => index.key.statusProgresso === 1);
      expect(statusProgressoIndex).toBeDefined();
    });

    it('should have a compound index on usuarioId and treinamentoId', async () => {
      // Check if the compound index exists
      const indexes = await InscricaoTreinamento.collection.indexes();
      const compoundIndex = indexes.find(
        index => index.key.usuarioId === 1 && index.key.treinamentoId === 1
      );
      expect(compoundIndex).toBeDefined();
      expect(compoundIndex?.unique).toBe(true);
    });

    it('should have a compound index on usuarioId and statusProgresso', async () => {
      // Check if the compound index exists
      const indexes = await InscricaoTreinamento.collection.indexes();
      const compoundIndex = indexes.find(
        index => index.key.usuarioId === 1 && index.key.statusProgresso === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Enum Values', () => {
    it('should have the correct values for StatusProgressoEnum', () => {
      expect(StatusProgressoEnum.NAO_INICIADO).toBe('nao_iniciado');
      expect(StatusProgressoEnum.EM_ANDAMENTO).toBe('em_andamento');
      expect(StatusProgressoEnum.CONCLUIDO).toBe('concluido');
    });
  });

  describe('Unique Constraints', () => {
    it('should not allow duplicate inscricao for the same usuario and treinamento', async () => {
      // Arrange
      const inscricaoData = createValidInscricaoTreinamentoData();

      // Act - Save the first inscription
      const inscricao1 = new InscricaoTreinamento(inscricaoData);
      await inscricao1.save();

      // Act & Assert - Try to save a duplicate inscription
      const inscricao2 = new InscricaoTreinamento(inscricaoData);
      await expect(inscricao2.save()).rejects.toThrow();
    });

    it('should allow different usuarios to enroll in the same treinamento', async () => {
      // Arrange
      const inscricaoData1 = createValidInscricaoTreinamentoData();
      const inscricaoData2 = createValidInscricaoTreinamentoData();
      inscricaoData2.usuarioId = new mongoose.Types.ObjectId(); // Different user

      // Act - Save both inscriptions
      const inscricao1 = new InscricaoTreinamento(inscricaoData1);
      await inscricao1.save();

      const inscricao2 = new InscricaoTreinamento(inscricaoData2);
      const savedInscricao2 = await inscricao2.save();

      // Assert
      expect(savedInscricao2._id).toBeDefined();
    });

    it('should allow the same usuario to enroll in different treinamentos', async () => {
      // Arrange
      const inscricaoData1 = createValidInscricaoTreinamentoData();
      const inscricaoData2 = createValidInscricaoTreinamentoData();
      inscricaoData2.treinamentoId = new mongoose.Types.ObjectId(); // Different training

      // Act - Save both inscriptions
      const inscricao1 = new InscricaoTreinamento(inscricaoData1);
      await inscricao1.save();

      const inscricao2 = new InscricaoTreinamento(inscricaoData2);
      const savedInscricao2 = await inscricao2.save();

      // Assert
      expect(savedInscricao2._id).toBeDefined();
    });
  });
});
