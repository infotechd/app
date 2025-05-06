import mongoose from 'mongoose';
import Notificacao, { 
  INotificacao, 
  NotificacaoTipoEnum, 
  NotificacaoOrigemEnum, 
  EntidadeTipoEnum 
} from '../Notificacao';
import logger from '../../config/logger';

// Mock dependencies
jest.mock('../../config/logger');

// Helper function to create a valid notificacao object
const createValidNotificacaoData = () => ({
  usuarioId: new mongoose.Types.ObjectId(),
  lida: false,
  origem: NotificacaoOrigemEnum.SISTEMA,
  remetenteId: new mongoose.Types.ObjectId(),
  tipoNotificacao: NotificacaoTipoEnum.CHAT_NOVA_MENSAGEM,
  titulo: 'Notificação de Teste',
  mensagem: 'Esta é uma mensagem de teste para a notificação',
  linkRelacionado: 'https://example.com/destino',
  entidadeRelacionada: {
    id: new mongoose.Types.ObjectId(),
    tipo: EntidadeTipoEnum.USER
  }
} as any); // Using 'as any' to allow property deletion in tests

describe('Notificacao Model', () => {
  // Reset mocks between tests
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a notificacao with valid data', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao._id).toBeDefined();
      expect(savedNotificacao.usuarioId).toEqual(notificacaoData.usuarioId);
      expect(savedNotificacao.lida).toBe(notificacaoData.lida);
      expect(savedNotificacao.origem).toBe(notificacaoData.origem);
      expect(savedNotificacao.remetenteId).toEqual(notificacaoData.remetenteId);
      expect(savedNotificacao.tipoNotificacao).toBe(notificacaoData.tipoNotificacao);
      expect(savedNotificacao.titulo).toBe(notificacaoData.titulo);
      expect(savedNotificacao.mensagem).toBe(notificacaoData.mensagem);
      expect(savedNotificacao.linkRelacionado).toBe(notificacaoData.linkRelacionado);
      expect(savedNotificacao.entidadeRelacionada).toBeDefined();
      expect(savedNotificacao.entidadeRelacionada?.id).toEqual(notificacaoData.entidadeRelacionada.id);
      expect(savedNotificacao.entidadeRelacionada?.tipo).toBe(notificacaoData.entidadeRelacionada.tipo);
      expect(savedNotificacao.createdAt).toBeDefined();
      expect(savedNotificacao.updatedAt).toBeDefined();
    });

    it('should require usuarioId field', async () => {
      // Arrange
      const { usuarioId, ...notificacaoData } = createValidNotificacaoData();

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData as any);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should set default value for lida field', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      delete notificacaoData.lida;

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao.lida).toBe(false);
    });

    it('should not allow null for origem field', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.origem = null as any;

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should set default value for origem field', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      delete notificacaoData.origem;

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao.origem).toBe(NotificacaoOrigemEnum.SISTEMA);
    });

    it('should validate origem enum values', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.origem = 'invalid_origem' as any;

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should allow remetenteId to be optional', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      delete notificacaoData.remetenteId;

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao._id).toBeDefined();
      expect(savedNotificacao.remetenteId).toBeUndefined();
    });

    it('should require tipoNotificacao field', async () => {
      // Arrange
      const { tipoNotificacao, ...notificacaoData } = createValidNotificacaoData();

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData as any);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should validate tipoNotificacao enum values', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.tipoNotificacao = 'invalid_tipo' as any;

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should require titulo field', async () => {
      // Arrange
      const { titulo, ...notificacaoData } = createValidNotificacaoData();

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData as any);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should validate titulo maximum length', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.titulo = 'a'.repeat(101); // Exceeds 100 character limit

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should require mensagem field', async () => {
      // Arrange
      const { mensagem, ...notificacaoData } = createValidNotificacaoData();

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData as any);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should validate mensagem maximum length', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.mensagem = 'a'.repeat(501); // Exceeds 500 character limit

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });

    it('should allow linkRelacionado to be optional', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      delete notificacaoData.linkRelacionado;

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao._id).toBeDefined();
      expect(savedNotificacao.linkRelacionado).toBeUndefined();
    });

    it('should allow entidadeRelacionada to be optional', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      delete notificacaoData.entidadeRelacionada;

      // Act
      const notificacao = new Notificacao(notificacaoData);
      const savedNotificacao = await notificacao.save();

      // Assert
      expect(savedNotificacao._id).toBeDefined();
      expect(savedNotificacao.entidadeRelacionada).toBeUndefined();
    });

    it('should validate entidadeRelacionada.tipo enum values', async () => {
      // Arrange
      const notificacaoData = createValidNotificacaoData();
      notificacaoData.entidadeRelacionada.tipo = 'invalid_tipo' as any;

      // Act & Assert
      const notificacao = new Notificacao(notificacaoData);
      await expect(notificacao.save()).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have an index on usuarioId', async () => {
      // Check if the index exists
      const indexes = await Notificacao.collection.indexes();
      const usuarioIdIndex = indexes.find(index => index.key.usuarioId === 1);
      expect(usuarioIdIndex).toBeDefined();
    });

    it('should have an index on lida', async () => {
      // Check if the index exists
      const indexes = await Notificacao.collection.indexes();
      const lidaIndex = indexes.find(index => index.key.lida === 1);
      expect(lidaIndex).toBeDefined();
    });

    it('should have an index on tipoNotificacao', async () => {
      // Check if the index exists
      const indexes = await Notificacao.collection.indexes();
      const tipoNotificacaoIndex = indexes.find(index => index.key.tipoNotificacao === 1);
      expect(tipoNotificacaoIndex).toBeDefined();
    });

    it('should have a compound index on usuarioId, lida, and createdAt', async () => {
      // Check if the compound index exists
      const indexes = await Notificacao.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key.usuarioId === 1 && 
          index.key.lida === 1 && 
          index.key.createdAt === -1
      );
      expect(compoundIndex).toBeDefined();
    });

    it('should have a sparse compound index on entidadeRelacionada.id and entidadeRelacionada.tipo', async () => {
      // Check if the compound index exists
      const indexes = await Notificacao.collection.indexes();
      const compoundIndex = indexes.find(
        index => 
          index.key['entidadeRelacionada.id'] === 1 && 
          index.key['entidadeRelacionada.tipo'] === 1 &&
          index.sparse === true
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Enum Values', () => {
    it('should have the correct values for NotificacaoTipoEnum', () => {
      expect(NotificacaoTipoEnum.CHAT_NOVA_MENSAGEM).toBe('chat_nova_mensagem');
      expect(NotificacaoTipoEnum.CONTRATACAO_NOVA).toBe('contratacao_nova');
      expect(NotificacaoTipoEnum.CONTRATACAO_STATUS_ACEITA).toBe('contratacao_status_aceita');
      expect(NotificacaoTipoEnum.CONTRATACAO_STATUS_ANDAMENTO).toBe('contratacao_status_andamento');
      expect(NotificacaoTipoEnum.CONTRATACAO_STATUS_CONCLUIDO).toBe('contratacao_status_concluido');
      expect(NotificacaoTipoEnum.CONTRATACAO_STATUS_CANCELADO).toBe('contratacao_status_cancelado');
      expect(NotificacaoTipoEnum.CONTRATACAO_STATUS_DISPUTA).toBe('contratacao_status_disputa');
      expect(NotificacaoTipoEnum.OFERTA_NOVA_RELEVANTE).toBe('oferta_nova_relevante');
      expect(NotificacaoTipoEnum.AVALIACAO_SOLICITACAO).toBe('avaliacao_solicitacao');
      expect(NotificacaoTipoEnum.AVALIACAO_RECEBIDA).toBe('avaliacao_recebida');
      expect(NotificacaoTipoEnum.NEGOCIACAO_NOVA_PROPOSTA).toBe('negociacao_nova_proposta');
      expect(NotificacaoTipoEnum.NEGOCIACAO_ACEITA).toBe('negociacao_aceita');
      expect(NotificacaoTipoEnum.NEGOCIACAO_REJEITADA).toBe('negociacao_rejeitada');
      expect(NotificacaoTipoEnum.ANUNCIO_SISTEMA).toBe('anuncio_sistema');
      expect(NotificacaoTipoEnum.TREINAMENTO_NOVO).toBe('treinamento_novo');
      expect(NotificacaoTipoEnum.COMUNIDADE_NOVO_COMENTARIO).toBe('comunidade_novo_comentario');
      expect(NotificacaoTipoEnum.COMUNIDADE_NOVA_CURTIDA).toBe('comunidade_nova_curtida');
      expect(NotificacaoTipoEnum.OUTRO).toBe('outro');
    });

    it('should have the correct values for NotificacaoOrigemEnum', () => {
      expect(NotificacaoOrigemEnum.SISTEMA).toBe('sistema');
      expect(NotificacaoOrigemEnum.USUARIO).toBe('usuario');
      expect(NotificacaoOrigemEnum.ADMIN).toBe('admin');
    });

    it('should have the correct values for EntidadeTipoEnum', () => {
      expect(EntidadeTipoEnum.USER).toBe('User');
      expect(EntidadeTipoEnum.CONTRATACAO).toBe('Contratacao');
      expect(EntidadeTipoEnum.OFERTA_SERVICO).toBe('OfertaServico');
      expect(EntidadeTipoEnum.AVALIACAO).toBe('Avaliacao');
      expect(EntidadeTipoEnum.NEGOCIACAO).toBe('Negociacao');
      expect(EntidadeTipoEnum.ANUNCIO).toBe('Anuncio');
      expect(EntidadeTipoEnum.TREINAMENTO).toBe('Treinamento');
      expect(EntidadeTipoEnum.PUBLICACAO_COMUNIDADE).toBe('PublicacaoComunidade');
      expect(EntidadeTipoEnum.COMENTARIO).toBe('Comentario');
    });
  });
});
