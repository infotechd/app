// models/PublicacaoComunidade.ts (Backend - Convertido para TypeScript)

/**
 * Modelo PublicacaoComunidade (Revisado)
 * Representa publicações na comunidade (posts e eventos) criados por qualquer usuário.
 * Comentários e Likes são gerenciados em coleções separadas para melhor performance.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os tipos de publicação
export enum PublicacaoTipoEnum {
  POST = 'post',
  EVENTO = 'evento'
}

// Enum para os status de moderação da publicação
export enum PublicacaoStatusEnum {
  PENDENTE_APROVACAO = 'pendente_aprovacao',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  OCULTO_PELO_AUTOR = 'oculto_pelo_autor',
  OCULTO_PELO_ADMIN = 'oculto_pelo_admin',
  RASCUNHO = 'rascunho'
}

// Interface principal que define a estrutura de um documento PublicacaoComunidade
export interface IPublicacaoComunidade extends Document {
  autorId: Types.ObjectId | IUser; // Pode ser populado
  conteudo: string;
  imagens?: string[];
  tipo: PublicacaoTipoEnum;
  dataEvento?: Date; // Opcional
  localEvento?: string; // Opcional
  contagemLikes: number;
  contagemComentarios: number;
  status: PublicacaoStatusEnum;
  motivoReprovacaoOuOcultacao?: string; // Opcional
  // Timestamps
  createdAt: Date; // Data da postagem
  updatedAt: Date;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IPublicacaoComunidade para tipagem
const PublicacaoComunidadeSchema: Schema<IPublicacaoComunidade> = new Schema(
  {
    autorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O autor da publicação é obrigatório.'],
      index: true
    },
    conteudo: {
      type: String,
      required: [true, 'O conteúdo é obrigatório.'],
      trim: true,
      minlength: [1, 'O conteúdo não pode estar vazio.'],
      maxlength: [5000, 'O conteúdo não pode exceder 5000 caracteres.']
    },
    imagens: {
      type: [String], // Array de URLs/caminhos
      default: [],
      required: false,
      validate: [ // Exemplo: Limite de 5 imagens
        (arr: string[]) => !arr || arr.length <= 5,
        'É permitido no máximo 5 imagens por publicação.'
      ]
    },
    tipo: {
      type: String,
      enum: {
        values: Object.values(PublicacaoTipoEnum),
        message: 'Tipo de publicação inválido: {VALUE}.'
      },
      default: PublicacaoTipoEnum.POST,
      required: true,
      index: true
    },
    // --- Campos específicos para Eventos (Opcionais) ---
    dataEvento: {
      type: Date,
      required: false
      // Validação condicional (required if tipo='evento') deve ser feita na camada de serviço
    },
    localEvento: {
      type: String,
      trim: true,
      maxlength: [200, 'O local do evento não pode exceder 200 caracteres.'],
      required: false
      // Validação condicional (required if tipo='evento') deve ser feita na camada de serviço
    },
    // --- Contadores ---
    contagemLikes: {
      type: Number,
      default: 0,
      min: 0,
      required: true // Garante que o campo sempre exista
    },
    contagemComentarios: { // Inclui comentários principais e respostas
      type: Number,
      default: 0,
      min: 0,
      required: true // Garante que o campo sempre exista
    },
    // --- Status de Moderação ---
    status: {
      type: String,
      enum: {
        values: Object.values(PublicacaoStatusEnum),
        message: 'Status inválido: {VALUE}.'
      },
      default: PublicacaoStatusEnum.APROVADO, // Mude para PENDENTE se precisar aprovar tudo
      required: true,
      index: true
    },
    motivoReprovacaoOuOcultacao: {
      type: String,
      trim: true,
      maxlength: 500,
      required: false
    }
    // dataPostagem removida - usar createdAt
    // comentarios removido
    // likes removido
  },
  {
    timestamps: true // Adiciona createdAt (data da postagem) e updatedAt
  }
);

// --- Índices ---
PublicacaoComunidadeSchema.index({ status: 1, createdAt: -1 }); // Feed principal
PublicacaoComunidadeSchema.index({ autorId: 1, status: 1, createdAt: -1 }); // Posts de um autor
// PublicacaoComunidadeSchema.index({ tipo: 1, status: 1, dataEvento: 1 }); // Eventos futuros

// --- Lembretes sobre Comentários e Likes ---
// Lembre-se de usar os modelos Comentario.ts e Curtida.ts e de
// atualizar os campos contagemLikes/contagemComentarios aqui via $inc
// nos seus controllers/services ao criar/deletar aqueles documentos.

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'PublicacaoComunidade' tipado com IPublicacaoComunidade
const PublicacaoComunidade = mongoose.model<IPublicacaoComunidade>('PublicacaoComunidade', PublicacaoComunidadeSchema);

export default PublicacaoComunidade;