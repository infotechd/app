// models/Contratacao.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { IOfertaServico } from './OfertaServico';
// Importar a interface de Pagamento se/quando descomentar pagamentoId
// import { IPagamento } from './Pagamento';

// --- Enums e Interfaces ---

// Enum para os status da contratação
export enum ContratacaoStatusEnum {
  PENDENTE = 'Pendente', // Aguardando aceite do prestador?
  ACEITA = 'Aceita', // Prestador aceitou
  EM_ANDAMENTO = 'Em andamento', // Serviço iniciado
  CONCLUIDO = 'Concluído', // Serviço finalizado pelo prestador
  CANCELADO_BUYER = 'Cancelado pelo Comprador', // Cancelado antes ou durante
  CANCELADO_PRESTADOR = 'Cancelado pelo Prestador', // Cancelado antes ou durante
  DISPUTA = 'Disputa' // Há um problema/desacordo
  // Adicionar mais status conforme a lógica de negócio evoluir
}

// Interface principal que define a estrutura de um documento Contratacao
export interface IContratacao extends Document {
  buyerId: Types.ObjectId | IUser; // Pode ser populado
  prestadorId: Types.ObjectId | IUser; // Pode ser populado
  ofertaId: Types.ObjectId | IOfertaServico; // Pode ser populado
  status: ContratacaoStatusEnum;
  dataInicioServico?: Date; // Opcional
  dataFimServico?: Date; // Opcional
  valorTotal: number;
  // pagamentoId?: Types.ObjectId | IPagamento; // Opcional
  // Timestamps (adicionados pelo Mongoose)
  createdAt: Date; // Data da contratação
  updatedAt: Date;
}

// --- Função de Validação (Tipada) ---

// NOTA: Validação no schema funciona melhor se datas são definidas juntas.
// Considere reforçar na camada de serviço/controller.
function validateDataFim(this: HydratedDocument<IContratacao>, value: Date | null | undefined): boolean {
  // Permite que dataFim seja null/undefined, mas se for definida, deve ser >= dataInicioServico
  // 'this' aqui é o documento sendo validado, tipado como HydratedDocument<IContratacao>
  if (value && this.dataInicioServico) {
    return value >= this.dataInicioServico;
  }
  return true; // Passa se dataFim ou dataInicioServico não estiverem definidas
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IContratacao para tipagem
const ContratacaoSchema: Schema<IContratacao> = new Schema(
  {
    // --- Relacionamentos Principais ---
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ofertaId: {
      type: Schema.Types.ObjectId,
      ref: 'OfertaServico',
      required: true,
      index: true
    },

    // --- Status e Datas ---
    status: {
      type: String,
      enum: {
        values: Object.values(ContratacaoStatusEnum), // Usa valores do Enum TS
        message: 'Status de contratação inválido: {VALUE}.'
      },
      default: ContratacaoStatusEnum.PENDENTE, // Ajustar default conforme regra
      required: true,
      index: true
    },
    // createdAt dos timestamps representa a data da contratação
    dataInicioServico: {
      type: Date,
      required: false
    },
    dataFimServico: {
      type: Date,
      required: false,
      validate: [validateDataFim, 'A data de término do serviço deve ser igual ou posterior à data de início.']
    },

    // --- Valores e Pagamento ---
    valorTotal: {
      type: Number,
      required: [true, 'O valor total da contratação é obrigatório.'],
      min: [0, 'O valor total não pode ser negativo.']
    },
    // pagamentoId: { type: Schema.Types.ObjectId, ref: 'Pagamento', required: false, index: true },

    // --- Avaliações ---
    // Removidas - gerenciadas pelo modelo Avaliacao.ts que referencia esta contratação

  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices Compostos ---
ContratacaoSchema.index({ buyerId: 1, status: 1 });
ContratacaoSchema.index({ prestadorId: 1, status: 1 });
ContratacaoSchema.index({ ofertaId: 1, status: 1 });
ContratacaoSchema.index({ prestadorId: 1, dataInicioServico: 1, dataFimServico: 1 });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Contratacao' tipado com IContratacao
const Contratacao = mongoose.model<IContratacao>('Contratacao', ContratacaoSchema);

export default Contratacao;