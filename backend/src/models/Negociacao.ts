// models/Negociacao.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { IContratacao } from './Contratacao';

// --- Enums e Interfaces ---

// Enum para os tipos de entrada no histórico da negociação
export enum HistoricoNegociacaoTipoEnum {
  PROPOSTA_BUYER = 'proposta_buyer',
  RESPOSTA_PRESTADOR = 'resposta_prestador',
  MENSAGEM_SIMPLES = 'mensagem_simples'
}

// Enum para os status da negociação
export enum NegociacaoStatusEnum {
  INICIADA = 'iniciada',
  AGUARDANDO_PRESTADOR = 'aguardando_prestador',
  AGUARDANDO_BUYER = 'aguardando_buyer',
  ACEITA = 'aceita',
  REJEITADA = 'rejeitada',
  CANCELADA = 'cancelada'
}

// Interface para os dados dentro de um item do histórico
interface IHistoricoItemDados {
  novoPreco?: number;
  novoPrazo?: Date;
  observacoes: string; // Observações são sempre obrigatórias
}

// Interface para o subdocumento HistoricoItem
interface IHistoricoItem extends Types.Subdocument { // Estende Subdocument para ter _id se necessário
  _id: Types.ObjectId; // Garante que _id está presente se { _id: true }
  autorId: Types.ObjectId | IUser; // Pode ser populado
  tipo: HistoricoNegociacaoTipoEnum;
  dados: IHistoricoItemDados;
  timestamp: Date;
}

// Interface para o objeto opcional de termos finais
interface ITermosFinais {
  precoFinal?: number;
  prazoFinal?: Date;
}

// Interface principal que define a estrutura de um documento Negociacao
export interface INegociacao extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Pode ser populado
  buyerId: Types.ObjectId | IUser; // Pode ser populado
  prestadorId: Types.ObjectId | IUser; // Pode ser populado
  historico: Types.DocumentArray<IHistoricoItem>; // Array de subdocumentos tipado
  status: NegociacaoStatusEnum;
  termosFinais?: ITermosFinais;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas Mongoose ---

// Sub-schema Mongoose para HistoricoItem, tipado com IHistoricoItem
// Nota: Não usamos Schema<IHistoricoItem> diretamente aqui porque IHistoricoItem já estende Subdocument
const HistoricoItemSchema: Schema = new Schema({
  autorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: Object.values(HistoricoNegociacaoTipoEnum),
    required: true
  },
  dados: {
    type: { // Tipo explícito para o objeto embutido
      novoPreco: {
        type: Number,
        min: [0, 'O preço proposto não pode ser negativo.'],
        required: false // Preço é opcional na proposta/resposta
      },
      novoPrazo: {
        type: Date,
        required: false // Prazo é opcional na proposta/resposta
      },
      observacoes: {
        type: String,
        required: [true, 'Observações são obrigatórias em cada etapa da negociação.'],
        trim: true,
        maxlength: 1000
      }
    },
    required: true // O objeto 'dados' como um todo é obrigatório
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true }); // Mantém _id para cada item do histórico

// Schema Mongoose principal para Negociacao, tipado com INegociacao
const NegociacaoSchema: Schema<INegociacao> = new Schema(
  {
    contratacaoId: {
      type: Schema.Types.ObjectId,
      ref: 'Contratacao',
      required: true,
      index: true
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    prestadorId: { // Nome padronizado
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    historico: { // Array do sub-schema HistoricoItemSchema
      type: [HistoricoItemSchema],
      required: true, // Garante que o array não pode ser nulo/undefined
      validate: [ // Garante que o array tenha pelo menos um item (proposta inicial)
        (arr: IHistoricoItem[]) => Array.isArray(arr) && arr.length > 0,
        'A negociação deve conter pelo menos a proposta inicial.'
      ]
    },
    status: {
      type: String,
      enum: Object.values(NegociacaoStatusEnum),
      default: NegociacaoStatusEnum.INICIADA, // Default para 'iniciada'
      required: true,
      index: true
    },
    termosFinais: { // Objeto opcional
      type: {
        precoFinal: { type: Number, required: false },
        prazoFinal: { type: Date, required: false }
      },
      required: false,
      default: undefined // Garante que não seja criado um objeto vazio por default
    }
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices Compostos ---
NegociacaoSchema.index({ prestadorId: 1, status: 1 }); // Negociações de um prestador por status
NegociacaoSchema.index({ buyerId: 1, status: 1 });     // Negociações de um comprador por status

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Negociacao' tipado com INegociacao
const Negociacao = mongoose.model<INegociacao>('Negociacao', NegociacaoSchema);

export default Negociacao;