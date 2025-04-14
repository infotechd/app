// models/Avaliacao.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Avaliacao (Revisado)
 * Representa uma avaliação realizada por um usuário (autor) para outro (receptor),
 * obrigatoriamente vinculada a uma contratação específica.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { IContratacao } from './Contratacao'; // Ajuste o caminho se necessário

// --- Interfaces ---

// Interface principal que define a estrutura de um documento Avaliacao
export interface IAvaliacao extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Pode ser populado
  autor: Types.ObjectId | IUser; // Pode ser populado
  receptor: Types.ObjectId | IUser; // Pode ser populado
  nota: number;
  comentario?: string; // Opcional
  // Timestamps
  createdAt: Date; // Data da avaliação
  updatedAt: Date;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IAvaliacao para tipagem
const AvaliacaoSchema: Schema<IAvaliacao> = new Schema(
  {
    contratacaoId: { // Referência à contratação que originou esta avaliação
      type: Schema.Types.ObjectId,
      ref: 'Contratacao',
      required: [true, 'A ID da contratação é obrigatória para a avaliação.'],
      index: true // Otimiza a busca por avaliações de uma contratação
    },
    autor: { // Usuário que está fazendo a avaliação
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do autor da avaliação é obrigatório.']
    },
    receptor: { // Usuário que está recebendo a avaliação
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do receptor da avaliação é obrigatório.'],
      index: true // Pode ser útil indexar para buscar todas as avaliações recebidas
    },
    nota: { // Nota numérica da avaliação
      type: Number,
      required: [true, 'A nota é obrigatória.'],
      min: [1, 'A nota mínima é 1.'],
      max: [5, 'A nota máxima é 5.']
    },
    comentario: { // Comentário textual (opcional)
      type: String,
      trim: true,
      maxlength: [1000, 'O comentário não pode exceder 1000 caracteres.'],
      required: false // Comentário é opcional
    }
    // Campo 'dataAvaliacao' removido - usar 'createdAt' dos timestamps
  },
  {
    timestamps: true // Adiciona createdAt (data da avaliação) e updatedAt
  }
);

// --- Índices ---
// Índice para buscar rapidamente todas as avaliações recebidas por um usuário
AvaliacaoSchema.index({ receptor: 1, createdAt: -1 }); // Ordena da mais recente para a mais antiga

// Índice composto ÚNICO: Garante que um autor só possa avaliar um receptor
// UMA ÚNICA VEZ para uma determinada contratação. Previne avaliações duplicadas.
AvaliacaoSchema.index({ autor: 1, receptor: 1, contratacaoId: 1 }, { unique: true });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Avaliacao' tipado com IAvaliacao
const Avaliacao = mongoose.model<IAvaliacao>('Avaliacao', AvaliacaoSchema);

export default Avaliacao;