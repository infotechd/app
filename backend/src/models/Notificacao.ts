// models/Notificacao.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Notificacao (Revisado)
 * Representa uma notificação enviada a um usuário, com contexto e ação.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os tipos possíveis de notificação (ajuste/expanda conforme necessário)
export enum NotificacaoTipoEnum {
  CHAT_NOVA_MENSAGEM = 'chat_nova_mensagem',
  CONTRATACAO_NOVA = 'contratacao_nova',
  CONTRATACAO_STATUS_ACEITA = 'contratacao_status_aceita',
  CONTRATACAO_STATUS_ANDAMENTO = 'contratacao_status_andamento',
  CONTRATACAO_STATUS_CONCLUIDO = 'contratacao_status_concluido',
  CONTRATACAO_STATUS_CANCELADO = 'contratacao_status_cancelado',
  CONTRATACAO_STATUS_DISPUTA = 'contratacao_status_disputa',
  OFERTA_NOVA_RELEVANTE = 'oferta_nova_relevante',
  AVALIACAO_SOLICITACAO = 'avaliacao_solicitacao',
  AVALIACAO_RECEBIDA = 'avaliacao_recebida',
  NEGOCIACAO_NOVA_PROPOSTA = 'negociacao_nova_proposta',
  NEGOCIACAO_ACEITA = 'negociacao_aceita',
  NEGOCIACAO_REJEITADA = 'negociacao_rejeitada',
  ANUNCIO_SISTEMA = 'anuncio_sistema',
  TREINAMENTO_NOVO = 'treinamento_novo',
  COMUNIDADE_NOVO_COMENTARIO = 'comunidade_novo_comentario',
  COMUNIDADE_NOVA_CURTIDA = 'comunidade_nova_curtida',
  OUTRO = 'outro'
}

// Enum para a origem da notificação
export enum NotificacaoOrigemEnum {
  SISTEMA = 'sistema',
  USUARIO = 'usuario',
  ADMIN = 'admin'
}

// Enum para os tipos de entidade relacionada (deve corresponder aos NOMES DOS MODELOS Mongoose)
export enum EntidadeTipoEnum {
  USER = 'User',
  CONTRATACAO = 'Contratacao',
  OFERTA_SERVICO = 'OfertaServico',
  AVALIACAO = 'Avaliacao',
  NEGOCIACAO = 'Negociacao',
  ANUNCIO = 'Anuncio',
  TREINAMENTO = 'Treinamento',
  PUBLICACAO_COMUNIDADE = 'PublicacaoComunidade',
  COMENTARIO = 'Comentario'
  // Adicione outros nomes de modelos se necessário
}

// Interface para o objeto opcional entidadeRelacionada
interface IEntidadeRelacionada {
  id: Types.ObjectId;
  tipo: EntidadeTipoEnum;
}

// Interface principal que define a estrutura de um documento Notificacao
export interface INotificacao extends Document {
  usuarioId: Types.ObjectId | IUser; // Destinatário (pode ser populado)
  lida: boolean;
  origem: NotificacaoOrigemEnum;
  remetenteId?: Types.ObjectId | IUser; // Remetente (se origem='usuario', pode ser populado)
  tipoNotificacao: NotificacaoTipoEnum;
  titulo: string;
  mensagem: string;
  linkRelacionado?: string; // URL ou rota interna do app
  entidadeRelacionada?: IEntidadeRelacionada; // Opcional
  // Timestamps
  createdAt: Date; // Data da notificação
  updatedAt: Date; // Pode ser usado para marcar data de leitura se 'lida' fosse Date
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface INotificacao para tipagem
const NotificacaoSchema: Schema<INotificacao> = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do usuário destinatário é obrigatório.'],
      index: true
    },
    lida: {
      type: Boolean,
      default: false,
      index: true
    },
    origem: {
      type: String,
      enum: {
        values: Object.values(NotificacaoOrigemEnum),
        message: 'Origem inválida: {VALUE}.'
      },
      required: true,
      default: NotificacaoOrigemEnum.SISTEMA
    },
    remetenteId: { // Opcional, relevante se origem for 'usuario'
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Não obrigatório por padrão
      // Validação para exigir se origem === 'usuario' pode ser feita na camada de serviço
    },
    tipoNotificacao: {
      type: String,
      enum: {
        values: Object.values(NotificacaoTipoEnum),
        message: 'Tipo de notificação inválido: {VALUE}.'
      },
      required: [true, 'O tipo da notificação é obrigatório.'],
      index: true
    },
    titulo: {
      type: String,
      required: [true, 'O título da notificação é obrigatório.'],
      trim: true,
      maxlength: [100, 'O título não pode exceder 100 caracteres.']
    },
    mensagem: {
      type: String,
      required: [true, 'A mensagem da notificação é obrigatória.'],
      trim: true,
      maxlength: [500, 'A mensagem não pode exceder 500 caracteres.']
    },
    linkRelacionado: {
      type: String,
      trim: true,
      required: false
      // Adicionar validação de URL/rota se necessário
    },
    entidadeRelacionada: { // Armazena ID e tipo da entidade relacionada
      type: { // Tipo Mongoose explícito para o objeto
        id: { type: Schema.Types.ObjectId, required: false }, // ID não é obrigatório no sub-schema
        tipo: { type: String, enum: Object.values(EntidadeTipoEnum), required: false } // Tipo não é obrigatório no sub-schema
      },
      required: false, // O objeto como um todo é opcional
      default: undefined // Não cria objeto vazio por default
      // Validação para garantir que se 'id' existe, 'tipo' também existe (e vice-versa)
      // pode ser feita na camada de serviço ou com validadores de schema mais complexos.
    }
    // dataNotificacao removida - usar createdAt
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices ---
// Índice principal para buscar notificações de um usuário (não lidas, mais recentes primeiro)
NotificacaoSchema.index({ usuarioId: 1, lida: 1, createdAt: -1 });

// Índice para buscar notificações relacionadas a uma entidade específica (se necessário)
// Sparse: true porque nem toda notificação terá entidadeRelacionada preenchida
NotificacaoSchema.index({ 'entidadeRelacionada.id': 1, 'entidadeRelacionada.tipo': 1 }, { sparse: true });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Notificacao' tipado com INotificacao
const Notificacao = mongoose.model<INotificacao>('Notificacao', NotificacaoSchema);

export default Notificacao;