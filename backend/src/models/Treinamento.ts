// models/Treinamento.ts

/**
 * Modelo Treinamento
 * Representa um conteúdo educacional (curso, vídeo, PDF, webinar, etc.)
 * criado e gerenciado por um Anunciante.
 * Este arquivo define a estrutura de dados para armazenamento de treinamentos no MongoDB.
 */
import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface do usuário para permitir a referência ao anunciante
import { IUser } from './User';

// --- Enums e Interfaces ---

// Expressão regular para validação de URLs
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Enumeração que define os diferentes formatos disponíveis para os treinamentos
export enum TreinamentoFormatoEnum {
  VIDEO = 'video',                   // Conteúdo em formato de vídeo
  PDF = 'pdf',                       // Documento em formato PDF
  WEBINAR = 'webinar',               // Apresentação ao vivo ou gravada
  ARTIGO = 'artigo',                 // Conteúdo em formato de texto
  CURSO_INTERATIVO = 'curso_interativo', // Curso com elementos interativos
  LINK_EXTERNO = 'link_externo'      // Link para conteúdo hospedado externamente
}

// Enumeração que define os possíveis estados de um treinamento no sistema
export enum TreinamentoStatusEnum {
  RASCUNHO = 'rascunho',             // Treinamento em criação, não finalizado
  PENDENTE_REVISAO = 'pendente_revisao', // Aguardando aprovação do administrador
  PUBLICADO = 'publicado',           // Disponível para visualização e inscrição
  REJEITADO = 'rejeitado',           // Não aprovado pelo administrador
  ARQUIVADO = 'arquivado'            // Removido da listagem principal
}

// Interface principal que define a estrutura completa de um documento Treinamento no MongoDB
export interface ITreinamento extends Document {
  anuncianteId: Types.ObjectId | IUser; // Referência ao usuário que criou o treinamento
  titulo: string;                     // Título do treinamento
  descricao: string;                  // Descrição detalhada do conteúdo
  formato: TreinamentoFormatoEnum;    // Formato do treinamento conforme enumeração
  conteudoUrl: string;                // URL para acessar o conteúdo do treinamento
  dataHora?: Date;                    // Data e hora do treinamento (obrigatório para webinars)
  preco: number;                      // Valor do treinamento (0 para gratuito)
  status: TreinamentoStatusEnum;      // Status atual do treinamento
  motivoRejeicao?: string;            // Motivo caso o treinamento seja rejeitado
  // Campos adicionais que podem ser implementados futuramente
  // categoria?: string;              // Categoria do treinamento
  // nivelDificuldade?: string;       // Nível de dificuldade do conteúdo
  // duracaoEstimadaMinutos?: number; // Duração estimada em minutos
  // imagemCapaUrl?: string;          // URL da imagem de capa
  // Campos de controle temporal
  createdAt: Date;                    // Data de criação do registro
  updatedAt: Date;                    // Data da última atualização
}

// --- Função de Validação de Data ---
// Função que verifica se a data e hora foram fornecidas quando o formato é webinar
function validarDataHoraWebinar(this: HydratedDocument<ITreinamento>, value: Date | null | undefined): boolean {
  if (this.formato === TreinamentoFormatoEnum.WEBINAR) {
    return !!value; // Retorna falso se o valor for nulo ou indefinido para webinars
  }
  return true; // Para outros formatos, a data/hora não é obrigatória
}

// --- Schema Mongoose ---

// Define a estrutura do documento no MongoDB, com validações e configurações
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
      required: false, // Campo opcional com validação condicional
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
      required: false // Campo obrigatório apenas quando o status é 'rejeitado'
    },
    // categoria: { type: String, index: true, required: false },
    // nivelDificuldade: { type: String, enum: ['iniciante', 'intermediario', 'avancado'], required: false },
    // duracaoEstimadaMinutos: { type: Number, min: 1, required: false },
    // imagemCapaUrl: { type: String, trim: true, match: [urlRegex, 'URL da imagem de capa inválida.'], required: false },
  },
  {
    timestamps: true // Adiciona campos automáticos de data de criação e atualização
  }
);

// --- Índices Adicionais ---
// Comentado abaixo está um exemplo de índice de texto que pode ser ativado para permitir buscas textuais
// TreinamentoSchema.index({ titulo: 'text', descricao: 'text' }); // Habilita busca por texto nos campos título e descrição

// --- Relacionamento com Inscrições ---
// O modelo 'InscricaoTreinamento.ts' complementa este modelo
// e é responsável por armazenar as inscrições dos usuários e seu progresso nos treinamentos

// --- Criação e Exportação do Modelo ---
// Cria o modelo no MongoDB com nome 'Treinamento' e exporta para uso em outros arquivos
const Treinamento = mongoose.model<ITreinamento>('Treinamento', TreinamentoSchema);

export default Treinamento;
