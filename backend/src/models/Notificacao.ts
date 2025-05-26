// models/Notificacao.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Notificacao (Revisado)
 * Representa uma notificação enviada a um usuário, com contexto e ação.
 * Este modelo gerencia todas as notificações do sistema, permitindo rastreamento
 * e interação com diferentes tipos de eventos.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação
import { IUser } from './User'; 

// --- Enums e Interfaces ---

// Enum que define todos os tipos possíveis de notificação no sistema
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

// Enum que define a origem da notificação (quem ou o que gerou a notificação)
export enum NotificacaoOrigemEnum {
  SISTEMA = 'sistema',
  USUARIO = 'usuario',
  ADMIN = 'admin'
}

// Enum que define os tipos de entidades que podem estar relacionadas a uma notificação
// Os valores devem corresponder exatamente aos nomes dos modelos Mongoose
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

// Interface que define a estrutura do objeto entidadeRelacionada, usado para vincular a notificação a uma entidade específica
interface IEntidadeRelacionada {
  id: Types.ObjectId;
  tipo: EntidadeTipoEnum;
}

// Interface principal que define a estrutura completa de um documento Notificacao no MongoDB
export interface INotificacao extends Document {
  usuarioId: Types.ObjectId | IUser; // ID do usuário que receberá a notificação (pode ser populado com dados do usuário)
  lida: boolean; // Indica se a notificação já foi lida pelo usuário
  origem: NotificacaoOrigemEnum; // Define a origem da notificação (sistema, usuário ou admin)
  remetenteId?: Types.ObjectId | IUser; // ID do usuário que enviou a notificação (quando origem='usuario')
  tipoNotificacao: NotificacaoTipoEnum; // Categoria/tipo da notificação
  titulo: string; // Título curto da notificação
  mensagem: string; // Conteúdo detalhado da notificação
  linkRelacionado?: string; // URL ou rota interna do aplicativo relacionada à notificação
  entidadeRelacionada?: IEntidadeRelacionada; // Objeto que vincula a notificação a uma entidade específica
  // Campos de data e hora
  createdAt: Date; // Data e hora de criação da notificação
  updatedAt: Date; // Data e hora da última atualização (pode indicar quando foi lida)
}

// --- Schema Mongoose ---

// Define a estrutura do Schema Mongoose para o modelo Notificacao, baseado na interface INotificacao
const NotificacaoSchema: Schema<INotificacao> = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do usuário destinatário é obrigatório.'],
      index: true // Indexado para melhorar a performance de consultas
    },
    lida: {
      type: Boolean,
      default: false, // Por padrão, notificações são criadas como não lidas
      index: true // Indexado para facilitar a filtragem de notificações não lidas
    },
    origem: {
      type: String,
      enum: {
        values: Object.values(NotificacaoOrigemEnum),
        message: 'Origem inválida: {VALUE}.'
      },
      required: true,
      default: NotificacaoOrigemEnum.SISTEMA // Por padrão, notificações são do sistema
    },
    remetenteId: { // ID do usuário que enviou a notificação
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Não obrigatório por padrão
      // A validação para exigir este campo quando origem='usuario' deve ser implementada na camada de serviço
    },
    tipoNotificacao: {
      type: String,
      enum: {
        values: Object.values(NotificacaoTipoEnum),
        message: 'Tipo de notificação inválido: {VALUE}.'
      },
      required: [true, 'O tipo da notificação é obrigatório.'],
      index: true // Indexado para facilitar a busca por tipo de notificação
    },
    titulo: {
      type: String,
      required: [true, 'O título da notificação é obrigatório.'],
      trim: true, // Remove espaços em branco no início e fim
      maxlength: [100, 'O título não pode exceder 100 caracteres.']
    },
    mensagem: {
      type: String,
      required: [true, 'A mensagem da notificação é obrigatória.'],
      trim: true, // Remove espaços em branco no início e fim
      maxlength: [500, 'A mensagem não pode exceder 500 caracteres.']
    },
    linkRelacionado: {
      type: String,
      trim: true, // Remove espaços em branco no início e fim
      required: false // Campo opcional
      // Pode-se adicionar validação de URL/rota se necessário
    },
    entidadeRelacionada: { // Objeto que armazena informações sobre a entidade relacionada à notificação
      type: { // Definição explícita do tipo do objeto para o Mongoose
        id: { type: Schema.Types.ObjectId, required: false }, // ID da entidade relacionada
        tipo: { type: String, enum: Object.values(EntidadeTipoEnum), required: false } // Tipo da entidade relacionada
      },
      required: false, // O objeto entidadeRelacionada é opcional
      default: undefined // Não cria um objeto vazio por padrão
      // A validação para garantir que se 'id' existe, 'tipo' também existe (e vice-versa)
      // deve ser implementada na camada de serviço ou com validadores de schema personalizados
    }
    // O campo dataNotificacao foi removido - usar o campo createdAt gerado automaticamente
  },
  {
    timestamps: true // Adiciona automaticamente os campos createdAt e updatedAt ao documento
  }
);

// --- Índices ---
// Índice composto principal para otimizar a busca de notificações de um usuário específico
// Ordenadas por: não lidas primeiro e depois pelas mais recentes
NotificacaoSchema.index({ usuarioId: 1, lida: 1, createdAt: -1 });

// Índice para otimizar a busca de notificações relacionadas a uma entidade específica
// A opção sparse:true é usada porque nem todas as notificações terão o campo entidadeRelacionada preenchido
NotificacaoSchema.index({ 'entidadeRelacionada.id': 1, 'entidadeRelacionada.tipo': 1 }, { sparse: true });

// --- Exportação do Modelo ---
// Cria o modelo 'Notificacao' no MongoDB e o exporta com a tipagem INotificacao
const Notificacao = mongoose.model<INotificacao>('Notificacao', NotificacaoSchema);

export default Notificacao;
