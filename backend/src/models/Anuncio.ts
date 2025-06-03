// Modelo de Anúncio para o backend em TypeScript

import mongoose, { Schema, Document, Model, Types, HydratedDocument } from 'mongoose';
// Importa a interface e o enum do usuário para referenciação e validação
import { IUser, TipoUsuarioEnum } from './User';

// --- Enums e Interfaces ---

// Expressão regular para validação de URLs
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

// Enum que define os diferentes formatos de anúncios disponíveis na plataforma
export enum AnuncioTipoEnum {
  BANNER_TOPO = 'banner_topo',
  CARD_FEED = 'card_feed',
  POPUP = 'popup',
  OUTRO = 'outro'
}

// Lista de tipos de usuário que podem ser alvo de segmentação
// Não inclui administradores na segmentação
const tiposUsuarioSegmentacaoValidos = [
  'comprador',
  'prestador',
  'anunciante'
];

// Interface que define a estrutura de segmentação para direcionar anúncios
interface ISegmentacao {
  regioes?: string[];                // Regiões geográficas para segmentação
  tiposUsuario?: string[];           // Tipos de usuário para segmentação ('comprador', 'prestador', 'anunciante')
  // interesses?: string[];          // Possível implementação futura para segmentação por interesses
}

// Interface principal que define a estrutura completa de um documento Anuncio
export interface IAnuncio extends Document {
  anuncianteId: Types.ObjectId | IUser; // Referência ao usuário anunciante, pode ser populado com dados completos
  titulo: string;                        // Título do anúncio
  conteudo: string;                      // Conteúdo/descrição do anúncio
  imagens?: string[];                    // Lista de URLs das imagens do anúncio
  link?: string;                         // Link para redirecionamento
  status: AnuncioStatusEnum;             // Status atual do anúncio
  motivoRejeicao?: string;               // Motivo caso o anúncio seja rejeitado
  tipoAnuncio?: AnuncioTipoEnum;         // Formato/tipo do anúncio
  dataInicioExibicao?: Date;             // Data de início da campanha
  dataFimExibicao?: Date;                // Data de término da campanha
  segmentacao?: ISegmentacao;            // Configurações de segmentação do público-alvo
  rejeicaoMotivo?: string;               // Campo alternativo para motivo de rejeição
  // estatisticas?: { visualizacoes?: number; cliques?: number }; // Futuramente pode ser movido para coleção separada
  // Campos de controle temporal
  createdAt: Date;                       // Data de criação do registro
  updatedAt: Date;                       // Data da última atualização
}

// --- Função de Validação de Data ---
// Verifica se a data de fim de exibição é posterior ou igual à data de início
function validarDataFimExibicao(this: HydratedDocument<IAnuncio>, value: Date | null | undefined): boolean {
  return !this.dataInicioExibicao || !value || value >= this.dataInicioExibicao;
}


// --- Schema Mongoose ---

// Definição do Schema do MongoDB usando a interface IAnuncio para tipagem
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
    // --- Configuração de Período de Exibição ---
    dataInicioExibicao: {
      type: Date,
      index: true,          // Indexado para consultas de performance
      required: false       // Não obrigatório
    },
    dataFimExibicao: {
      type: Date,
      index: true,          // Indexado para consultas de performance
      required: false,      // Não obrigatório
      validate: [validarDataFimExibicao, 'A data de fim da exibição deve ser igual ou posterior à data de início.']
    },
    // --- Configuração de Segmentação ---
    segmentacao: {          // Objeto que define o público-alvo do anúncio
      type: {               // Definição explícita do tipo no Mongoose
        regioes: {
          type: [String],
          default: undefined, // Evita criar um array vazio automaticamente
          required: false     // Campo opcional
        },
        tiposUsuario: {
          type: [String],     // Armazenado como string no banco
          enum: {
            values: tiposUsuarioSegmentacaoValidos,
            message: 'Tipo de usuário inválido na segmentação: {VALUE}.'
          },
          default: undefined, // Evita criar um array vazio automaticamente
          required: false     // Campo opcional
        }
        // interesses: { type: [String], default: undefined, required: false }
      },
      required: false,      // O objeto de segmentação como um todo é opcional
      default: undefined    // Não cria objeto vazio por padrão
    }
  },
  {
    timestamps: true // Adiciona campos automáticos de data de criação e atualização
  }
);

// --- Índices Adicionais para Otimização de Consultas ---
// Índice composto para consultas de anúncios ativos por período
AnuncioSchema.index({ status: 1, dataInicioExibicao: 1, dataFimExibicao: 1 });
// Índice para consultas de anúncios por tipo de usuário na segmentação
AnuncioSchema.index({ status: 1, 'segmentacao.tiposUsuario': 1 });
// Índice para consultas de anúncios por região na segmentação
AnuncioSchema.index({ status: 1, 'segmentacao.regioes': 1 });

// --- Exportação do Modelo ---
// Cria o modelo Mongoose 'Anuncio' com tipagem TypeScript
const Anuncio = mongoose.model<IAnuncio>('Anuncio', AnuncioSchema);

export default Anuncio;
