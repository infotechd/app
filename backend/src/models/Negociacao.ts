// Arquivo: models/Negociacao.ts - Modelo de dados para negociações entre compradores e prestadores de serviço

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos relacionados
import { IUser } from './User';
import { IContratacao } from './Contratacao';

// --- Enums e Interfaces ---

// Enum que define os tipos possíveis de entradas no histórico da negociação
export enum HistoricoNegociacaoTipoEnum {
  PROPOSTA_BUYER = 'proposta_buyer',
  RESPOSTA_PRESTADOR = 'resposta_prestador',
  MENSAGEM_SIMPLES = 'mensagem_simples'
}

// Enum que define os possíveis estados de uma negociação
export enum NegociacaoStatusEnum {
  INICIADA = 'iniciada',                      // Negociação recém-criada
  AGUARDANDO_PRESTADOR = 'aguardando_prestador', // Aguardando resposta do prestador de serviço
  AGUARDANDO_BUYER = 'aguardando_buyer',      // Aguardando resposta do comprador
  ACEITA = 'aceita',                          // Negociação aceita por ambas as partes
  REJEITADA = 'rejeitada',                    // Negociação rejeitada por uma das partes
  CANCELADA = 'cancelada'                     // Negociação cancelada após ter sido iniciada
}

// Interface que define a estrutura dos dados contidos em cada item do histórico
interface IHistoricoItemDados {
  novoPreco?: number;                         // Valor proposto na negociação (opcional)
  novoPrazo?: Date;                           // Data de entrega proposta (opcional)
  observacoes: string;                        // Comentários sobre a proposta (obrigatório)
}

// Interface que define a estrutura de cada item no histórico da negociação
interface IHistoricoItem extends Types.Subdocument { 
  _id: Types.ObjectId;                        // Identificador único do item do histórico
  autorId: Types.ObjectId | IUser;            // Referência ao usuário que criou o item
  tipo: HistoricoNegociacaoTipoEnum;          // Tipo do item (proposta, resposta ou mensagem)
  dados: IHistoricoItemDados;                 // Dados específicos do item
  timestamp: Date;                            // Data e hora de criação do item
}

// Interface que define a estrutura dos termos finais acordados na negociação
interface ITermosFinais {
  precoFinal?: number;                        // Valor final acordado (opcional)
  prazoFinal?: Date;                          // Data de entrega final acordada (opcional)
}

// Interface principal que define a estrutura completa do documento de Negociação no MongoDB
export interface INegociacao extends Document {
  contratacaoId: Types.ObjectId | IContratacao; // Referência à contratação relacionada a esta negociação
  buyerId: Types.ObjectId | IUser;              // Referência ao usuário comprador
  prestadorId: Types.ObjectId | IUser;          // Referência ao usuário prestador de serviço
  historico: Types.DocumentArray<IHistoricoItem>; // Coleção de itens do histórico da negociação
  status: NegociacaoStatusEnum;                 // Status atual da negociação
  termosFinais?: ITermosFinais;                 // Termos finais acordados (quando a negociação é aceita)
  // Campos de controle temporal
  createdAt: Date;                              // Data de criação do registro
  updatedAt: Date;                              // Data da última atualização
}

// --- Schemas Mongoose ---

// Definição do sub-schema para os itens do histórico da negociação
// Este schema é usado como parte do schema principal de Negociacao
const HistoricoItemSchema: Schema = new Schema({
  autorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true                              // Campo obrigatório
  },
  tipo: {
    type: String,
    enum: Object.values(HistoricoNegociacaoTipoEnum),
    required: true                              // Campo obrigatório
  },
  dados: {
    type: {                                     // Definição do objeto de dados da proposta
      novoPreco: {
        type: Number,
        min: [0, 'O preço proposto não pode ser negativo.'],
        required: false                         // Preço é opcional na proposta/resposta
      },
      novoPrazo: {
        type: Date,
        required: false                         // Prazo é opcional na proposta/resposta
      },
      observacoes: {
        type: String,
        required: [true, 'Observações são obrigatórias em cada etapa da negociação.'],
        trim: true,                             // Remove espaços em branco no início e fim
        maxlength: 1000                         // Limita o tamanho do texto
      }
    },
    required: true                              // O objeto 'dados' como um todo é obrigatório
  },
  timestamp: {
    type: Date,
    default: Date.now                           // Data automática de criação do registro
  }
}, { _id: true });                              // Garante que cada item do histórico tenha um ID único

// Definição do schema principal do modelo de Negociação
const NegociacaoSchema: Schema<INegociacao> = new Schema(
  {
    contratacaoId: {
      type: Schema.Types.ObjectId,
      ref: 'Contratacao',                       // Referência ao modelo de Contratação
      required: true,                           // Campo obrigatório
      index: true                               // Indexado para melhorar performance de consultas
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',                              // Referência ao modelo de Usuário (comprador)
      required: true,                           // Campo obrigatório
      index: true                               // Indexado para melhorar performance de consultas
    },
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',                              // Referência ao modelo de Usuário (prestador)
      required: true,                           // Campo obrigatório
      index: true                               // Indexado para melhorar performance de consultas
    },
    historico: {
      type: [HistoricoItemSchema],              // Array de itens do histórico usando o sub-schema
      required: true,                           // Campo obrigatório
      validate: [                               // Validação customizada
        (arr: IHistoricoItem[]) => Array.isArray(arr) && arr.length > 0,
        'A negociação deve conter pelo menos a proposta inicial.'
      ]
    },
    status: {
      type: String,
      enum: Object.values(NegociacaoStatusEnum), // Valores permitidos definidos no enum
      default: NegociacaoStatusEnum.INICIADA,    // Valor padrão ao criar um novo registro
      required: true,                           // Campo obrigatório
      index: true                               // Indexado para melhorar performance de consultas
    },
    termosFinais: {
      type: {
        precoFinal: { type: Number, required: false }, // Valor final acordado
        prazoFinal: { type: Date, required: false }    // Data final acordada
      },
      required: false,                          // Campo opcional
      default: undefined                        // Sem valor padrão
    }
  },
  {
    timestamps: true                            // Adiciona campos automáticos de data de criação e atualização
  }
);

// --- Índices Compostos ---
// Criação de índices compostos para otimizar consultas frequentes
NegociacaoSchema.index({ prestadorId: 1, status: 1 }); // Índice para buscar negociações de um prestador filtradas por status
NegociacaoSchema.index({ buyerId: 1, status: 1 });     // Índice para buscar negociações de um comprador filtradas por status

// --- Exportação do Modelo ---
// Criação do modelo Mongoose a partir do schema definido
const Negociacao = mongoose.model<INegociacao>('Negociacao', NegociacaoSchema);

// Exportação do modelo para uso em outros módulos da aplicação
export default Negociacao;
