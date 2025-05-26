// models/PublicacaoComunidade.ts

/**
 * Modelo PublicacaoComunidade
 * Representa publicações na comunidade (posts e eventos) criados por qualquer usuário.
 * Comentários e Likes são gerenciados em coleções separadas para melhor performance.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User';

// --- Enums e Interfaces para tipagem ---

// Enum que define os tipos possíveis de publicação na comunidade
export enum PublicacaoTipoEnum {
  POST = 'post',     // Publicação normal/padrão
  EVENTO = 'evento'  // Publicação de evento com data e local
}

// Enum que define os possíveis estados de moderação de uma publicação
export enum PublicacaoStatusEnum {
  PENDENTE_APROVACAO = 'pendente_aprovacao', // Aguardando aprovação de moderador
  APROVADO = 'aprovado',                     // Visível para todos os usuários
  REJEITADO = 'rejeitado',                   // Reprovado por moderador
  OCULTO_PELO_AUTOR = 'oculto_pelo_autor',   // Ocultado pelo próprio autor
  OCULTO_PELO_ADMIN = 'oculto_pelo_admin',   // Ocultado por administrador
  RASCUNHO = 'rascunho'                      // Salvo como rascunho (não publicado)
}

// Interface principal que define a estrutura de um documento PublicacaoComunidade
export interface IPublicacaoComunidade extends Document {
  autorId: Types.ObjectId | IUser; // Referência ao autor da publicação que pode ser populado
  conteudo: string; // Texto da publicação
  imagens?: string[]; // Lista opcional de URLs das imagens
  tipo: PublicacaoTipoEnum; // Tipo da publicação (post ou evento)
  dataEvento?: Date; // Data do evento (apenas para publicações do tipo evento)
  localEvento?: string; // Local do evento (apenas para publicações do tipo evento)
  contagemLikes: number; // Contador de curtidas na publicação
  contagemComentarios: number; // Contador de comentários na publicação
  status: PublicacaoStatusEnum; // Status de moderação da publicação
  motivoReprovacaoOuOcultacao?: string; // Motivo caso a publicação seja reprovada ou ocultada
  // Campos de data
  createdAt: Date; // Data de criação da publicação
  updatedAt: Date; // Data da última atualização da publicação
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IPublicacaoComunidade para tipagem
const PublicacaoComunidadeSchema: Schema<IPublicacaoComunidade> = new Schema(
  {
    autorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O autor da publicação é obrigatório.'],
      index: true
    },
    conteudo: {
      type: String,
      required: [true, 'O conteúdo é obrigatório.'],
      trim: true,
      minlength: [1, 'O conteúdo não pode estar vazio.'],
      maxlength: [5000, 'O conteúdo não pode exceder 5000 caracteres.']
    },
    imagens: {
      type: [String], // Array de URLs das imagens
      default: [], // Valor padrão é um array vazio
      required: false, // Campo não obrigatório
      validate: [ // Validação para limitar o número de imagens
        (arr: string[]) => !arr || arr.length <= 5,
        'É permitido no máximo 5 imagens por publicação.'
      ]
    },
    tipo: {
      type: String,
      enum: {
        values: Object.values(PublicacaoTipoEnum),
        message: 'Tipo de publicação inválido: {VALUE}.'
      },
      default: PublicacaoTipoEnum.POST,
      required: true,
      index: true
    },
    // --- Campos específicos para Eventos (Opcionais) ---
    dataEvento: {
      type: Date,
      required: false
      // A validação para tornar este campo obrigatório quando tipo='evento' deve ser feita na camada de serviço
    },
    localEvento: {
      type: String,
      trim: true, // Remove espaços em branco no início e fim
      maxlength: [200, 'O local do evento não pode exceder 200 caracteres.'],
      required: false
      // A validação para tornar este campo obrigatório quando tipo='evento' deve ser feita na camada de serviço
    },
    // --- Contadores ---
    contagemLikes: {
      type: Number, // Tipo numérico
      default: 0, // Valor padrão é zero
      min: 0, // Valor mínimo é zero
      required: true // Garante que o campo sempre exista no documento
    },
    contagemComentarios: { // Contador que inclui comentários principais e respostas
      type: Number, // Tipo numérico
      default: 0, // Valor padrão é zero
      min: 0, // Valor mínimo é zero
      required: true // Garante que o campo sempre exista no documento
    },
    // --- Status de Moderação ---
    status: {
      type: String, // Tipo string
      enum: {
        values: Object.values(PublicacaoStatusEnum), // Valores permitidos definidos no enum
        message: 'Status inválido: {VALUE}.' // Mensagem de erro para valores inválidos
      },
      default: PublicacaoStatusEnum.APROVADO, // Valor padrão (pode ser alterado para PENDENTE_APROVACAO se necessário)
      required: true, // Campo obrigatório
      index: true // Indexado para melhorar performance de consultas
    },
    motivoReprovacaoOuOcultacao: {
      type: String, // Tipo string
      trim: true, // Remove espaços em branco no início e fim
      maxlength: 500, // Tamanho máximo de 500 caracteres
      required: false // Campo opcional
    }
    // Campos removidos da versão anterior:
    // - dataPostagem: substituído pelo campo createdAt automático
    // - comentarios: movidos para uma coleção separada
    // - likes: movidos para uma coleção separada
  },
  {
    timestamps: true // Adiciona automaticamente os campos createdAt (data de criação) e updatedAt (data de atualização)
  }
);

// --- Índices para otimização de consultas ---
PublicacaoComunidadeSchema.index({ status: 1, createdAt: -1 }); // Índice para consulta do feed principal (ordenado por data decrescente)
PublicacaoComunidadeSchema.index({ autorId: 1, status: 1, createdAt: -1 }); // Índice para consulta de publicações de um autor específico
// PublicacaoComunidadeSchema.index({ tipo: 1, status: 1, dataEvento: 1 }); // Índice para consulta de eventos futuros (comentado/desativado)

// --- Lembretes sobre gerenciamento de Comentários e Curtidas ---
// Importante: Os comentários e curtidas são armazenados em coleções separadas.
// Ao criar ou excluir comentários/curtidas, é necessário atualizar os campos
// contagemLikes e contagemComentarios neste modelo usando o operador $inc do MongoDB
// nos controllers ou services correspondentes.

// --- Exportação do Modelo ---
// Cria o modelo Mongoose 'PublicacaoComunidade' com tipagem TypeScript baseada na interface IPublicacaoComunidade
// O primeiro parâmetro é o nome da coleção no MongoDB (sem o 's' final)
const PublicacaoComunidade = mongoose.model<IPublicacaoComunidade>('PublicacaoComunidade', PublicacaoComunidadeSchema);

export default PublicacaoComunidade;
