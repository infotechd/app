// models/OfertaServico.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os status da oferta
export enum OfertaStatusEnum {
  RASCUNHO = 'rascunho',
  DISPONIVEL = 'disponível',
  PAUSADO = 'pausado',
  ENCERRADO = 'encerrado'
}

// Interface para o subdocumento HorarioDisponivel
interface IHorarioDisponivel {
  inicio: string;
  fim: string;
}

// Interface para o subdocumento RecorrenciaSemanal
interface IRecorrenciaSemanal {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horarios: IHorarioDisponivel[];
}

// Interface para o objeto de Disponibilidade
export interface IDisponibilidade {
  recorrenciaSemanal?: IRecorrenciaSemanal[]; // Tornando opcional ter recorrência
  duracaoMediaMinutos?: number;
  observacoes?: string;
}

// Interface principal que define a estrutura de um documento OfertaServico
export interface IOfertaServico extends Document {
  prestadorId: Types.ObjectId | IUser; // Pode ser populado com IUser
  descricao: string;
  preco: number;
  status: OfertaStatusEnum;
  disponibilidade?: IDisponibilidade; // Objeto de disponibilidade, opcional
  // Timestamps (adicionados pelo Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas Mongoose ---

// Sub-schema Mongoose para HorarioDisponivel
const HorarioDisponivelSchema: Schema<IHorarioDisponivel> = new Schema({
  inicio: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)']
  },
  fim: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)']
  }
}, { _id: false });

// Sub-schema Mongoose para RecorrenciaSemanal
const RecorrenciaSemanalSchema: Schema<IRecorrenciaSemanal> = new Schema({
  diaSemana: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  horarios: { // Array de horários disponíveis para aquele dia
    type: [HorarioDisponivelSchema],
    required: true // Exige que pelo menos um horário seja definido se o dia for incluído
  }
}, { _id: false });

// Schema Mongoose principal para OfertaServico
const OfertaServicoSchema: Schema<IOfertaServico> = new Schema(
  {
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Referência ao modelo User
      required: [true, 'O ID do prestador é obrigatório.'],
      index: true
    },
    descricao: {
      type: String,
      required: [true, 'A descrição do serviço é obrigatória.'],
      trim: true,
      maxlength: [2000, 'A descrição não pode exceder 2000 caracteres.']
    },
    preco: {
      type: Number,
      required: [true, 'O preço do serviço é obrigatório.'],
      min: [0, 'O preço não pode ser negativo.']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(OfertaStatusEnum), // Usa valores do Enum TS
        message: 'Status inválido: {VALUE}.'
      },
      default: OfertaStatusEnum.RASCUNHO,
      required: true, // Status é sempre obrigatório
      index: true // Otimiza busca por status (ex: buscar apenas 'disponível')
    },
    disponibilidade: { // Objeto de disponibilidade (opcional ter esse campo)
      type: { // Tipo Mongoose explícito para o objeto
        recorrenciaSemanal: {
          type: [RecorrenciaSemanalSchema], // Array do sub-schema
          default: undefined // Garante que o array não seja criado vazio por default se disponibilidade não for fornecido
        },
        duracaoMediaMinutos: {
          type: Number,
          min: 1
        },
        observacoes: {
          type: String,
          trim: true,
          maxlength: 500
        }
      },
      required: false // O objeto de disponibilidade como um todo é opcional
    }
    // dataCriacao removida
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt automaticamente
  }
);

// Exporta o modelo 'OfertaServico' tipado
const OfertaServico = mongoose.model<IOfertaServico>('OfertaServico', OfertaServicoSchema);

export default OfertaServico;