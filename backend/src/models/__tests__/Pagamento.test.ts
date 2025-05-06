import mongoose from 'mongoose';
import Pagamento, { IPagamento, PagamentoStatusEnum, PagamentoMetodoEnum } from '../Pagamento';
import { Types } from 'mongoose';

// Helper function to create a valid payment object
const createValidPagamentoData = () => ({
  contratacaoId: new mongoose.Types.ObjectId(), // Mock ObjectId for contratacaoId
  valor: 100.00,
  metodo: PagamentoMetodoEnum.PIX,
  historicoStatus: [{
    status: PagamentoStatusEnum.CRIADO,
    timestamp: new Date(),
    motivo: 'Pagamento criado'
  }]
});

describe('Pagamento Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database between tests
  afterEach(async () => {
    await Pagamento.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a payment with valid data', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Act
      const pagamento = new Pagamento(pagamentoData);
      const savedPagamento = await pagamento.save();

      // Assert
      expect(savedPagamento._id).toBeDefined();
      expect(savedPagamento.contratacaoId).toEqual(pagamentoData.contratacaoId);
      expect(savedPagamento.valor).toBe(pagamentoData.valor);
      expect(savedPagamento.metodo).toBe(pagamentoData.metodo);
      expect(savedPagamento.historicoStatus.length).toBe(1);
      expect(savedPagamento.historicoStatus[0].status).toBe(PagamentoStatusEnum.CRIADO);
      expect(savedPagamento.createdAt).toBeDefined();
      expect(savedPagamento.updatedAt).toBeDefined();
    });

    it('should require contratacaoId field', async () => {
      // Arrange
      const { contratacaoId, ...pagamentoData } = createValidPagamentoData();

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData as any);
      await expect(pagamento.save()).rejects.toThrow(/contratação é obrigatória/);
    });

    it('should require valor field', async () => {
      // Arrange
      const { valor, ...pagamentoData } = createValidPagamentoData();

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData as any);
      await expect(pagamento.save()).rejects.toThrow(/valor do pagamento é obrigatório/);
    });

    it('should require metodo field', async () => {
      // Arrange
      const { metodo, ...pagamentoData } = createValidPagamentoData();

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData as any);
      await expect(pagamento.save()).rejects.toThrow(/método de pagamento é obrigatório/);
    });

    it('should require historicoStatus field', async () => {
      // Arrange
      const { historicoStatus, ...pagamentoData } = createValidPagamentoData();

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData as any);
      await expect(pagamento.save()).rejects.toThrow(/histórico de status/);
    });

    it('should validate minimum valor value', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      pagamentoData.valor = 0; // Below minimum

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData);
      await expect(pagamento.save()).rejects.toThrow(/valor do pagamento deve ser positivo/);
    });

    it('should validate metodo enum values', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      pagamentoData.metodo = 'invalid_method' as PagamentoMetodoEnum;

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData);
      await expect(pagamento.save()).rejects.toThrow(/Método de pagamento inválido/);
    });

    it('should validate status enum values in historicoStatus', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      pagamentoData.historicoStatus[0].status = 'invalid_status' as PagamentoStatusEnum;

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData);
      await expect(pagamento.save()).rejects.toThrow(/is not a valid enum value/);
    });

    it('should require status field in historicoStatus items', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      // @ts-ignore - Deliberately removing required field for test
      delete pagamentoData.historicoStatus[0].status;

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData);
      await expect(pagamento.save()).rejects.toThrow(/status.*required/);
    });

    it('should validate historicoStatus has at least one item', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      pagamentoData.historicoStatus = [];

      // Act & Assert
      const pagamento = new Pagamento(pagamentoData);
      await expect(pagamento.save()).rejects.toThrow(/histórico de status deve conter pelo menos o status inicial/);
    });

    it('should enforce unique transacaoId constraint when provided', async () => {
      // Arrange
      const pagamentoData1 = createValidPagamentoData();
      const pagamentoData2 = createValidPagamentoData();

      // Add the same transacaoId to both
      pagamentoData1.transacaoId = 'TX123456';
      pagamentoData2.transacaoId = 'TX123456';

      // Act & Assert
      await new Pagamento(pagamentoData1).save();
      await expect(new Pagamento(pagamentoData2).save()).rejects.toThrow(/duplicate key/);
    });

    it('should allow null/undefined transacaoId without violating uniqueness', async () => {
      // Arrange
      const pagamentoData1 = createValidPagamentoData();
      const pagamentoData2 = createValidPagamentoData();

      // Both have undefined transacaoId

      // Act & Assert
      await new Pagamento(pagamentoData1).save();
      const savedPagamento2 = await new Pagamento(pagamentoData2).save();

      expect(savedPagamento2._id).toBeDefined();
    });
  });

  describe('Status Management', () => {
    it('should allow adding a new status to an existing payment', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Initial status should be CRIADO
      expect(pagamento.statusAtual).toBe(PagamentoStatusEnum.CRIADO);

      // Act - Add a new status
      pagamento.historicoStatus.push({
        status: PagamentoStatusEnum.APROVADO,
        timestamp: new Date(),
        motivo: 'Pagamento aprovado pela operadora'
      });
      await pagamento.save();

      // Assert
      const updatedPagamento = await Pagamento.findById(pagamento._id);
      expect(updatedPagamento).toBeDefined();
      expect(updatedPagamento!.historicoStatus.length).toBe(2);
      expect(updatedPagamento!.statusAtual).toBe(PagamentoStatusEnum.APROVADO);
    });

    it('should maintain status history in chronological order', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Add multiple status entries with different timestamps
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const twoHoursAgo = new Date(now.getTime() - 7200000);

      pagamentoData.historicoStatus = [
        {
          status: PagamentoStatusEnum.CRIADO,
          timestamp: twoHoursAgo,
          motivo: 'Pagamento criado'
        },
        {
          status: PagamentoStatusEnum.PENDENTE,
          timestamp: oneHourAgo,
          motivo: 'Aguardando processamento'
        },
        {
          status: PagamentoStatusEnum.APROVADO,
          timestamp: now,
          motivo: 'Pagamento aprovado'
        }
      ];

      // Act
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Assert
      expect(pagamento.historicoStatus.length).toBe(3);
      expect(pagamento.historicoStatus[0].status).toBe(PagamentoStatusEnum.CRIADO);
      expect(pagamento.historicoStatus[1].status).toBe(PagamentoStatusEnum.PENDENTE);
      expect(pagamento.historicoStatus[2].status).toBe(PagamentoStatusEnum.APROVADO);
      expect(pagamento.statusAtual).toBe(PagamentoStatusEnum.APROVADO);
    });

    it('should store and retrieve complex metadata in historicoStatus', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Create a complex metadata object that might come from a payment processor
      const complexMetadata = {
        transactionDetails: {
          processorId: 'PROC123456',
          authCode: 'AUTH789',
          cardInfo: {
            lastFourDigits: '4321',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2025
          }
        },
        processingTimestamp: new Date().toISOString(),
        gatewayResponse: {
          status: 'approved',
          responseCode: '00',
          message: 'Transaction approved',
          riskScore: 0.15
        },
        additionalInfo: ['flag1', 'flag2', { key: 'value' }]
      };

      // Add status with complex metadata
      pagamentoData.historicoStatus[0].metadata = complexMetadata;

      // Act
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Retrieve from database to ensure it was stored correctly
      const retrievedPagamento = await Pagamento.findById(pagamento._id);

      // Assert
      expect(retrievedPagamento).toBeDefined();
      expect(retrievedPagamento!.historicoStatus[0].metadata).toEqual(complexMetadata);
      expect(retrievedPagamento!.historicoStatus[0].metadata.transactionDetails.cardInfo.lastFourDigits).toBe('4321');
      expect(retrievedPagamento!.historicoStatus[0].metadata.gatewayResponse.status).toBe('approved');
      expect(Array.isArray(retrievedPagamento!.historicoStatus[0].metadata.additionalInfo)).toBe(true);
    });

    it('should enforce validation rules when updating an existing payment', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Act & Assert - Try to set valor to an invalid value
      pagamento.valor = -50; // Negative value, should fail validation
      await expect(pagamento.save()).rejects.toThrow(/valor do pagamento deve ser positivo/);

      // Act & Assert - Try to set metodo to an invalid enum value
      pagamento.valor = 100; // Reset to valid value
      pagamento.metodo = 'invalid_method' as PagamentoMetodoEnum;
      await expect(pagamento.save()).rejects.toThrow(/Método de pagamento inválido/);

      // Act & Assert - Try to add a status with invalid enum value
      pagamento.metodo = PagamentoMetodoEnum.PIX; // Reset to valid value
      pagamento.historicoStatus.push({
        status: 'invalid_status' as PagamentoStatusEnum,
        timestamp: new Date(),
        motivo: 'Status inválido'
      });
      await expect(pagamento.save()).rejects.toThrow(/is not a valid enum value/);

      // Verify the document wasn't corrupted by failed updates
      const retrievedPagamento = await Pagamento.findById(pagamento._id);
      expect(retrievedPagamento).toBeDefined();
      expect(retrievedPagamento!.valor).toBe(pagamentoData.valor); // Should still have original value
      expect(retrievedPagamento!.metodo).toBe(pagamentoData.metodo); // Should still have original value
      expect(retrievedPagamento!.historicoStatus.length).toBe(1); // Should still have only the original status
    });
  });

  describe('Virtual Properties', () => {
    it('should return the current status via statusAtual virtual', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Act
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Assert
      expect(pagamento.statusAtual).toBe(PagamentoStatusEnum.CRIADO);
    });

    it('should return the most recent status when multiple status entries exist', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Add a second status entry
      pagamentoData.historicoStatus.push({
        status: PagamentoStatusEnum.PENDENTE,
        timestamp: new Date(Date.now() + 1000), // 1 second later
        motivo: 'Aguardando processamento'
      });

      // Act
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();

      // Assert
      expect(pagamento.statusAtual).toBe(PagamentoStatusEnum.PENDENTE);
    });

    it('should return undefined for statusAtual when historicoStatus is empty', async () => {
      // Arrange
      const pagamento = new Pagamento();
      pagamento.historicoStatus = []; // Empty array (would normally fail validation, but we're testing the virtual)

      // Act & Assert
      expect(pagamento.statusAtual).toBeUndefined();
    });
  });

  describe('JSON Serialization', () => {
    it('should include virtual properties in JSON output', async () => {
      // Arrange
      const pagamentoData = createValidPagamentoData();

      // Act
      const pagamento = new Pagamento(pagamentoData);
      await pagamento.save();
      const pagamentoJSON = pagamento.toJSON();

      // Assert
      expect(pagamentoJSON.statusAtual).toBe(PagamentoStatusEnum.CRIADO);
    });
  });
});
