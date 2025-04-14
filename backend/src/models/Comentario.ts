// models/Comentario.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Comentario
 * Representa um comentário feito por um usuário em uma PublicacaoComunidade.
 * Também suporta respostas aninhadas a outros comentários e moderação.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User'; // Ajuste o caminho se necessário
import { IPublicacaoComunidade } from './PublicacaoComunidade'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os status de moderação do comentário
export enum ComentarioStatusEnum {
  APROVADO = 'aprovado',
  PENDENTE_APROVACAO = 'pendente_aprovacao',
  OCULTO_PELO_ADMIN = 'oculto_pelo_admin',
  REMOVIDO_PELO_AUTOR = 'removido_pelo_autor'
}

// Interface principal que define a estrutura de um documento Comentario
export interface IComentario extends Document {
  publicacaoId: Types.ObjectId | IPublicacaoComunidade; // Pode ser populado
  autorId: Types.ObjectId | IUser; // Pode ser populado
  conteudo: string;
  respostaParaComentarioId?: Types.ObjectId | IComentario | null; // Opcional, pode ser populado
  contagemLikes: number;
  status: ComentarioStatusEnum;
  // Timestamps
  createdAt: Date; // Data do comentário
  updatedAt: Date;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IComentario para tipagem
const ComentarioSchema: Schema<IComentario> = new Schema(
  {
    publicacaoId: {
      type: Schema.Types.ObjectId,
      ref: 'PublicacaoComunidade',
      required: [true, 'A ID da publicação é obrigatória para o comentário.'],
      index: true // Otimiza busca por comentários de uma publicação
    },
    autorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do autor do comentário é obrigatório.'],
      index: true // Otimiza busca por comentários de um autor
    },
    conteudo: {
      type: String,
      required: [true, 'O conteúdo do comentário é obrigatório.'],
      trim: true,
      minlength: [1, 'O comentário não pode estar vazio.'],
      maxlength: [2000, 'O comentário não pode exceder 2000 caracteres.']
    },
    respostaParaComentarioId: { // Auto-referência para respostas aninhadas
      type: Schema.Types.ObjectId,
      ref: 'Comentario',
      default: null, // null = comentário principal
      index: true, // Otimiza busca por respostas
      required: false
    },
    contagemLikes: { // Contador de curtidas no comentário
      type: Number,
      default: 0,
      min: 0,
      required: true // Garante que o campo exista
    },
    status: { // Status de moderação do comentário
      type: String,
      enum: {
        values: Object.values(ComentarioStatusEnum),
        message: 'Status de comentário inválido: {VALUE}.'
      },
      default: ComentarioStatusEnum.APROVADO, // Default para aprovado (ajuste se necessário)
      required: true,
      index: true
    },
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices ---
// Otimiza a busca de comentários (status aprovado) e respostas de uma publicação, ordenados por data
ComentarioSchema.index({ publicacaoId: 1, status: 1, respostaParaComentarioId: 1, createdAt: 1 });

// --- Lembretes (Mantidos para clareza) ---
// 1. Contagem em PublicacaoComunidade: Lembre-se de incrementar/decrementar 'contagemComentarios'
//    na PublicacaoComunidade ao criar/deletar este Comentario (se respostaParaComentarioId for null).
// 2. Likes de Comentários: Use o modelo 'Curtida.ts' (referenciando 'Comentario') e atualize 'contagemLikes' aqui.

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Comentario' tipado com IComentario
const Comentario = mongoose.model<IComentario>('Comentario', ComentarioSchema);

export default Comentario;