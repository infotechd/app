import mongoose from 'mongoose';
import Contratacao, { IContratacao, ContratacaoStatusEnum } from '../Contratacao';
import User, { TipoUsuarioEnum } from '../User';
import OfertaServico, { OfertaStatusEnum } from '../OfertaServico';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid user for testing relationships
const createTestUser = async (tipoUsuario: TipoUsuarioEnum, suffix = '') => {
  // Generate a random string to ensure unique email and cpfCnpj
  const random = Math.random().toString(36).substring(2, 10);

  const user = new User({
    nome: `User Teste ${suffix}`,
    email: `user_${random}@example.com`,
    senha: 'Password123',
    telefone: '11987654321',
    cpfCnpj: `${random}12345678`,
    tipoUsuario: tipoUsuario,
    endereco: 'Endereço Teste',
    foto: 'foto-teste.jpg'
  });

  return await user.save();
};

// Helper function to create a valid OfertaServico for testing relationships
const createTestOferta = async (prestadorId: mongoose.Types.ObjectId) => {
  const oferta = new OfertaServico({
    prestadorId,
    descricao: 'Serviço de teste para contratação',
    preco: 150.00,
    status: OfertaStatusEnum.DISPONIVEL,
    disponibilidade: {
      recorrenciaSemanal: [
        {
          diaSemana: 1, // Segunda-feira
          horarios: [
            { inicio: '08:00', fim: '12:00' },
            { inicio: '14:00', fim: '18:00' }
          ]
        }
      ],
      duracaoMediaMinutos: 60,
      observacoes: 'Observações de teste'
    }
  });

  return await oferta.save();
};

// Helper function to create valid Contratacao data
const createValidContratacaoData = (
  buyerId: mongoose.Types.ObjectId,
  prestadorId: mongoose.Types.ObjectId,
  ofertaId: mongoose.Types.ObjectId
): {
  buyerId: mongoose.Types.ObjectId;
  prestadorId: mongoose.Types.ObjectId;
  ofertaId: mongoose.Types.ObjectId;
  status?: ContratacaoStatusEnum;
  dataInicioServico?: Date;
  dataFimServico?: Date;
  valorTotal: number;
} => ({
  buyerId,
  prestadorId,
  ofertaId,
  status: ContratacaoStatusEnum.PENDENTE,
  valorTotal: 150.00
});

describe('Contratacao Model', () => {
  let testBuyer: mongoose.Document & { _id: mongoose.Types.ObjectId };
  let testPrestador: mongoose.Document & { _id: mongoose.Types.ObjectId };
  let testOferta: mongoose.Document & { _id: mongoose.Types.ObjectId };

  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Create test users and oferta before each test
  beforeEach(async () => {
    testBuyer = await createTestUser(TipoUsuarioEnum.COMPRADOR, 'Comprador') as mongoose.Document & { _id: mongoose.Types.ObjectId };
    testPrestador = await createTestUser(TipoUsuarioEnum.PRESTADOR, 'Prestador') as mongoose.Document & { _id: mongoose.Types.ObjectId };
    testOferta = await createTestOferta(testPrestador._id) as mongoose.Document & { _id: mongoose.Types.ObjectId };
  });

  // Clear the database between tests
  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    await OfertaServico.deleteMany({});
    await Contratacao.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a contratacao with valid data', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao._id).toBeDefined();
      expect(savedContratacao.buyerId.toString()).toBe(testBuyer._id.toString());
      expect(savedContratacao.prestadorId.toString()).toBe(testPrestador._id.toString());
      expect(savedContratacao.ofertaId.toString()).toBe(testOferta._id.toString());
      expect(savedContratacao.status).toBe(contratacaoData.status);
      expect(savedContratacao.valorTotal).toBe(contratacaoData.valorTotal);
      expect(savedContratacao.createdAt).toBeDefined();
      expect(savedContratacao.updatedAt).toBeDefined();
    });

    it('should require buyerId field', async () => {
      // Arrange
      const { buyerId, ...contratacaoData } = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData as any);
      await expect(contratacao.save()).rejects.toThrow(/buyerId.*required/);
    });

    it('should require prestadorId field', async () => {
      // Arrange
      const { prestadorId, ...contratacaoData } = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData as any);
      await expect(contratacao.save()).rejects.toThrow(/prestadorId.*required/);
    });

    it('should require ofertaId field', async () => {
      // Arrange
      const { ofertaId, ...contratacaoData } = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData as any);
      await expect(contratacao.save()).rejects.toThrow(/ofertaId.*required/);
    });

    it('should require valorTotal field', async () => {
      // Arrange
      const { valorTotal, ...contratacaoData } = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData as any);
      await expect(contratacao.save()).rejects.toThrow(/valorTotal.*obrigatório/);
    });

    it('should enforce minimum valorTotal of 0', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      contratacaoData.valorTotal = -10;

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData);
      await expect(contratacao.save()).rejects.toThrow(/valor total não pode ser negativo/i);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      contratacaoData.status = 'invalid-status' as ContratacaoStatusEnum;

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData);
      await expect(contratacao.save()).rejects.toThrow(/Status de contratação inválido/);
    });

    it('should set default status to PENDENTE if not provided', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      delete contratacaoData.status;

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.status).toBe(ContratacaoStatusEnum.PENDENTE);
    });
  });

  describe('Date Validation', () => {
    it('should allow dataInicioServico and dataFimServico to be undefined', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      delete contratacaoData.dataInicioServico;
      delete contratacaoData.dataFimServico;

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.dataInicioServico).toBeUndefined();
      expect(savedContratacao.dataFimServico).toBeUndefined();
    });

    it('should allow dataFimServico to be equal to dataInicioServico', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      const testDate = new Date();
      contratacaoData.dataInicioServico = testDate;
      contratacaoData.dataFimServico = new Date(testDate);

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.dataInicioServico).toEqual(testDate);
      expect(savedContratacao.dataFimServico).toEqual(testDate);
    });

    it('should allow dataFimServico to be after dataInicioServico', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1); // Add one day
      contratacaoData.dataInicioServico = startDate;
      contratacaoData.dataFimServico = endDate;

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.dataInicioServico).toEqual(startDate);
      expect(savedContratacao.dataFimServico).toEqual(endDate);
    });

    it('should reject dataFimServico before dataInicioServico', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() - 1); // Subtract one day
      contratacaoData.dataInicioServico = startDate;
      contratacaoData.dataFimServico = endDate;

      // Act & Assert
      const contratacao = new Contratacao(contratacaoData);
      await expect(contratacao.save()).rejects.toThrow(/data de término do serviço deve ser igual ou posterior à data de início/i);
    });
  });

  describe('Relationship Validation', () => {
    it('should reference a valid User as buyerId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.buyerId.toString()).toBe(testBuyer._id.toString());

      // Verify we can populate the buyer
      const populatedContratacao = await Contratacao.findById(savedContratacao._id).populate('buyerId');
      expect(populatedContratacao?.buyerId).toBeDefined();
      expect((populatedContratacao?.buyerId as any).nome).toBe('User Teste Comprador');
    });

    it('should reference a valid User as prestadorId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.prestadorId.toString()).toBe(testPrestador._id.toString());

      // Verify we can populate the prestador
      const populatedContratacao = await Contratacao.findById(savedContratacao._id).populate('prestadorId');
      expect(populatedContratacao?.prestadorId).toBeDefined();
      expect((populatedContratacao?.prestadorId as any).nome).toBe('User Teste Prestador');
    });

    it('should reference a valid OfertaServico as ofertaId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );

      // Act
      const contratacao = new Contratacao(contratacaoData);
      const savedContratacao = await contratacao.save();

      // Assert
      expect(savedContratacao.ofertaId.toString()).toBe(testOferta._id.toString());

      // Verify we can populate the oferta
      const populatedContratacao = await Contratacao.findById(savedContratacao._id).populate('ofertaId');
      expect(populatedContratacao?.ofertaId).toBeDefined();
      expect((populatedContratacao?.ofertaId as any).descricao).toBe('Serviço de teste para contratação');
    });
  });

  describe('Query Operations', () => {
    it('should find contratacoes by status', async () => {
      // Arrange
      const contratacaoPendente = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      contratacaoPendente.status = ContratacaoStatusEnum.PENDENTE;

      const contratacaoAceita = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      contratacaoAceita.status = ContratacaoStatusEnum.ACEITA;

      await new Contratacao(contratacaoPendente).save();
      await new Contratacao(contratacaoAceita).save();

      // Act
      const contratacoesPendentes = await Contratacao.find({ status: ContratacaoStatusEnum.PENDENTE });
      const contratacoesAceitas = await Contratacao.find({ status: ContratacaoStatusEnum.ACEITA });

      // Assert
      expect(contratacoesPendentes.length).toBe(1);
      expect(contratacoesAceitas.length).toBe(1);
      expect(contratacoesPendentes[0].status).toBe(ContratacaoStatusEnum.PENDENTE);
      expect(contratacoesAceitas[0].status).toBe(ContratacaoStatusEnum.ACEITA);
    });

    it('should find contratacoes by buyerId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      await new Contratacao(contratacaoData).save();

      // Create another buyer and contratacao
      const anotherBuyer = await createTestUser(TipoUsuarioEnum.COMPRADOR, 'Outro') as mongoose.Document & { _id: mongoose.Types.ObjectId };
      const anotherContratacaoData = createValidContratacaoData(
        anotherBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      await new Contratacao(anotherContratacaoData).save();

      // Act
      const contratacoesBuyer1 = await Contratacao.find({ buyerId: testBuyer._id });
      const contratacoesBuyer2 = await Contratacao.find({ buyerId: anotherBuyer._id });

      // Assert
      expect(contratacoesBuyer1.length).toBe(1);
      expect(contratacoesBuyer2.length).toBe(1);
      expect(contratacoesBuyer1[0].buyerId.toString()).toBe(testBuyer._id.toString());
      expect(contratacoesBuyer2[0].buyerId.toString()).toBe(anotherBuyer._id.toString());
    });

    it('should find contratacoes by prestadorId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      await new Contratacao(contratacaoData).save();

      // Create another prestador and contratacao
      const anotherPrestador = await createTestUser(TipoUsuarioEnum.PRESTADOR, 'Outro') as mongoose.Document & { _id: mongoose.Types.ObjectId };
      // Create another oferta for the new prestador
      const anotherOferta = await createTestOferta(anotherPrestador._id) as mongoose.Document & { _id: mongoose.Types.ObjectId };
      
      const anotherContratacaoData = createValidContratacaoData(
        testBuyer._id,
        anotherPrestador._id,
        anotherOferta._id
      );
      await new Contratacao(anotherContratacaoData).save();

      // Act
      const contratacoesPrestador1 = await Contratacao.find({ prestadorId: testPrestador._id });
      const contratacoesPrestador2 = await Contratacao.find({ prestadorId: anotherPrestador._id });

      // Assert
      expect(contratacoesPrestador1.length).toBe(1);
      expect(contratacoesPrestador2.length).toBe(1);
      expect(contratacoesPrestador1[0].prestadorId.toString()).toBe(testPrestador._id.toString());
      expect(contratacoesPrestador2[0].prestadorId.toString()).toBe(anotherPrestador._id.toString());
    });

    it('should find contratacoes by ofertaId', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      await new Contratacao(contratacaoData).save();

      // Create another oferta and contratacao
      const anotherOferta = await createTestOferta(testPrestador._id) as mongoose.Document & { _id: mongoose.Types.ObjectId };
      const anotherContratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        anotherOferta._id
      );
      await new Contratacao(anotherContratacaoData).save();

      // Act
      const contratacoesOferta1 = await Contratacao.find({ ofertaId: testOferta._id });
      const contratacoesOferta2 = await Contratacao.find({ ofertaId: anotherOferta._id });

      // Assert
      expect(contratacoesOferta1.length).toBe(1);
      expect(contratacoesOferta2.length).toBe(1);
      expect(contratacoesOferta1[0].ofertaId.toString()).toBe(testOferta._id.toString());
      expect(contratacoesOferta2[0].ofertaId.toString()).toBe(anotherOferta._id.toString());
    });

    it('should use compound indexes for efficient queries', async () => {
      // Arrange
      const contratacaoData = createValidContratacaoData(
        testBuyer._id,
        testPrestador._id,
        testOferta._id
      );
      await new Contratacao(contratacaoData).save();

      // Act & Assert - Just verify these queries work (we can't easily test index usage in unit tests)
      const byBuyerAndStatus = await Contratacao.find({ 
        buyerId: testBuyer._id,
        status: ContratacaoStatusEnum.PENDENTE
      });
      expect(byBuyerAndStatus.length).toBe(1);

      const byPrestadorAndStatus = await Contratacao.find({ 
        prestadorId: testPrestador._id,
        status: ContratacaoStatusEnum.PENDENTE
      });
      expect(byPrestadorAndStatus.length).toBe(1);

      const byOfertaAndStatus = await Contratacao.find({ 
        ofertaId: testOferta._id,
        status: ContratacaoStatusEnum.PENDENTE
      });
      expect(byOfertaAndStatus.length).toBe(1);
    });
  });
});