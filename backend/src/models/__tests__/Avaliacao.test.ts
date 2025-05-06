import mongoose from 'mongoose';
import Avaliacao, { IAvaliacao } from '../Avaliacao';
import User from '../User';
import Contratacao from '../Contratacao';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid avaliacao object
const createValidAvaliacaoData = () => ({
  contratacaoId: new mongoose.Types.ObjectId(),
  autor: new mongoose.Types.ObjectId(),
  receptor: new mongoose.Types.ObjectId(),
  nota: 4,
  comentario: 'Excelente serviço, recomendo!' as string | undefined
});

describe('Avaliacao Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database and reset mocks between tests
  afterEach(async () => {
    jest.clearAllMocks();
    await Avaliacao.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create an avaliacao with valid data', async () => {
      // Arrange
      const avaliacaoData = createValidAvaliacaoData();

      // Act
      const avaliacao = new Avaliacao(avaliacaoData);
      const savedAvaliacao = await avaliacao.save();

      // Assert
      expect(savedAvaliacao._id).toBeDefined();
      expect(savedAvaliacao.contratacaoId).toEqual(avaliacaoData.contratacaoId);
      expect(savedAvaliacao.autor).toEqual(avaliacaoData.autor);
      expect(savedAvaliacao.receptor).toEqual(avaliacaoData.receptor);
      expect(savedAvaliacao.nota).toBe(avaliacaoData.nota);
      expect(savedAvaliacao.comentario).toBe(avaliacaoData.comentario);
      expect(savedAvaliacao.createdAt).toBeDefined();
      expect(savedAvaliacao.updatedAt).toBeDefined();
    });

    it('should require contratacaoId field', async () => {
      // Arrange
      const { contratacaoId, ...avaliacaoData } = createValidAvaliacaoData();

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData as any);
      await expect(avaliacao.save()).rejects.toThrow(/contratação.*obrigatória/);
    });

    it('should require autor field', async () => {
      // Arrange
      const { autor, ...avaliacaoData } = createValidAvaliacaoData();

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData as any);
      await expect(avaliacao.save()).rejects.toThrow(/autor.*obrigatório/);
    });

    it('should require receptor field', async () => {
      // Arrange
      const { receptor, ...avaliacaoData } = createValidAvaliacaoData();

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData as any);
      await expect(avaliacao.save()).rejects.toThrow(/receptor.*obrigatório/);
    });

    it('should require nota field', async () => {
      // Arrange
      const { nota, ...avaliacaoData } = createValidAvaliacaoData();

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData as any);
      await expect(avaliacao.save()).rejects.toThrow(/nota.*obrigatória/);
    });

    it('should validate nota minimum value', async () => {
      // Arrange
      const avaliacaoData = createValidAvaliacaoData();
      avaliacaoData.nota = 0; // Below minimum (1)

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData);
      await expect(avaliacao.save()).rejects.toThrow(/nota mínima/);
    });

    it('should validate nota maximum value', async () => {
      // Arrange
      const avaliacaoData = createValidAvaliacaoData();
      avaliacaoData.nota = 6; // Above maximum (5)

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData);
      await expect(avaliacao.save()).rejects.toThrow(/nota máxima/);
    });

    it('should allow comentario to be optional', async () => {
      // Arrange
      const avaliacaoData = createValidAvaliacaoData();
      avaliacaoData.comentario = undefined;

      // Act
      const avaliacao = new Avaliacao(avaliacaoData);
      const savedAvaliacao = await avaliacao.save();

      // Assert
      expect(savedAvaliacao._id).toBeDefined();
      expect(savedAvaliacao.comentario).toBeUndefined();
    });

    it('should validate comentario maximum length', async () => {
      // Arrange
      const avaliacaoData = createValidAvaliacaoData();
      avaliacaoData.comentario = 'a'.repeat(1001); // Exceeds 1000 character limit

      // Act & Assert
      const avaliacao = new Avaliacao(avaliacaoData);
      await expect(avaliacao.save()).rejects.toThrow(/comentário.*exceder 1000/);
    });

    it('should enforce unique constraint on autor, receptor, and contratacaoId', async () => {
      // Arrange
      const avaliacaoData1 = createValidAvaliacaoData();
      const avaliacaoData2 = { ...createValidAvaliacaoData() };

      // Use the same IDs to trigger the unique constraint
      avaliacaoData2.autor = avaliacaoData1.autor;
      avaliacaoData2.receptor = avaliacaoData1.receptor;
      avaliacaoData2.contratacaoId = avaliacaoData1.contratacaoId;

      // Act & Assert
      await new Avaliacao(avaliacaoData1).save();
      await expect(new Avaliacao(avaliacaoData2).save()).rejects.toThrow(/duplicate key/);
    });
  });

  describe('Indexes', () => {
    it('should have an index on receptor and createdAt', async () => {
      // This is a more advanced test that checks if the index exists
      // We can check the collection's indexes
      const indexes = await Avaliacao.collection.indexes();

      // Find the index on receptor and createdAt
      const receptorIndex = indexes.find(
        index => 
          index.key.receptor === 1 && 
          index.key.createdAt === -1
      );

      expect(receptorIndex).toBeDefined();
    });

    it('should have a unique compound index on autor, receptor, and contratacaoId', async () => {
      // Check if the unique compound index exists
      const indexes = await Avaliacao.collection.indexes();

      // Find the unique compound index
      const uniqueIndex = indexes.find(
        index => 
          index.key.autor === 1 && 
          index.key.receptor === 1 && 
          index.key.contratacaoId === 1 && 
          index.unique === true
      );

      expect(uniqueIndex).toBeDefined();
    });
  });
});
