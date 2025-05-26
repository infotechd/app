// arquivo: models/Avaliacao.ts (Backend - Modelo de avaliações do sistema)

/**
 * Modelo Avaliacao
 * Representa uma avaliação realizada por um usuário (autor) para outro (receptor),
 * obrigatoriamente vinculada a uma contratação específica no sistema.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importação das interfaces de outros modelos relacionados
import { IUser } from './User';
import { IContratacao } from './Contratacao'; // Interface da contratação

// --- Interfaces ---

// Interface principal que define a estrutura de um documento Avaliacao
export interface IAvaliacao extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Referência à contratação associada
  autor: Types.ObjectId | IUser; // Usuário que criou a avaliação
  receptor: Types.ObjectId | IUser; // Usuário que recebeu a avaliação
  nota: number;
  comentario?: string; // Campo opcional para comentários textuais
  // Campos de data automáticos
  createdAt: Date; // Data de criação da avaliação
  updatedAt: Date; // Data da última atualização
}

// --- Schema Mongoose ---

// Define o esquema Mongoose, utilizando a interface IAvaliacao para tipagem
const AvaliacaoSchema: Schema<IAvaliacao> = new Schema(
  {
    contratacaoId: { // Referência à contratação que originou esta avaliação
      type: Schema.Types.ObjectId,
      ref: 'Contratacao',
      required: [true, 'A ID da contratação é obrigatória para a avaliação.'],
      index: true // Cria índice para otimizar buscas por contratação
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
      index: true // Índice para facilitar buscas de avaliações recebidas
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
      required: false // Campo não obrigatório
    }
    // Campo 'dataAvaliacao' foi removido - utilizamos 'createdAt' dos timestamps
  },
  {
    timestamps: true // Adiciona campos automáticos createdAt e updatedAt
  }
);

// --- Índices ---
// Índice para buscar rapidamente todas as avaliações recebidas por um usuário
AvaliacaoSchema.index({ receptor: 1, createdAt: -1 }); // Ordenação das avaliações da mais recente para a mais antiga

// Índice composto com restrição de unicidade
// Garante que um autor só possa avaliar um receptor uma única vez para cada contratação
// Previne a criação de avaliações duplicadas no sistema
AvaliacaoSchema.index({ autor: 1, receptor: 1, contratacaoId: 1 }, { unique: true });

// --- Exportação do Modelo ---
// Cria o modelo 'Avaliacao' baseado no schema definido e com tipagem da interface IAvaliacao
const Avaliacao = mongoose.model<IAvaliacao>('Avaliacao', AvaliacaoSchema);

// Exporta o modelo para uso em outros arquivos da aplicação
export default Avaliacao;
