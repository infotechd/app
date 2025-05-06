import mongoose from 'mongoose';
import PublicacaoComunidade, { 
  IPublicacaoComunidade, 
  PublicacaoTipoEnum, 
  PublicacaoStatusEnum 
} from '../PublicacaoComunidade';
import { Types } from 'mongoose';

// Helper function to create a valid publication object
const createValidPublicacaoData = () => ({
  autorId: new Types.ObjectId(),
  conteudo: 'Conteúdo de teste da publicação',
  tipo: PublicacaoTipoEnum.POST,
  status: PublicacaoStatusEnum.APROVADO,
  imagens: [] as string[],
  dataEvento: undefined as Date | undefined,
  localEvento: undefined as string | undefined,
  motivoReprovacaoOuOcultacao: undefined as string | undefined
});

describe('PublicacaoComunidade Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database between tests
  afterEach(async () => {
    await PublicacaoComunidade.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a publication with valid data', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();

      // Act
      const publicacao = new PublicacaoComunidade(publicacaoData);
      const savedPublicacao = await publicacao.save();

      // Assert
      expect(savedPublicacao._id).toBeDefined();
      expect(savedPublicacao.autorId).toEqual(publicacaoData.autorId);
      expect(savedPublicacao.conteudo).toBe(publicacaoData.conteudo);
      expect(savedPublicacao.tipo).toBe(publicacaoData.tipo);
      expect(savedPublicacao.status).toBe(publicacaoData.status);
      expect(savedPublicacao.contagemLikes).toBe(0);
      expect(savedPublicacao.contagemComentarios).toBe(0);
      expect(savedPublicacao.createdAt).toBeDefined();
      expect(savedPublicacao.updatedAt).toBeDefined();
    });

    it('should create a publication with optional fields', async () => {
      // Arrange
      const publicacaoData = {
        ...createValidPublicacaoData(),
        imagens: ['imagem1.jpg', 'imagem2.jpg'],
        dataEvento: new Date('2025-12-31'),
        localEvento: 'Local do Evento',
        motivoReprovacaoOuOcultacao: 'Motivo de teste'
      };

      // Act
      const publicacao = new PublicacaoComunidade(publicacaoData);
      const savedPublicacao = await publicacao.save();

      // Assert
      expect(savedPublicacao.imagens).toEqual(publicacaoData.imagens);
      expect(savedPublicacao.dataEvento).toEqual(publicacaoData.dataEvento);
      expect(savedPublicacao.localEvento).toBe(publicacaoData.localEvento);
      expect(savedPublicacao.motivoReprovacaoOuOcultacao).toBe(publicacaoData.motivoReprovacaoOuOcultacao);
    });

    it('should require autorId field', async () => {
      // Arrange
      const { autorId, ...publicacaoData } = createValidPublicacaoData();

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData as any);
      await expect(publicacao.save()).rejects.toThrow(/autor.*obrigatório/);
    });

    it('should require conteudo field', async () => {
      // Arrange
      const { conteudo, ...publicacaoData } = createValidPublicacaoData();

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData as any);
      await expect(publicacao.save()).rejects.toThrow(/conteúdo.*obrigatório/);
    });

    it('should use default tipo when not provided', async () => {
      // Arrange
      const { tipo, ...publicacaoData } = createValidPublicacaoData();

      // Act
      const publicacao = new PublicacaoComunidade(publicacaoData as any);
      const savedPublicacao = await publicacao.save();

      // Assert
      expect(savedPublicacao.tipo).toBe(PublicacaoTipoEnum.POST); // Default value
    });

    it('should validate conteudo is required', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.conteudo = '';

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/conteúdo é obrigatório/);
    });

    it('should validate conteudo maxlength', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.conteudo = 'a'.repeat(5001); // Exceeds 5000 character limit

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/conteúdo não pode exceder 5000 caracteres/);
    });

    it('should validate imagens array length', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.imagens = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg', 'img6.jpg']; // 6 images, exceeds limit of 5

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/máximo 5 imagens/);
    });

    it('should validate tipo enum values', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.tipo = 'invalid-type' as PublicacaoTipoEnum;

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/Tipo de publicação inválido: invalid-type/);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.status = 'invalid-status' as PublicacaoStatusEnum;

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/Status inválido: invalid-status/);
    });

    it('should validate localEvento maxlength', async () => {
      // Arrange
      const publicacaoData = createValidPublicacaoData();
      publicacaoData.localEvento = 'a'.repeat(201); // Exceeds 200 character limit

      // Act & Assert
      const publicacao = new PublicacaoComunidade(publicacaoData);
      await expect(publicacao.save()).rejects.toThrow(/local do evento não pode exceder 200 caracteres/);
    });

    it('should set default values correctly', async () => {
      // Arrange
      const { status, ...publicacaoData } = createValidPublicacaoData();

      // Act
      const publicacao = new PublicacaoComunidade(publicacaoData as any);
      const savedPublicacao = await publicacao.save();

      // Assert
      expect(savedPublicacao.status).toBe(PublicacaoStatusEnum.APROVADO); // Default value
      expect(savedPublicacao.contagemLikes).toBe(0);
      expect(savedPublicacao.contagemComentarios).toBe(0);
      expect(savedPublicacao.imagens).toEqual([]);
    });

    it('should create a publication with tipo EVENTO and related fields', async () => {
      // Arrange
      const publicacaoData = {
        ...createValidPublicacaoData(),
        tipo: PublicacaoTipoEnum.EVENTO,
        dataEvento: new Date('2025-12-31'),
        localEvento: 'Local do Evento'
      };

      // Act
      const publicacao = new PublicacaoComunidade(publicacaoData);
      const savedPublicacao = await publicacao.save();

      // Assert
      expect(savedPublicacao.tipo).toBe(PublicacaoTipoEnum.EVENTO);
      expect(savedPublicacao.dataEvento).toEqual(publicacaoData.dataEvento);
      expect(savedPublicacao.localEvento).toBe(publicacaoData.localEvento);
    });
  });

  describe('Indexes', () => {
    it('should have an index on status and createdAt', async () => {
      // This is a basic test to ensure the index exists
      // More comprehensive testing would require querying with explain()
      const indexes = await PublicacaoComunidade.collection.indexes();

      // Find the index that has both status and createdAt fields
      const statusCreatedAtIndex = indexes.find(index => 
        index.key.status === 1 && index.key.createdAt === -1
      );

      expect(statusCreatedAtIndex).toBeDefined();
    });

    it('should have an index on autorId, status and createdAt', async () => {
      const indexes = await PublicacaoComunidade.collection.indexes();

      // Find the index that has autorId, status and createdAt fields
      const autorStatusCreatedAtIndex = indexes.find(index => 
        index.key.autorId === 1 && index.key.status === 1 && index.key.createdAt === -1
      );

      expect(autorStatusCreatedAtIndex).toBeDefined();
    });
  });
});
