// models/Treinamento.ts (Backend - Convertido para TypeScript)

/**
 * Modelo Treinamento (Revisado)
 * Representa um conteúdo educacional (curso, vídeo, PDF, webinar, etc.)
 * criado e gerenciado por um Anunciante.
 */
import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Regex básica para validação de URL (simplificada)
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Enum para os formatos de treinamento
export enum TreinamentoFormatoEnum {
  VIDEO = 'video',
  PDF = 'pdf',
  WEBINAR = 'webinar',
  ARTIGO = 'artigo',
  CURSO_INTERATIVO = 'curso_interativo',
  LINK_EXTERNO = 'link_externo'
}

// Enum para os status do treinamento
export enum TreinamentoStatusEnum {
  RASCUNHO = 'rascunho',
  PENDENTE_REVISAO = 'pendente_revisao',
  PUBLICADO = 'publicado',
  REJEITADO = 'rejeitado',
  ARQUIVADO = 'arquivado'
}

// Interface principal que define a estrutura de um documento Treinamento
export interface ITreinamento extends Document {
  anuncianteId: Types.ObjectId | IUser; // Pode ser populado
  titulo: string;
  descricao: string;
  formato: TreinamentoFormatoEnum;
  conteudoUrl: string;
  dataHora?: Date; // Opcional, mas obrigatório para webinars
  preco: number;
  status: TreinamentoStatusEnum;
  motivoRejeicao?: string; // Opcional
  // Campos adicionais úteis (tipados se adicionados)
  // categoria?: string;
  // nivelDificuldade?: string;
  // duracaoEstimadaMinutos?: number;
  // imagemCapaUrl?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// --- Função de Validação de Data (Tipada) ---
// NOTA: Validações complexas podem ser melhor tratadas na camada de serviço.
function validarDataHoraWebinar(this: HydratedDocument<ITreinamento>, value: Date | null | undefined): boolean {
  if (this.formato === TreinamentoFormatoEnum.WEBINAR) {
    return !!value; // Se for webinar, dataHora não pode ser nulo/undefined
  }
  return true; // Não obrigatório para outros formatos
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface ITreinamento para tipagem
const TreinamentoSchema: Schema<ITreinamento> = new Schema(
  {
    anuncianteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do anunciante é obrigatório.'],
      index: true
    },
    titulo: {
      type: String,
      required: [true, 'O título do treinamento é obrigatório.'],
      trim: true,
      maxlength: [150, 'O título não pode exceder 150 caracteres.']
    },
    descricao: {
      type: String,
      required: [true, 'A descrição do treinamento é obrigatória.'],
      trim: true,
      maxlength: [2000, 'A descrição não pode exceder 2000 caracteres.']
    },
    formato: {
      type: String,
      enum: {
        values: Object.values(TreinamentoFormatoEnum),
        message: 'Formato inválido: {VALUE}.'
      },
      required: [true, 'O formato do treinamento é obrigatório.'],
      index: true
    },
    conteudoUrl: {
      type: String,
      required: [true, 'A URL do conteúdo é obrigatória.'],
      trim: true,
      match: [urlRegex, 'Por favor, insira uma URL válida para o conteúdo.']
    },
    dataHora: {
      type: Date,
      required: false, // Validação condicional aplicada abaixo
      validate: [validarDataHoraWebinar, 'A data e hora são obrigatórias para o formato webinar.']
    },
    preco: {
      type: Number,
      required: [true, 'O preço (ou 0 para gratuito) é obrigatório.'],
      min: [0, 'O preço não pode ser negativo.'],
      default: 0
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TreinamentoStatusEnum),
        message: 'Status inválido: {VALUE}.'
      },
      default: TreinamentoStatusEnum.RASCUNHO,
      required: true,
      index: true
    },
    motivoRejeicao: {
      type: String,
      trim: true,
      maxlength: 500,
      required: false // Apenas se status for 'rejeitado'
    },
    // categoria: { type: String, index: true, required: false },
    // nivelDificuldade: { type: String, enum: ['iniciante', 'intermediario', 'avancado'], required: false },
    // duracaoEstimadaMinutos: { type: Number, min: 1, required: false },
    // imagemCapaUrl: { type: String, trim: true, match: [urlRegex, 'URL da imagem de capa inválida.'], required: false },
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// --- Índices Adicionais ---
// TreinamentoSchema.index({ titulo: 'text', descricao: 'text' }); // Se busca textual for importante

// --- Lembrete sobre Inscrições ---
// Lembre-se que o modelo 'InscricaoTreinamento.ts' é necessário para
// rastrear quem se inscreveu e o progresso.

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'Treinamento' tipado com ITreinamento
const Treinamento = mongoose.model<ITreinamento>('Treinamento', TreinamentoSchema);

export default Treinamento;