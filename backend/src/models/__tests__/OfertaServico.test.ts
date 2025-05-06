import mongoose from 'mongoose';
import OfertaServico, { IOfertaServico, OfertaStatusEnum, IDisponibilidade } from '../OfertaServico';
import User, { TipoUsuarioEnum } from '../User';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid user for testing relationships
const createTestUser = async (suffix = '') => {
  // Generate a random string to ensure unique email and cpfCnpj
  const random = Math.random().toString(36).substring(2, 10);

  const user = new User({
    nome: `Prestador Teste ${suffix}`,
    email: `prestador_${random}@example.com`,
    senha: 'Password123',
    telefone: '11987654321',
    cpfCnpj: `${random}12345678`,
    tipoUsuario: TipoUsuarioEnum.PRESTADOR,
    endereco: 'Endereço Teste',
    foto: 'foto-teste.jpg'
  });

  return await user.save();
};

// Helper function to create valid OfertaServico data
const createValidOfertaData = (prestadorId: mongoose.Types.ObjectId): {
  prestadorId: mongoose.Types.ObjectId;
  descricao: string;
  preco: number;
  status?: OfertaStatusEnum;
  disponibilidade?: IDisponibilidade;
} => ({
  prestadorId,
  descricao: 'Serviço de teste para unidade',
  preco: 100.50,
  status: OfertaStatusEnum.DISPONIVEL,
  disponibilidade: {
    recorrenciaSemanal: [
      {
        diaSemana: 1, // Segunda-feira
        horarios: [
          { inicio: '08:00', fim: '12:00' },
          { inicio: '14:00', fim: '18:00' }
        ]
      },
      {
        diaSemana: 3, // Quarta-feira
        horarios: [
          { inicio: '09:00', fim: '17:00' }
        ]
      }
    ],
    duracaoMediaMinutos: 60,
    observacoes: 'Observações de teste'
  }
});

describe('OfertaServico Model', () => {
  let testUser: mongoose.Document & { _id: mongoose.Types.ObjectId };

  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Create a test user before each test
  beforeEach(async () => {
    testUser = await createTestUser() as mongoose.Document & { _id: mongoose.Types.ObjectId };
  });

  // Clear the database between tests
  afterEach(async () => {
    jest.clearAllMocks();
    await User.deleteMany({});
    await OfertaServico.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create an oferta with valid data', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);

      // Act
      const oferta = new OfertaServico(ofertaData);
      const savedOferta = await oferta.save();

      // Assert
      expect(savedOferta._id).toBeDefined();
      expect(savedOferta.prestadorId.toString()).toBe(testUser._id.toString());
      expect(savedOferta.descricao).toBe(ofertaData.descricao);
      expect(savedOferta.preco).toBe(ofertaData.preco);
      expect(savedOferta.status).toBe(ofertaData.status);
      expect(savedOferta.disponibilidade).toBeDefined();
      expect(savedOferta.disponibilidade?.recorrenciaSemanal?.length).toBe(2);
      expect(savedOferta.createdAt).toBeDefined();
      expect(savedOferta.updatedAt).toBeDefined();
    });

    it('should require prestadorId field', async () => {
      // Arrange
      const { prestadorId, ...ofertaData } = createValidOfertaData(testUser._id);

      // Act & Assert
      const oferta = new OfertaServico(ofertaData as any);
      await expect(oferta.save()).rejects.toThrow(/prestador.*obrigatório/);
    });

    it('should require descricao field', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      ofertaData.descricao = '';

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/descrição.*obrigatória/);
    });

    it('should require preco field', async () => {
      // Arrange
      const { preco, ...ofertaData } = createValidOfertaData(testUser._id);

      // Act & Assert
      const oferta = new OfertaServico(ofertaData as any);
      await expect(oferta.save()).rejects.toThrow(/preço.*obrigatório/);
    });

    it('should enforce minimum price of 0', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      ofertaData.preco = -10;

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/preço não pode ser negativo/);
    });

    it('should enforce maximum description length', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      ofertaData.descricao = 'a'.repeat(2001); // 2001 characters, max is 2000

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/descrição não pode exceder 2000 caracteres/);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      ofertaData.status = 'invalid-status' as OfertaStatusEnum;

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/Status inválido/);
    });

    it('should set default status to RASCUNHO if not provided', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      delete ofertaData.status;

      // Act
      const oferta = new OfertaServico(ofertaData);
      const savedOferta = await oferta.save();

      // Assert
      expect(savedOferta.status).toBe(OfertaStatusEnum.RASCUNHO);
    });
  });

  describe('Relationship Validation', () => {
    it('should reference a valid User as prestadorId', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);

      // Act
      const oferta = new OfertaServico(ofertaData);
      const savedOferta = await oferta.save();

      // Assert
      expect(savedOferta.prestadorId.toString()).toBe(testUser._id.toString());

      // Verify we can populate the prestador
      const populatedOferta = await OfertaServico.findById(savedOferta._id).populate('prestadorId');
      expect(populatedOferta?.prestadorId).toBeDefined();
      expect((populatedOferta?.prestadorId as any).nome).toBe('Prestador Teste');
    });

    it('should fail with invalid prestadorId', async () => {
      // Arrange
      const invalidId = new mongoose.Types.ObjectId();
      const ofertaData = createValidOfertaData(invalidId);

      // Act
      const oferta = new OfertaServico(ofertaData);
      await oferta.save(); // This should succeed as Mongoose doesn't validate references by default

      // But when we try to populate, we should get null for the prestadorId
      const populatedOferta = await OfertaServico.findById(oferta._id).populate('prestadorId');
      expect(populatedOferta?.prestadorId).toBeNull();
    });
  });

  describe('Disponibilidade Validation', () => {
    it('should allow creating oferta without disponibilidade', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      delete ofertaData.disponibilidade;

      // Act
      const oferta = new OfertaServico(ofertaData);
      const savedOferta = await oferta.save();

      // Assert
      expect(savedOferta.disponibilidade).toBeUndefined();
    });

    it('should validate horario format in recorrenciaSemanal', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      if (ofertaData.disponibilidade?.recorrenciaSemanal) {
        ofertaData.disponibilidade.recorrenciaSemanal[0].horarios[0].inicio = 'invalid-time';
      }

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/Formato de hora inválido/);
    });

    it('should validate diaSemana range in recorrenciaSemanal', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      if (ofertaData.disponibilidade?.recorrenciaSemanal) {
        ofertaData.disponibilidade.recorrenciaSemanal[0].diaSemana = 7; // Invalid, max is 6
      }

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/Path `diaSemana`.*is more than maximum allowed value/);
    });

    it('should validate duracaoMediaMinutos minimum value', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      if (ofertaData.disponibilidade) {
        ofertaData.disponibilidade.duracaoMediaMinutos = 0; // Invalid, min is 1
      }

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/Path `duracaoMediaMinutos`.*is less than minimum allowed value/);
    });

    it('should validate observacoes maximum length', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      if (ofertaData.disponibilidade) {
        ofertaData.disponibilidade.observacoes = 'a'.repeat(501); // 501 characters, max is 500
      }

      // Act & Assert
      const oferta = new OfertaServico(ofertaData);
      await expect(oferta.save()).rejects.toThrow(/observacoes.*is longer than the maximum allowed length/);
    });
  });

  describe('Query Operations', () => {
    it('should find ofertas by status', async () => {
      // Arrange
      const ofertaDisponivel = createValidOfertaData(testUser._id);
      ofertaDisponivel.status = OfertaStatusEnum.DISPONIVEL;

      const ofertaPausada = createValidOfertaData(testUser._id);
      ofertaPausada.status = OfertaStatusEnum.PAUSADO;

      await new OfertaServico(ofertaDisponivel).save();
      await new OfertaServico(ofertaPausada).save();

      // Act
      const ofertasDisponiveis = await OfertaServico.find({ status: OfertaStatusEnum.DISPONIVEL });
      const ofertasPausadas = await OfertaServico.find({ status: OfertaStatusEnum.PAUSADO });

      // Assert
      expect(ofertasDisponiveis.length).toBe(1);
      expect(ofertasPausadas.length).toBe(1);
      expect(ofertasDisponiveis[0].status).toBe(OfertaStatusEnum.DISPONIVEL);
      expect(ofertasPausadas[0].status).toBe(OfertaStatusEnum.PAUSADO);
    });

    it('should find ofertas by prestadorId', async () => {
      // Arrange
      const ofertaData = createValidOfertaData(testUser._id);
      await new OfertaServico(ofertaData).save();

      // Create another user and oferta
      const anotherUser = await createTestUser() as mongoose.Document & { _id: mongoose.Types.ObjectId };
      const anotherOfertaData = createValidOfertaData(anotherUser._id);
      await new OfertaServico(anotherOfertaData).save();

      // Act
      const ofertasPrestador1 = await OfertaServico.find({ prestadorId: testUser._id });
      const ofertasPrestador2 = await OfertaServico.find({ prestadorId: anotherUser._id });

      // Assert
      expect(ofertasPrestador1.length).toBe(1);
      expect(ofertasPrestador2.length).toBe(1);
      expect(ofertasPrestador1[0].prestadorId.toString()).toBe(testUser._id.toString());
      expect(ofertasPrestador2[0].prestadorId.toString()).toBe(anotherUser._id.toString());
    });
  });
});
