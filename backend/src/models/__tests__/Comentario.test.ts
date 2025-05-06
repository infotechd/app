import mongoose from 'mongoose';
import Comentario, { IComentario, ComentarioStatusEnum } from '../Comentario';
import { Types } from 'mongoose';

// Helper function to create a valid comment object
const createValidComentarioData = () => ({
  publicacaoId: new Types.ObjectId(),
  autorId: new Types.ObjectId(),
  conteudo: 'Conteúdo de teste do comentário',
  respostaParaComentarioId: null,
  contagemLikes: 0,
  status: ComentarioStatusEnum.APROVADO
});

describe('Comentario Model', () => {
  // Connect to a test database before running tests
  beforeAll(async () => {
    // Use in-memory MongoDB server for testing
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
  });

  // Clear the database between tests
  afterEach(async () => {
    await Comentario.deleteMany({});
  });

  // Disconnect from the database after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a comment with valid data', async () => {
      // Arrange
      const comentarioData = createValidComentarioData();

      // Act
      const comentario = new Comentario(comentarioData);
      const savedComentario = await comentario.save();

      // Assert
      expect(savedComentario._id).toBeDefined();
      expect(savedComentario.publicacaoId).toEqual(comentarioData.publicacaoId);
      expect(savedComentario.autorId).toEqual(comentarioData.autorId);
      expect(savedComentario.conteudo).toBe(comentarioData.conteudo);
      expect(savedComentario.respostaParaComentarioId).toBeNull();
      expect(savedComentario.contagemLikes).toBe(0);
      expect(savedComentario.status).toBe(ComentarioStatusEnum.APROVADO);
      expect(savedComentario.createdAt).toBeDefined();
      expect(savedComentario.updatedAt).toBeDefined();
    });

    it('should create a comment with a reply to another comment', async () => {
      // Arrange
      // First create a parent comment
      const parentComentarioData = createValidComentarioData();
      const parentComentario = new Comentario(parentComentarioData);
      const savedParentComentario = await parentComentario.save();

      // Then create a reply comment
      const replyComentarioData = {
        ...createValidComentarioData(),
        respostaParaComentarioId: savedParentComentario._id
      };

      // Act
      const replyComentario = new Comentario(replyComentarioData);
      const savedReplyComentario = await replyComentario.save();

      // Assert
      expect(savedReplyComentario._id).toBeDefined();
      expect(savedReplyComentario.respostaParaComentarioId).toEqual(savedParentComentario._id);
    });

    it('should require publicacaoId field', async () => {
      // Arrange
      const { publicacaoId, ...comentarioData } = createValidComentarioData();

      // Act & Assert
      const comentario = new Comentario(comentarioData as any);
      await expect(comentario.save()).rejects.toThrow(/publicação é obrigatória/);
    });

    it('should require autorId field', async () => {
      // Arrange
      const { autorId, ...comentarioData } = createValidComentarioData();

      // Act & Assert
      const comentario = new Comentario(comentarioData as any);
      await expect(comentario.save()).rejects.toThrow(/autor.*obrigatório/);
    });

    it('should require conteudo field', async () => {
      // Arrange
      const { conteudo, ...comentarioData } = createValidComentarioData();

      // Act & Assert
      const comentario = new Comentario(comentarioData as any);
      await expect(comentario.save()).rejects.toThrow(/conteúdo.*obrigatório/);
    });

    it('should validate conteudo is not empty', async () => {
      // Arrange
      const comentarioData = createValidComentarioData();
      comentarioData.conteudo = '';

      // Act & Assert
      const comentario = new Comentario(comentarioData);
      await expect(comentario.save()).rejects.toThrow(/O conteúdo do comentário é obrigatório/);
    });

    it('should validate conteudo maxlength', async () => {
      // Arrange
      const comentarioData = createValidComentarioData();
      comentarioData.conteudo = 'a'.repeat(2001); // Exceeds 2000 character limit

      // Act & Assert
      const comentario = new Comentario(comentarioData);
      await expect(comentario.save()).rejects.toThrow(/comentário não pode exceder 2000 caracteres/);
    });

    it('should validate status enum values', async () => {
      // Arrange
      const comentarioData = createValidComentarioData();
      comentarioData.status = 'invalid-status' as ComentarioStatusEnum;

      // Act & Assert
      const comentario = new Comentario(comentarioData);
      await expect(comentario.save()).rejects.toThrow(/Status de comentário inválido: invalid-status/);
    });

    it('should set default values correctly', async () => {
      // Arrange
      const { status, contagemLikes, ...comentarioData } = createValidComentarioData();

      // Act
      const comentario = new Comentario(comentarioData as any);
      const savedComentario = await comentario.save();

      // Assert
      expect(savedComentario.status).toBe(ComentarioStatusEnum.APROVADO); // Default value
      expect(savedComentario.contagemLikes).toBe(0);
      expect(savedComentario.respostaParaComentarioId).toBeNull();
    });

    it('should validate contagemLikes is not negative', async () => {
      // Arrange
      const comentarioData = createValidComentarioData();
      comentarioData.contagemLikes = -1; // Negative value

      // Act & Assert
      const comentario = new Comentario(comentarioData);
      await expect(comentario.save()).rejects.toThrow(/min/);
    });
  });

  describe('Indexes', () => {
    it('should have an index on publicacaoId', async () => {
      const indexes = await Comentario.collection.indexes();

      const publicacaoIdIndex = indexes.find(index => 
        index.key.publicacaoId === 1
      );

      expect(publicacaoIdIndex).toBeDefined();
    });

    it('should have an index on autorId', async () => {
      const indexes = await Comentario.collection.indexes();

      const autorIdIndex = indexes.find(index => 
        index.key.autorId === 1
      );

      expect(autorIdIndex).toBeDefined();
    });

    it('should have an index on respostaParaComentarioId', async () => {
      const indexes = await Comentario.collection.indexes();

      const respostaIndex = indexes.find(index => 
        index.key.respostaParaComentarioId === 1
      );

      expect(respostaIndex).toBeDefined();
    });

    it('should have an index on status', async () => {
      const indexes = await Comentario.collection.indexes();

      const statusIndex = indexes.find(index => 
        index.key.status === 1
      );

      expect(statusIndex).toBeDefined();
    });

    it('should have a compound index on publicacaoId, status, respostaParaComentarioId, and createdAt', async () => {
      const indexes = await Comentario.collection.indexes();

      const compoundIndex = indexes.find(index => 
        index.key.publicacaoId === 1 && 
        index.key.status === 1 && 
        index.key.respostaParaComentarioId === 1 && 
        index.key.createdAt === 1
      );

      expect(compoundIndex).toBeDefined();
    });
  });
});
