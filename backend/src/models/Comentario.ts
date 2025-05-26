// models/Comentario.ts

/**
 * Modelo Comentario
 * Representa um comentário feito por um usuário em uma PublicacaoComunidade.
 * Também suporta respostas aninhadas a outros comentários e moderação.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { IPublicacaoComunidade } from './PublicacaoComunidade';

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
  publicacaoId: Types.ObjectId | IPublicacaoComunidade; // Referência à publicação que pode ser populada
  autorId: Types.ObjectId | IUser; // Referência ao autor que pode ser populada
  conteudo: string;
  respostaParaComentarioId?: Types.ObjectId | IComentario | null; // Referência opcional a outro comentário (para respostas)
  contagemLikes: number;
  status: ComentarioStatusEnum;
  // Campos de data
  createdAt: Date; // Data de criação do comentário
  updatedAt: Date; // Data da última atualização
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, utilizando a interface IComentario para tipagem
const ComentarioSchema: Schema<IComentario> = new Schema(
  {
    publicacaoId: {
      type: Schema.Types.ObjectId,
      ref: 'PublicacaoComunidade',
      required: [true, 'A ID da publicação é obrigatória para o comentário.'],
      index: true // Cria índice para otimizar consultas por publicação
    },
    autorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do autor do comentário é obrigatório.'],
      index: true // Cria índice para otimizar consultas por autor
    },
    conteudo: {
      type: String,
      required: [true, 'O conteúdo do comentário é obrigatório.'],
      trim: true,
      minlength: [1, 'O comentário não pode estar vazio.'],
      maxlength: [2000, 'O comentário não pode exceder 2000 caracteres.']
    },
    respostaParaComentarioId: { // Referência a outro comentário quando este é uma resposta
      type: Schema.Types.ObjectId,
      ref: 'Comentario',
      default: null, // Valor nulo indica que é um comentário principal
      index: true, // Cria índice para otimizar consultas por respostas
      required: false
    },
    contagemLikes: { // Armazena o número de curtidas recebidas
      type: Number,
      default: 0,
      min: 0,
      required: true // Campo obrigatório no documento
    },
    status: { // Controla a visibilidade e moderação do comentário
      type: String,
      enum: {
        values: Object.values(ComentarioStatusEnum),
        message: 'Status de comentário inválido: {VALUE}.'
      },
      default: ComentarioStatusEnum.APROVADO, // Comentários são aprovados por padrão
      required: true,
      index: true
    },
  },
  {
    timestamps: true // Adiciona campos automáticos de data de criação e atualização
  }
);

// --- Índices ---
// Cria um índice composto para otimizar consultas de comentários por publicação, status, hierarquia e data
ComentarioSchema.index({ publicacaoId: 1, status: 1, respostaParaComentarioId: 1, createdAt: 1 });

// --- Lembretes para Implementação ---
// 1. Atualização de contadores: Ao criar/deletar um comentário principal, é necessário
//    incrementar/decrementar o campo 'contagemComentarios' na PublicacaoComunidade relacionada.
// 2. Sistema de curtidas: Utilize o modelo 'Curtida.ts' para registrar curtidas em comentários
//    e atualize o campo 'contagemLikes' neste modelo quando houver alterações.

// --- Exportação do Modelo ---
// Cria e exporta o modelo Mongoose 'Comentario' com a tipagem da interface IComentario
const Comentario = mongoose.model<IComentario>('Comentario', ComentarioSchema);

export default Comentario;
