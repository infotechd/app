// models/Curtida.ts

/**
 * Modelo Curtida
 * Representa a ação de um usuário curtir um item específico (polimórfico),
 * como uma PublicacaoComunidade ou um Comentario.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação
import { IUser } from './User';

// --- Enums e Interfaces ---

// Enum para os tipos de itens que podem ser curtidos
// IMPORTANTE: Os valores devem corresponder exatamente aos nomes dos Modelos Mongoose referenciados
export enum TipoItemCurtidoEnum {
  PUBLICACAO_COMUNIDADE = 'PublicacaoComunidade',
  COMENTARIO = 'Comentario'
  // Possibilidade de adicionar outros tipos de itens que podem ser curtidos no futuro
}

// Interface principal que define a estrutura de um documento Curtida
export interface ICurtida extends Document {
  usuarioId: Types.ObjectId | IUser; // Referência ao usuário que realizou a curtida
  itemCurtidoId: Types.ObjectId; // ID do item que recebeu a curtida (PublicacaoComunidade ou Comentario)
  tipoItemCurtido: TipoItemCurtidoEnum; // Tipo do item que recebeu a curtida
  // Registro de data e hora da curtida
  createdAt: Date;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose utilizando a interface ICurtida para tipagem
const CurtidaSchema: Schema<ICurtida> = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do usuário é obrigatório.'],
      index: true
    },
    itemCurtidoId: {
      type: Schema.Types.ObjectId,
      // Campo polimórfico que pode referenciar diferentes modelos
      required: [true, 'O ID do item curtido é obrigatório.'],
      index: true
    },
    tipoItemCurtido: {
      type: String,
      required: [true, 'O tipo do item curtido é obrigatório.'],
      enum: {
        values: Object.values(TipoItemCurtidoEnum), // Utiliza os valores definidos no Enum
        message: 'Tipo de item curtido inválido: {VALUE}.'
      },
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Registra apenas a data de criação
  }
);

// --- Índice Composto ÚNICO ---
// Garante que um usuário só possa curtir um item específico (de um tipo específico) UMA ÚNICA VEZ.
CurtidaSchema.index({ usuarioId: 1, itemCurtidoId: 1, tipoItemCurtido: 1 }, { unique: true });

// --- Lógica Associada (Lembrete para implementação nos Services/Controllers) ---
// - Ao Curtir: Criar documento Curtida e incrementar contador no item pai
// - Ao Descurtir: Remover documento Curtida e decrementar contador no item pai
// - Para listar quem curtiu: Consultar esta coleção filtrando por itemCurtidoId e tipoItemCurtido

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Curtida' com a tipagem da interface ICurtida
const Curtida = mongoose.model<ICurtida>('Curtida', CurtidaSchema);

export default Curtida;
