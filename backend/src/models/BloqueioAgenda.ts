// models/BloqueioAgenda.ts (Backend - Convertido para TypeScript)

/**
 * Modelo BloqueioAgenda
 * Representa um período de tempo manualmente marcado como indisponível
 * na agenda de um prestador de serviço, independente de uma contratação.
 */
import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Interfaces ---

// Interface principal que define a estrutura de um documento BloqueioAgenda
export interface IBloqueioAgenda extends Document {
  prestadorId: Types.ObjectId | IUser; // Pode ser populado
  dataInicio: Date;
  dataFim: Date;
  motivo?: string; // Opcional
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// --- Função de Validação (Tipada) ---

// Função para garantir que dataFim seja >= dataInicio
function validarDataFim(this: HydratedDocument<IBloqueioAgenda>, value: Date): boolean {
  // 'this' se refere ao documento que está sendo validado
  // 'value' é o valor do campo dataFim sendo validado
  return value >= this.dataInicio;
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IBloqueioAgenda para tipagem
const BloqueioAgendaSchema: Schema<IBloqueioAgenda> = new Schema(
  {
    prestadorId: { // Prestador de serviço que criou o bloqueio
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do prestador é obrigatório.'],
      index: true // Otimiza a busca de bloqueios por prestador
    },
    dataInicio: { // Data e hora de início do período bloqueado
      type: Date,
      required: [true, 'A data de início do bloqueio é obrigatória.']
    },
    dataFim: { // Data e hora de fim do período bloqueado
      type: Date,
      required: [true, 'A data de fim do bloqueio é obrigatória.'],
      validate: [validarDataFim, 'A data de fim deve ser igual ou posterior à data de início.']
    },
    motivo: { // Descrição opcional do motivo do bloqueio
      type: String,
      trim: true,
      maxlength: [200, 'O motivo não pode exceder 200 caracteres.'],
      required: false // Motivo é opcional
    },
    // Considerações Futuras foram mantidas como comentários no código JS original
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices Compostos ---
// Otimiza a consulta principal: buscar bloqueios de um prestador que se sobrepõem a um intervalo de tempo.
BloqueioAgendaSchema.index({ prestadorId: 1, dataInicio: 1, dataFim: 1 });
// Índices individuais em dataInicio e dataFim podem ser úteis também, dependendo das queries
// BloqueioAgendaSchema.index({ prestadorId: 1, dataInicio: -1 });
// BloqueioAgendaSchema.index({ prestadorId: 1, dataFim: 1 });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'BloqueioAgenda' tipado com IBloqueioAgenda
const BloqueioAgenda = mongoose.model<IBloqueioAgenda>('BloqueioAgenda', BloqueioAgendaSchema);

export default BloqueioAgenda;