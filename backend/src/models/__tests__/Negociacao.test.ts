import mongoose from 'mongoose';
import Negociacao, { INegociacao, HistoricoNegociacaoTipoEnum, NegociacaoStatusEnum } from '../Negociacao';
import User from '../User';
import Contratacao from '../Contratacao';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid negociacao object
const createValidNegociacaoData = () => ({
  contratacaoId: new mongoose.Types.ObjectId(),
  buyerId: new mongoose.Types.ObjectId(),
  prestadorId: new mongoose.Types.ObjectId(),
  historico: [
    {
      autorId: new mongoose.Types.ObjectId(),
      tipo: HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER,
      dados: {
        novoPreco: 100,
        novoPrazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        observacoes: 'Proposta inicial para o serviço'
      },
      timestamp: new Date()
    }
  ],
  status: NegociacaoStatusEnum.INICIADA,
  termosFinais: undefined
} as any); // Using 'as any' to allow property deletion in tests

describe('Negociacao Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a negociacao with valid data', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao._id).toBeDefined();
      expect(savedNegociacao.contratacaoId).toEqual(negociacaoData.contratacaoId);
      expect(savedNegociacao.buyerId).toEqual(negociacaoData.buyerId);
      expect(savedNegociacao.prestadorId).toEqual(negociacaoData.prestadorId);
      expect(savedNegociacao.status).toBe(negociacaoData.status);
      expect(savedNegociacao.historico.length).toBe(1);
      expect(savedNegociacao.historico[0].tipo).toBe(HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER);
      expect(savedNegociacao.createdAt).toBeDefined();
      expect(savedNegociacao.updatedAt).toBeDefined();
    });

    it('should require contratacaoId field', async () => {
      // Arrange
      const { contratacaoId, ...negociacaoData } = createValidNegociacaoData();

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData as any);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require buyerId field', async () => {
      // Arrange
      const { buyerId, ...negociacaoData } = createValidNegociacaoData();

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData as any);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require prestadorId field', async () => {
      // Arrange
      const { prestadorId, ...negociacaoData } = createValidNegociacaoData();

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData as any);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require historico field', async () => {
      // Arrange
      const { historico, ...negociacaoData } = createValidNegociacaoData();

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData as any);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should validate that historico has at least one item', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.historico = [];

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow(/pelo menos a proposta inicial/);
    });

    it('should set default status to INICIADA if not provided', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.status;

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.status).toBe(NegociacaoStatusEnum.INICIADA);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.status = 'invalid_status' as any;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should allow termosFinais to be optional', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.termosFinais = undefined;

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao._id).toBeDefined();
      expect(savedNegociacao.termosFinais).toBeUndefined();
    });

    it('should allow setting termosFinais with valid data', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      const prazoFinal = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      negociacaoData.termosFinais = {
        precoFinal: 150,
        prazoFinal
      };

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.termosFinais).toBeDefined();
      expect(savedNegociacao.termosFinais?.precoFinal).toBe(150);
      expect(savedNegociacao.termosFinais?.prazoFinal).toBeInstanceOf(Date);
      expect(savedNegociacao.termosFinais?.prazoFinal?.getTime()).toBe(prazoFinal.getTime());
    });

    it('should allow setting termosFinais with only precoFinal', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.termosFinais = {
        precoFinal: 200
      };

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.termosFinais).toBeDefined();
      expect(savedNegociacao.termosFinais?.precoFinal).toBe(200);
      expect(savedNegociacao.termosFinais?.prazoFinal).toBeUndefined();
    });

    it('should allow setting termosFinais with only prazoFinal', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      const prazoFinal = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
      negociacaoData.termosFinais = {
        prazoFinal
      };

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.termosFinais).toBeDefined();
      expect(savedNegociacao.termosFinais?.precoFinal).toBeUndefined();
      expect(savedNegociacao.termosFinais?.prazoFinal).toBeInstanceOf(Date);
      expect(savedNegociacao.termosFinais?.prazoFinal?.getTime()).toBe(prazoFinal.getTime());
    });
  });

  describe('Historico Item Validation', () => {
    it('should require autorId in historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].autorId;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require tipo in historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].tipo;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should validate tipo enum values in historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.historico[0].tipo = 'invalid_tipo' as any;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require dados in historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].dados;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should require observacoes in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].dados.observacoes;

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow(/Observações são obrigatórias/);
    });

    it('should validate observacoes maximum length in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.historico[0].dados.observacoes = 'a'.repeat(1001); // Exceeds 1000 character limit

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow();
    });

    it('should trim whitespace from observacoes in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.historico[0].dados.observacoes = '  Observação com espaços extras  ';

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.historico[0].dados.observacoes).toBe('Observação com espaços extras');
    });

    it('should validate novoPreco minimum value in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      negociacaoData.historico[0].dados.novoPreco = -1; // Below minimum (0)

      // Act & Assert
      const negociacao = new Negociacao(negociacaoData);
      await expect(negociacao.save()).rejects.toThrow(/preço proposto não pode ser negativo/);
    });

    it('should allow novoPreco to be optional in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].dados.novoPreco;

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao._id).toBeDefined();
      expect(savedNegociacao.historico[0].dados.novoPreco).toBeUndefined();
    });

    it('should allow novoPrazo to be optional in dados of historico items', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].dados.novoPrazo;

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao._id).toBeDefined();
      expect(savedNegociacao.historico[0].dados.novoPrazo).toBeUndefined();
    });

    it('should set timestamp automatically for historico items if not provided', async () => {
      // Arrange
      const negociacaoData = createValidNegociacaoData();
      delete negociacaoData.historico[0].timestamp;

      // Act
      const negociacao = new Negociacao(negociacaoData);
      const savedNegociacao = await negociacao.save();

      // Assert
      expect(savedNegociacao.historico[0].timestamp).toBeDefined();
      expect(savedNegociacao.historico[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should have an index on contratacaoId', async () => {
      // Check if the index exists
      const indexes = await Negociacao.collection.indexes();
      const contratacaoIndex = indexes.find(index => index.key.contratacaoId === 1);
      expect(contratacaoIndex).toBeDefined();
    });

    it('should have an index on buyerId', async () => {
      // Check if the index exists
      const indexes = await Negociacao.collection.indexes();
      const buyerIndex = indexes.find(index => index.key.buyerId === 1);
      expect(buyerIndex).toBeDefined();
    });

    it('should have an index on prestadorId', async () => {
      // Check if the index exists
      const indexes = await Negociacao.collection.indexes();
      const prestadorIndex = indexes.find(index => index.key.prestadorId === 1);
      expect(prestadorIndex).toBeDefined();
    });

    it('should have an index on status', async () => {
      // Check if the index exists
      const indexes = await Negociacao.collection.indexes();
      const statusIndex = indexes.find(index => index.key.status === 1);
      expect(statusIndex).toBeDefined();
    });

    it('should have a compound index on prestadorId and status', async () => {
      // Check if the compound index exists
      const indexes = await Negociacao.collection.indexes();
      const compoundIndex = indexes.find(
        index => index.key.prestadorId === 1 && index.key.status === 1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have a compound index on buyerId and status', async () => {
      // Check if the compound index exists
      const indexes = await Negociacao.collection.indexes();
      const compoundIndex = indexes.find(
        index => index.key.buyerId === 1 && index.key.status === 1
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Enum Values', () => {
    it('should have the correct values for HistoricoNegociacaoTipoEnum', () => {
      expect(HistoricoNegociacaoTipoEnum.PROPOSTA_BUYER).toBe('proposta_buyer');
      expect(HistoricoNegociacaoTipoEnum.RESPOSTA_PRESTADOR).toBe('resposta_prestador');
      expect(HistoricoNegociacaoTipoEnum.MENSAGEM_SIMPLES).toBe('mensagem_simples');
    });

    it('should have the correct values for NegociacaoStatusEnum', () => {
      expect(NegociacaoStatusEnum.INICIADA).toBe('iniciada');
      expect(NegociacaoStatusEnum.AGUARDANDO_PRESTADOR).toBe('aguardando_prestador');
      expect(NegociacaoStatusEnum.AGUARDANDO_BUYER).toBe('aguardando_buyer');
      expect(NegociacaoStatusEnum.ACEITA).toBe('aceita');
      expect(NegociacaoStatusEnum.REJEITADA).toBe('rejeitada');
      expect(NegociacaoStatusEnum.CANCELADA).toBe('cancelada');
    });
  });
});
