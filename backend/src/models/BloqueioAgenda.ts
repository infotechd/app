// models/BloqueioAgenda.ts

/**
 * Modelo BloqueioAgenda
 * Representa um período de tempo manualmente marcado como indisponível
 * na agenda de um prestador de serviço, independente de uma contratação.
 */
import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface do usuário para relacionamento entre modelos
import { IUser } from './User';

// --- Interfaces ---

// Interface principal que define a estrutura de um documento BloqueioAgenda
export interface IBloqueioAgenda extends Document {
  prestadorId: Types.ObjectId | IUser; // Referência ao prestador de serviço
  dataInicio: Date; // Data e hora de início do bloqueio
  dataFim: Date; // Data e hora de término do bloqueio
  motivo?: string; // Motivo opcional do bloqueio
  // Campos de controle de data
  createdAt: Date; // Data de criação do registro
  updatedAt: Date; // Data da última atualização
}

// --- Função de Validação ---

// Função para garantir que a data final seja igual ou posterior à data inicial
function validarDataFim(this: HydratedDocument<IBloqueioAgenda>, value: Date): boolean {
  // 'this' referencia o documento atual sendo validado
  // 'value' contém o valor do campo dataFim que está sendo validado
  return value >= this.dataInicio;
}

// --- Definição do Schema Mongoose ---

// Define a estrutura do modelo usando a interface IBloqueioAgenda
const BloqueioAgendaSchema: Schema<IBloqueioAgenda> = new Schema(
  {
    prestadorId: { // ID do prestador de serviço que criou o bloqueio
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do prestador é obrigatório.'],
      index: true // Cria índice para otimizar consultas por prestador
    },
    dataInicio: { // Momento de início do período bloqueado
      type: Date,
      required: [true, 'A data de início do bloqueio é obrigatória.']
    },
    dataFim: { // Momento de término do período bloqueado
      type: Date,
      required: [true, 'A data de fim do bloqueio é obrigatória.'],
      validate: [validarDataFim, 'A data de fim deve ser igual ou posterior à data de início.']
    },
    motivo: { // Razão opcional para o bloqueio da agenda
      type: String,
      trim: true,
      maxlength: [200, 'O motivo não pode exceder 200 caracteres.'],
      required: false // Campo não obrigatório
    },
    // Possibilidade de adicionar campos adicionais no futuro
  },
  {
    timestamps: true // Adiciona campos automáticos de createdAt e updatedAt
  }
);

// --- Índices Compostos ---
// Cria índice composto para otimizar consultas de bloqueios por prestador em um intervalo de tempo
BloqueioAgendaSchema.index({ prestadorId: 1, dataInicio: 1, dataFim: 1 });
// Outros índices que podem ser úteis dependendo dos padrões de consulta
// BloqueioAgendaSchema.index({ prestadorId: 1, dataInicio: -1 });
// BloqueioAgendaSchema.index({ prestadorId: 1, dataFim: 1 });

// --- Exportação do Modelo ---
// Cria o modelo 'BloqueioAgenda' a partir do schema definido e o exporta
const BloqueioAgenda = mongoose.model<IBloqueioAgenda>('BloqueioAgenda', BloqueioAgendaSchema);

export default BloqueioAgenda;
