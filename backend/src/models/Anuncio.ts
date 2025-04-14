// models/Anuncio.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface e o enum do usuário para referenciação e validação
import { IUser, TipoUsuarioEnum } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Regex básica para validação de URL (simplificada)
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Enum para os status do Anúncio
export enum AnuncioStatusEnum {
  RASCUNHO = 'rascunho',
  PENDENTE_APROVACAO = 'pendente_aprovacao',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  PAUSADO = 'pausado',
  ENCERRADO = 'encerrado'
}

// Enum para os tipos de Anúncio (exemplo)
export enum AnuncioTipoEnum {
  BANNER_TOPO = 'banner_topo',
  CARD_FEED = 'card_feed',
  POPUP = 'popup',
  OUTRO = 'outro'
}

// Tipos de usuário válidos para segmentação (baseado no Enum do User)
// Excluindo 'admin' da segmentação, se fizer sentido
const tiposUsuarioSegmentacaoValidos = [
  TipoUsuarioEnum.COMPRADOR,
  TipoUsuarioEnum.PRESTADOR,
  TipoUsuarioEnum.ANUNCIANTE
];

// Interface para o objeto de Segmentação
interface ISegmentacao {
  regioes?: string[];
  tiposUsuario?: TipoUsuarioEnum[];
  // interesses?: string[]; // Exemplo futuro
}

// Interface principal que define a estrutura de um documento Anuncio
export interface IAnuncio extends Document {
  anuncianteId: Types.ObjectId | IUser; // Pode ser populado
  titulo: string;
  conteudo: string;
  imagens?: string[];
  link?: string;
  status: AnuncioStatusEnum;
  motivoRejeicao?: string;
  tipoAnuncio?: AnuncioTipoEnum;
  dataInicioExibicao?: Date;
  dataFimExibicao?: Date;
  segmentacao?: ISegmentacao;
  rejeicaoMotivo?: string;  // Adiciona o campo opcional para o motivo
  // estatisticas?: { visualizacoes?: number; cliques?: number }; // Considerar coleção separada
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// --- Função de Validação de Data (Tipada) ---
function validarDataFimExibicao(this: HydratedDocument<IAnuncio>, value: Date | null | undefined): boolean {
  return !this.dataInicioExibicao || !value || value >= this.dataInicioExibicao;
}


// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IAnuncio para tipagem
const AnuncioSchema: Schema<IAnuncio> = new Schema(
  {
    anuncianteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do anunciante é obrigatório.'],
      index: true
    },
    titulo: {
      type: String,
      required: [true, 'O título do anúncio é obrigatório.'],
      trim: true,
      maxlength: [100, 'O título não pode exceder 100 caracteres.']
    },
    conteudo: {
      type: String,
      required: [true, 'O conteúdo do anúncio é obrigatório.'],
      trim: true,
      maxlength: [1000, 'O conteúdo não pode exceder 1000 caracteres.']
    },
    imagens: {
      type: [String],
      default: [],
      required: false
    },
    link: {
      type: String,
      trim: true,
      match: [urlRegex, 'Por favor, insira uma URL válida para o link.'],
      required: false
    },
    status: {
      type: String,
      enum: {
        values: Object.values(AnuncioStatusEnum),
        message: 'Status inválido: {VALUE}.'
      },
      default: AnuncioStatusEnum.RASCUNHO,
      required: true,
      index: true
    },
    motivoRejeicao: {
      type: String,
      trim: true,
      maxlength: 500,
      required: false
    },
    tipoAnuncio: {
      type: String,
      enum: {
        values: Object.values(AnuncioTipoEnum),
        message: 'Tipo de anúncio inválido: {VALUE}.'
      },
      required: false
    },
    // --- Agendamento ---
    dataInicioExibicao: {
      type: Date,
      index: true,
      required: false
    },
    dataFimExibicao: {
      type: Date,
      index: true,
      required: false,
      validate: [validarDataFimExibicao, 'A data de fim da exibição deve ser igual ou posterior à data de início.']
    },
    // --- Segmentação ---
    segmentacao: { // Objeto opcional
      type: { // Tipo Mongoose explícito
        regioes: {
          type: [String],
          default: undefined, // Não cria array vazio por default
          required: false
        },
        tiposUsuario: {
          type: [String], // Armazena como string, mas valida com Enum TS
          enum: {
            values: tiposUsuarioSegmentacaoValidos,
            message: 'Tipo de usuário inválido na segmentação: {VALUE}.'
          },
          default: undefined,
          required: false
        }
        // interesses: { type: [String], default: undefined, required: false }
      },
      required: false, // O objeto segmentacao como um todo é opcional
      default: undefined
    }
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices Adicionais ---
AnuncioSchema.index({ status: 1, dataInicioExibicao: 1, dataFimExibicao: 1 });
AnuncioSchema.index({ status: 1, 'segmentacao.tiposUsuario': 1 });
AnuncioSchema.index({ status: 1, 'segmentacao.regioes': 1 });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Anuncio' tipado com IAnuncio
const Anuncio = mongoose.model<IAnuncio>('Anuncio', AnuncioSchema);

export default Anuncio;