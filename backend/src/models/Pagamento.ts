// Arquivo: models/Pagamento.ts - Modelo de dados para gerenciamento de pagamentos

import mongoose, { Schema, Document, Model, Types, HydratedDocument, Mixed } from 'mongoose';
// Importa a interface da Contratacao para estabelecer relacionamento entre modelos
import { IContratacao } from './Contratacao';

// --- Enums e Interfaces ---

// Enum que define os possíveis estados de um pagamento no sistema
export enum PagamentoStatusEnum {
  CRIADO = 'criado',
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  RECUSADO = 'recusado',
  REEMBOLSADO = 'reembolsado',
  CHARGEBACK = 'chargeback',
  ERRO = 'erro'
}

// Enum que define os métodos de pagamento disponíveis na plataforma
export enum PagamentoMetodoEnum {
  CARTAO_CREDITO = 'cartao_credito',
  CARTAO_DEBITO = 'cartao_debito',
  BOLETO = 'boleto',
  PIX = 'pix',
  TRANSFERENCIA = 'transferencia'
}

// Interface que define a estrutura do subdocumento para registrar o histórico de mudanças de status
export interface IHistoricoStatusPagamento extends Types.Subdocument {
  _id: Types.ObjectId;
  status: PagamentoStatusEnum;
  timestamp: Date;
  motivo?: string;
  metadata?: Mixed; // Para armazenar dados adicionais da integração financeira
}

// Interface para criação de novos registros de histórico de status sem as propriedades do Mongoose
export interface IHistoricoStatusPagamentoInput {
  status: PagamentoStatusEnum;
  timestamp: Date;
  motivo?: string;
  metadata?: Mixed; // Para armazenar dados adicionais da integração financeira
}

// Interface principal que define a estrutura completa de um documento de Pagamento
export interface IPagamento extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Referência à contratação relacionada
  valor: number;
  metodo: PagamentoMetodoEnum;
  historicoStatus: Types.DocumentArray<IHistoricoStatusPagamento>; // Coleção de registros de mudanças de status
  transacaoId?: string; // Identificador da transação no sistema financeiro
  // Campos de data automáticos
  createdAt: Date;
  updatedAt: Date;
  // Campos virtuais calculados
  statusAtual?: PagamentoStatusEnum;
}

// --- Schemas Mongoose ---

// Definição do esquema para o histórico de status de pagamento
const HistoricoStatusPagamentoSchema: Schema<IHistoricoStatusPagamento> = new Schema({
  status: {
    type: String,
    enum: Object.values(PagamentoStatusEnum), // Utiliza os valores definidos no enum TypeScript
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
    type: Schema.Types.Mixed, // Campo flexível para armazenar qualquer estrutura de dados JSON
    required: false
  }
}, { _id: true });

// Esquema principal do Mongoose para o modelo de Pagamento
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
      type: [HistoricoStatusPagamentoSchema], // Coleção de registros de histórico usando o esquema definido
      required: true,
      validate: [ // Validação para garantir que exista pelo menos um registro de status
        (arr: IHistoricoStatusPagamento[]) => Array.isArray(arr) && arr.length > 0,
        'O histórico de status deve conter pelo menos o status inicial.'
      ]
    },
    transacaoId: { // Identificador único da transação no sistema financeiro
      type: String,
      index: true,
      unique: true,
      sparse: true, // Configuração que permite documentos sem este campo sem violar a unicidade
      required: false // Campo opcional que só é preenchido após integração com sistema financeiro
    },
  },
  {
    timestamps: true // Habilita campos automáticos de controle de data de criação e atualização
  }
);

// --- Campo Virtual para Status Atual ---
PagamentoSchema.virtual('statusAtual').get(function(this: HydratedDocument<IPagamento>): PagamentoStatusEnum | undefined {
  // Definição de tipos para o contexto e retorno da função
  // Método que calcula o status atual com base no histórico
  if (this.historicoStatus && this.historicoStatus.length > 0) {
    // Retorna o status do registro mais recente do histórico
    return this.historicoStatus[this.historicoStatus.length - 1].status;
  }
  return undefined; // Retorna undefined quando não há registros no histórico
});

// --- Configuração para incluir campos virtuais nas conversões para JSON e Object ---
PagamentoSchema.set('toJSON', { virtuals: true });
PagamentoSchema.set('toObject', { virtuals: true });

// --- Exportação do Modelo ---
// Criação e exportação do modelo Mongoose com tipagem TypeScript
const Pagamento = mongoose.model<IPagamento>('Pagamento', PagamentoSchema);

export default Pagamento;
