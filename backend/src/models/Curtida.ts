// models/Curtida.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Curtida (Like)
 * Representa a ação de um usuário curtir um item específico (polimórfico),
 * como uma PublicacaoComunidade ou um Comentario.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os tipos de itens que podem ser curtidos
// IMPORTANTE: Os valores devem corresponder exatamente aos nomes dos Modelos Mongoose referenciados
export enum TipoItemCurtidoEnum {
  PUBLICACAO_COMUNIDADE = 'PublicacaoComunidade',
  COMENTARIO = 'Comentario'
  // Adicionar outros tipos se mais itens puderem ser curtidos (ex: 'OfertaServico')
}

// Interface principal que define a estrutura de um documento Curtida
export interface ICurtida extends Document {
  usuarioId: Types.ObjectId | IUser; // Usuário que curtiu (pode ser populado)
  itemCurtidoId: Types.ObjectId; // ID do documento curtido (PublicacaoComunidade ou Comentario)
  tipoItemCurtido: TipoItemCurtidoEnum; // Tipo do documento curtido
  // Timestamp (apenas createdAt é relevante)
  createdAt: Date;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface ICurtida para tipagem
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
      // Não usamos 'ref' aqui porque é polimórfico (pode referenciar diferentes modelos)
      required: [true, 'O ID do item curtido é obrigatório.'],
      index: true
    },
    tipoItemCurtido: {
      type: String,
      required: [true, 'O tipo do item curtido é obrigatório.'],
      enum: {
        values: Object.values(TipoItemCurtidoEnum), // Usa valores do Enum TS
        message: 'Tipo de item curtido inválido: {VALUE}.'
      },
      index: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Apenas createdAt
  }
);

// --- Índice Composto ÚNICO ---
// Garante que um usuário só possa curtir um item específico (de um tipo específico) UMA ÚNICA VEZ.
CurtidaSchema.index({ usuarioId: 1, itemCurtidoId: 1, tipoItemCurtido: 1 }, { unique: true });

// --- Lógica Associada (Relembrete - Implementar nos Services/Controllers) ---
// - Ao Curtir: Tentar criar Curtida -> Se sucesso, incrementar contagem no item pai ($inc).
// - Ao Descurtir: Tentar remover Curtida -> Se sucesso, decrementar contagem no item pai ($inc).
// - Para saber Quem Curtiu: Buscar nesta coleção por itemCurtidoId e tipoItemCurtido.

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Curtida' tipado com ICurtida
const Curtida = mongoose.model<ICurtida>('Curtida', CurtidaSchema);

export default Curtida;