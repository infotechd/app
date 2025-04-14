// models/InscricaoTreinamento.ts (Backend - Convertido para TypeScript)

/**
 * Modelo InscricaoTreinamento
 * Representa a inscrição de um usuário em um treinamento específico,
 * rastreando o acesso, progresso e pagamento (se aplicável).
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa interfaces dos modelos referenciados
import { IUser } from './User';
import { ITreinamento } from './Treinamento'; // Ajuste o caminho se necessário
import { IPagamento } from './Pagamento'; // Ajuste o caminho se necessário

// --- Enums e Interfaces ---

// Enum para os status de progresso no treinamento
export enum StatusProgressoEnum {
  NAO_INICIADO = 'nao_iniciado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido'
}

// Interface principal que define a estrutura de um documento InscricaoTreinamento
export interface IInscricaoTreinamento extends Document {
  usuarioId: Types.ObjectId | IUser; // Pode ser populado
  treinamentoId: Types.ObjectId | ITreinamento; // Pode ser populado
  statusProgresso: StatusProgressoEnum;
  dataConclusao?: Date; // Opcional
  pagamentoId?: Types.ObjectId | IPagamento; // Opcional, pode ser populado
  certificadoUrl?: string; // Opcional
  // Campos adicionais opcionais
  // ultimaSecaoVista?: string;
  // progressoPercentual?: number;
  // Timestamps
  createdAt: Date; // Data da inscrição
  updatedAt: Date; // Data da última atualização de progresso/status
}

// --- Schema Mongoose ---

// Define o Schema Mongoose, usando a interface IInscricaoTreinamento para tipagem
const InscricaoTreinamentoSchema: Schema<IInscricaoTreinamento> = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'O ID do usuário é obrigatório.'],
      index: true
    },
    treinamentoId: {
      type: Schema.Types.ObjectId,
      ref: 'Treinamento',
      required: [true, 'O ID do treinamento é obrigatório.'],
      index: true
    },
    // dataInscricao removida - usar createdAt dos timestamps
    statusProgresso: {
      type: String,
      enum: {
        values: Object.values(StatusProgressoEnum),
        message: 'Status de progresso inválido: {VALUE}.'
      },
      default: StatusProgressoEnum.NAO_INICIADO,
      required: true,
      index: true
    },
    dataConclusao: {
      type: Date,
      required: false // Só preenchido quando status for 'concluido'
    },
    pagamentoId: {
      type: Schema.Types.ObjectId,
      ref: 'Pagamento',
      required: false, // Obrigatório apenas se o treinamento for pago (validar na camada de serviço)
      index: true,
      // unique: true, // Descomentar se um pagamento paga apenas UMA inscrição
      // sparse: true
    },
    certificadoUrl: {
      type: String,
      trim: true,
      required: false
      // Adicionar validação de URL se necessário
    },
    // Campos adicionais opcionais:
    // ultimaSecaoVista: { type: String, required: false },
    // progressoPercentual: { type: Number, min: 0, max: 100, required: false },
  },
  {
    timestamps: true // Adiciona createdAt (data da inscrição) e updatedAt
  }
);

// --- Índices Compostos ---
// Garante que um usuário só possa se inscrever UMA VEZ no mesmo treinamento.
InscricaoTreinamentoSchema.index({ usuarioId: 1, treinamentoId: 1 }, { unique: true });

// Otimiza busca por inscrições de um usuário por status
InscricaoTreinamentoSchema.index({ usuarioId: 1, statusProgresso: 1 });

// --- Exportação do Modelo ---
// Cria e exporta o modelo 'InscricaoTreinamento' tipado com IInscricaoTreinamento
const InscricaoTreinamento = mongoose.model<IInscricaoTreinamento>('InscricaoTreinamento', InscricaoTreinamentoSchema);

export default InscricaoTreinamento;