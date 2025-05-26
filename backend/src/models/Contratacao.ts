// Modelo de Contratação - Define a estrutura e comportamento das contratações de serviços

import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { IOfertaServico } from './OfertaServico';
// Importar a interface de Pagamento se/quando descomentar pagamentoId
// import { IPagamento } from './Pagamento';

// --- Enums e Interfaces ---

// Enumeração dos possíveis estados de uma contratação no sistema
export enum ContratacaoStatusEnum {
  PENDENTE = 'Pendente', // Estado inicial: aguardando confirmação do prestador
  ACEITA = 'Aceita', // Contratação confirmada pelo prestador, aguardando início
  EM_ANDAMENTO = 'Em andamento', // Serviço em execução
  CONCLUIDO = 'Concluído', // Serviço finalizado com sucesso pelo prestador
  CANCELADO_BUYER = 'Cancelado pelo Comprador', // Cancelamento solicitado pelo comprador
  CANCELADO_PRESTADOR = 'Cancelado pelo Prestador', // Cancelamento solicitado pelo prestador
  DISPUTA = 'Disputa' // Situação de conflito entre as partes
  // Novos estados podem ser adicionados conforme a evolução do sistema
}

// Interface principal que define a estrutura de um documento Contratacao
export interface IContratacao extends Document {
  buyerId: Types.ObjectId | IUser; // ID do comprador que pode ser populado com dados completos
  prestadorId: Types.ObjectId | IUser; // ID do prestador que pode ser populado com dados completos
  ofertaId: Types.ObjectId | IOfertaServico; // ID da oferta que pode ser populado com dados completos
  status: ContratacaoStatusEnum;
  dataInicioServico?: Date; // Data opcional de início do serviço
  dataFimServico?: Date; // Data opcional de término do serviço
  valorTotal: number;
  // pagamentoId?: Types.ObjectId | IPagamento; // ID opcional do pagamento associado
  // Campos de data adicionados automaticamente pelo Mongoose
  createdAt: Date; // Data da criação da contratação
  updatedAt: Date; // Data da última atualização da contratação
}

// --- Função de Validação de Datas ---

// NOTA: A validação no schema é mais eficiente quando as datas são definidas em conjunto.
// É recomendável implementar validações adicionais na camada de serviço/controller.
function validateDataFim(this: HydratedDocument<IContratacao>, value: Date | null | undefined): boolean {
  // Verifica se a data de fim é posterior ou igual à data de início
  // O parâmetro 'this' representa o documento atual sendo validado
  if (value && this.dataInicioServico) {
    return value >= this.dataInicioServico;
  }
  return true; // Validação passa se a data de fim ou a data de início não estiverem definidas
}

// --- Definição do Schema Mongoose ---

// Define a estrutura do documento no MongoDB usando a interface IContratacao
const ContratacaoSchema: Schema<IContratacao> = new Schema(
  {
    // --- Relacionamentos Principais (Referências a outros documentos) ---
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

    // --- Status e Datas do Serviço ---
    status: {
      type: String,
      enum: {
        values: Object.values(ContratacaoStatusEnum), // Utiliza os valores definidos no enum
        message: 'Status de contratação inválido: {VALUE}.'
      },
      default: ContratacaoStatusEnum.PENDENTE, // Status inicial padrão
      required: true,
      index: true
    },
    // O campo createdAt dos timestamps registra a data da contratação
    dataInicioServico: {
      type: Date,
      required: false
    },
    dataFimServico: {
      type: Date,
      required: false,
      validate: [validateDataFim, 'A data de término do serviço deve ser igual ou posterior à data de início.']
    },

    // --- Valores e Informações de Pagamento ---
    valorTotal: {
      type: Number,
      required: [true, 'O valor total da contratação é obrigatório.'],
      min: [0, 'O valor total não pode ser negativo.']
    },
    // pagamentoId: { type: Schema.Types.ObjectId, ref: 'Pagamento', required: false, index: true },

    // --- Avaliações ---
    // As avaliações são gerenciadas pelo modelo Avaliacao.ts que referencia esta contratação

  },
  {
    timestamps: true // Adiciona campos automáticos de createdAt e updatedAt
  }
);

// --- Índices Compostos para Otimização de Consultas ---
// Índice para buscar contratações de um comprador por status
ContratacaoSchema.index({ buyerId: 1, status: 1 });
// Índice para buscar contratações de um prestador por status
ContratacaoSchema.index({ prestadorId: 1, status: 1 });
// Índice para buscar contratações de uma oferta por status
ContratacaoSchema.index({ ofertaId: 1, status: 1 });
// Índice para verificar disponibilidade de um prestador em determinado período
ContratacaoSchema.index({ prestadorId: 1, dataInicioServico: 1, dataFimServico: 1 });

// --- Criação e Exportação do Modelo ---
// Cria o modelo 'Contratacao' no MongoDB com a estrutura definida
const Contratacao = mongoose.model<IContratacao>('Contratacao', ContratacaoSchema);

// Exporta o modelo para uso em outros arquivos
export default Contratacao;
