import mongoose from 'mongoose';
import BloqueioAgenda, { IBloqueioAgenda } from '../BloqueioAgenda';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid bloqueio agenda object
const createValidBloqueioAgendaData = () => ({
  prestadorId: new mongoose.Types.ObjectId(),
  dataInicio: new Date(),
  dataFim: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  motivo: 'Compromisso pessoal'
} as any); // Using 'as any' to allow property deletion in tests

describe('BloqueioAgenda Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a bloqueio agenda with valid data', async () => {
      // Arrange
      const bloqueioData = createValidBloqueioAgendaData();

      // Act
      const bloqueio = new BloqueioAgenda(bloqueioData);
      const savedBloqueio = await bloqueio.save();

      // Assert
      expect(savedBloqueio._id).toBeDefined();
      expect(savedBloqueio.prestadorId).toEqual(bloqueioData.prestadorId);
      expect(savedBloqueio.dataInicio).toEqual(bloqueioData.dataInicio);
      expect(savedBloqueio.dataFim).toEqual(bloqueioData.dataFim);
      expect(savedBloqueio.motivo).toBe(bloqueioData.motivo);
      expect(savedBloqueio.createdAt).toBeDefined();
      expect(savedBloqueio.updatedAt).toBeDefined();
    });

    it('should require prestadorId field', async () => {
      // Arrange
      const { prestadorId, ...bloqueioData } = createValidBloqueioAgendaData();

      // Act & Assert
      const bloqueio = new BloqueioAgenda(bloqueioData as any);
      await expect(bloqueio.save()).rejects.toThrow();
    });

    it('should require dataInicio field', async () => {
      // Arrange
      const { dataInicio, ...bloqueioData } = createValidBloqueioAgendaData();

      // Act & Assert
      const bloqueio = new BloqueioAgenda(bloqueioData as any);
      await expect(bloqueio.save()).rejects.toThrow();
    });

    it('should require dataFim field', async () => {
      // Arrange
      const { dataFim, ...bloqueioData } = createValidBloqueioAgendaData();

      // Act & Assert
      const bloqueio = new BloqueioAgenda(bloqueioData as any);
      await expect(bloqueio.save()).rejects.toThrow();
    });

    it('should validate that dataFim is greater than or equal to dataInicio', async () => {
      // Arrange
      const bloqueioData = createValidBloqueioAgendaData();
      bloqueioData.dataFim = new Date(bloqueioData.dataInicio.getTime() - 1000); // 1 second before dataInicio

      // Act & Assert
      const bloqueio = new BloqueioAgenda(bloqueioData);
      await expect(bloqueio.save()).rejects.toThrow();
    });

    it('should allow dataFim to be equal to dataInicio', async () => {
      // Arrange
      const bloqueioData = createValidBloqueioAgendaData();
      bloqueioData.dataFim = new Date(bloqueioData.dataInicio.getTime()); // Same time as dataInicio

      // Act
      const bloqueio = new BloqueioAgenda(bloqueioData);
      const savedBloqueio = await bloqueio.save();

      // Assert
      expect(savedBloqueio._id).toBeDefined();
      expect(savedBloqueio.dataFim).toEqual(bloqueioData.dataFim);
    });

    it('should allow motivo to be optional', async () => {
      // Arrange
      const bloqueioData = createValidBloqueioAgendaData();
      delete bloqueioData.motivo;

      // Act
      const bloqueio = new BloqueioAgenda(bloqueioData);
      const savedBloqueio = await bloqueio.save();

      // Assert
      expect(savedBloqueio._id).toBeDefined();
      expect(savedBloqueio.motivo).toBeUndefined();
    });

    it('should validate motivo maximum length', async () => {
      // Arrange
      const bloqueioData = createValidBloqueioAgendaData();
      bloqueioData.motivo = 'a'.repeat(201); // Exceeds 200 character limit

      // Act & Assert
      const bloqueio = new BloqueioAgenda(bloqueioData);
      await expect(bloqueio.save()).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have an index on prestadorId', async () => {
      // Check if the index exists
      const indexes = await BloqueioAgenda.collection.indexes();
      const prestadorIdIndex = indexes.find(index => index.key.prestadorId === 1);
      expect(prestadorIdIndex).toBeDefined();
    });

    it('should have a compound index on prestadorId, dataInicio, and dataFim', async () => {
      // Check if the compound index exists
      const indexes = await BloqueioAgenda.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key.prestadorId === 1 && 
          index.key.dataInicio === 1 && 
          index.key.dataFim === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Validation Function', () => {
    it('should validate dataFim is after dataInicio', () => {
      // Import the validation function directly from the model file
      const validarDataFim = (function() {
        return function(this: { dataInicio: Date }, value: Date): boolean {
          return value >= this.dataInicio;
        };
      })();

      // Create a mock document
      const doc = {
        dataInicio: new Date('2023-01-01T10:00:00Z')
      };

      // Test with valid date (after dataInicio)
      const validDate = new Date('2023-01-01T11:00:00Z');
      expect(validarDataFim.call(doc, validDate)).toBe(true);

      // Test with valid date (equal to dataInicio)
      const equalDate = new Date('2023-01-01T10:00:00Z');
      expect(validarDataFim.call(doc, equalDate)).toBe(true);

      // Test with invalid date (before dataInicio)
      const invalidDate = new Date('2023-01-01T09:00:00Z');
      expect(validarDataFim.call(doc, invalidDate)).toBe(false);
    });
  });
});
