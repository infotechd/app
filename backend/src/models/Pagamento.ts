// models/Pagamento.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types, HydratedDocument, Mixed } from 'mongoose';
// Importa a interface da Contratacao para referenciação
import { IContratacao } from './Contratacao'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os status possíveis do pagamento
export enum PagamentoStatusEnum {
  CRIADO = 'criado',
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  REEMBOLSADO = 'reembolsado',
  CHARGEBACK = 'chargeback',
  ERRO = 'erro'
}

// Enum para os métodos de pagamento
export enum PagamentoMetodoEnum {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  PIX = 'pix',
  TRANSFERENCIA = 'transferencia'
}

// Interface para o subdocumento HistoricoStatusPagamento
interface IHistoricoStatusPagamento extends Types.Subdocument {
  _id: Types.ObjectId;
  status: PagamentoStatusEnum;
  timestamp: Date;
  motivo?: string;
  metadata?: Mixed; // Para dados extras da Fintech
}

// Interface principal que define a estrutura de um documento Pagamento
export interface IPagamento extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Pode ser populado
  valor: number;
  metodo: PagamentoMetodoEnum;
  historicoStatus: Types.DocumentArray<IHistoricoStatusPagamento>; // Array tipado de subdocumentos
  transacaoId?: string; // ID da Fintech (opcional)
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Virtuals (declarados para que o TS saiba que existem)
  statusAtual?: PagamentoStatusEnum;
}

// --- Schemas Mongoose ---

// Sub-schema Mongoose para HistoricoStatusPagamento
const HistoricoStatusPagamentoSchema: Schema<IHistoricoStatusPagamento> = new Schema({
  status: {
    type: String,
    enum: Object.values(PagamentoStatusEnum), // Usa valores do Enum TS
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  motivo: {
    type: String,
    trim: true,
    required: false
  },
  metadata: {
    type: Schema.Types.Mixed, // Permite armazenar qualquer estrutura JSON/objeto
    required: false
  }
}, { _id: true });

// Schema Mongoose principal para Pagamento, tipado com IPagamento
const PagamentoSchema: Schema<IPagamento> = new Schema(
  {
    contratacaoId: {
      type: Schema.Types.ObjectId,
      ref: 'Contratacao',
      required: [true, 'A ID da contratação é obrigatória.'],
      index: true
    },
    valor: {
      type: Number,
      required: [true, 'O valor do pagamento é obrigatório.'],
      min: [0.01, 'O valor do pagamento deve ser positivo.']
    },
    metodo: {
      type: String,
      enum: {
        values: Object.values(PagamentoMetodoEnum),
        message: 'Método de pagamento inválido: {VALUE}.'
      },
      required: [true, 'O método de pagamento é obrigatório.']
    },
    historicoStatus: {
      type: [HistoricoStatusPagamentoSchema], // Array do sub-schema
      required: true,
      validate: [ // Garante que o array tenha pelo menos um item (status inicial)
        (arr: IHistoricoStatusPagamento[]) => Array.isArray(arr) && arr.length > 0,
        'O histórico de status deve conter pelo menos o status inicial.'
      ]
    },
    transacaoId: { // ID da Fintech
      type: String,
      index: true,
      unique: true,
      sparse: true, // Permite valores nulos/ausentes sem violar unicidade
      required: false // Só existe após tentativa na Fintech
    },
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Virtual para Status Atual ---
PagamentoSchema.virtual('statusAtual').get(function(this: HydratedDocument<IPagamento>): PagamentoStatusEnum | undefined {
  // Tipagem 'this' como HydratedDocument<IPagamento>
  // Tipagem do retorno como PagamentoStatusEnum | undefined
  if (this.historicoStatus && this.historicoStatus.length > 0) {
    // Retorna o status do último item do histórico (mais recente)
    return this.historicoStatus[this.historicoStatus.length - 1].status;
  }
  return undefined; // Retorna undefined se o histórico estiver vazio
});

// --- Configuração para incluir virtuals em toJSON/toObject ---
PagamentoSchema.set('toJSON', { virtuals: true });
PagamentoSchema.set('toObject', { virtuals: true });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Pagamento' tipado com IPagamento
const Pagamento = mongoose.model<IPagamento>('Pagamento', PagamentoSchema);

export default Pagamento;