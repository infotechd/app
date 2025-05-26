// Arquivo: models/InscricaoTreinamento.ts - Modelo de dados para inscrições em treinamentos

/**
 * Modelo InscricaoTreinamento
 * 
 * Este modelo representa a inscrição de um usuário em um treinamento específico.
 * Ele armazena informações sobre o usuário inscrito, o treinamento escolhido,
 * o status atual de progresso, datas importantes, informações de pagamento
 * e certificado de conclusão quando aplicável.
 * 
 * O modelo permite rastrear todo o ciclo de vida da participação do usuário
 * em um treinamento, desde a inscrição até a conclusão.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importação das interfaces dos modelos relacionados
import { IUser } from './User';
import { ITreinamento } from './Treinamento'; 
import { IPagamento } from './Pagamento'; 

// --- Enums e Interfaces ---

// Enum que define os possíveis estados de progresso do usuário no treinamento
export enum StatusProgressoEnum {
  NAO_INICIADO = 'nao_iniciado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido'
}

// Interface principal que define a estrutura de um documento InscricaoTreinamento
export interface IInscricaoTreinamento extends Document {
  usuarioId: Types.ObjectId | IUser; // Referência ao usuário inscrito no treinamento
  treinamentoId: Types.ObjectId | ITreinamento; // Referência ao treinamento em que o usuário está inscrito
  statusProgresso: StatusProgressoEnum; // Estado atual do progresso do usuário no treinamento
  dataConclusao?: Date; // Data em que o usuário concluiu o treinamento (opcional)
  pagamentoId?: Types.ObjectId | IPagamento; // Referência ao pagamento associado à inscrição (opcional)
  certificadoUrl?: string; // URL para o certificado de conclusão (opcional)
  // Campos adicionais que podem ser implementados no futuro:
  // ultimaSecaoVista?: string; // Última seção do treinamento visualizada pelo usuário
  // progressoPercentual?: number; // Percentual de conclusão do treinamento
  // Campos de controle temporal:
  createdAt: Date; // Data em que a inscrição foi realizada
  updatedAt: Date; // Data da última atualização nos dados da inscrição
}

// --- Definição do Schema Mongoose ---

// Configuração do Schema do MongoDB usando a interface IInscricaoTreinamento para tipagem
const InscricaoTreinamentoSchema: Schema<IInscricaoTreinamento> = new Schema(
  {
    usuarioId: {
      type: Schema.Types.ObjectId, // Tipo ObjectId para referência a outro documento
      ref: 'User', // Referência ao modelo de usuário para população de dados
      required: [true, 'O ID do usuário é obrigatório.'], // Campo obrigatório com mensagem de erro
      index: true // Indexado para melhorar performance de consultas
    },
    treinamentoId: {
      type: Schema.Types.ObjectId, // Tipo ObjectId para referência a outro documento
      ref: 'Treinamento', // Referência ao modelo de treinamento para população de dados
      required: [true, 'O ID do treinamento é obrigatório.'], // Campo obrigatório com mensagem de erro
      index: true // Indexado para melhorar performance de consultas
    },
    // Campo dataInscricao foi removido - utilizamos o createdAt dos timestamps
    statusProgresso: {
      type: String, // Armazenado como string no banco de dados
      enum: {
        values: Object.values(StatusProgressoEnum), // Valores permitidos definidos no enum
        message: 'Status de progresso inválido: {VALUE}.' // Mensagem de erro para valores inválidos
      },
      default: StatusProgressoEnum.NAO_INICIADO, // Valor padrão ao criar nova inscrição
      required: true, // Campo obrigatório
      index: true // Indexado para consultas por status
    },
    dataConclusao: {
      type: Date, // Tipo data
      required: false // Não obrigatório, só é preenchido quando o status for 'concluido'
    },
    pagamentoId: {
      type: Schema.Types.ObjectId, // Tipo ObjectId para referência a outro documento
      ref: 'Pagamento', // Referência ao modelo de pagamento para população de dados
      required: false, // Não obrigatório por padrão (validação na camada de serviço para treinamentos pagos)
      index: true, // Indexado para consultas por pagamento
      // unique: true, // Opção para garantir que um pagamento só possa ser usado em uma inscrição
      // sparse: true // Índice esparso para permitir documentos sem este campo
    },
    certificadoUrl: {
      type: String, // Tipo string para armazenar URL
      trim: true, // Remove espaços em branco no início e fim
      required: false // Não obrigatório
      // Possibilidade de adicionar validação de formato de URL
    },
    // Campos adicionais que podem ser implementados no futuro:
    // ultimaSecaoVista: { type: String, required: false }, // Para rastrear progresso por seção
    // progressoPercentual: { type: Number, min: 0, max: 100, required: false }, // Para exibir barra de progresso
  },
  {
    timestamps: true // Adiciona automaticamente os campos createdAt e updatedAt
  }
);

// --- Configuração de Índices Compostos ---
// Índice único que impede duplicação de inscrições do mesmo usuário no mesmo treinamento
InscricaoTreinamentoSchema.index({ usuarioId: 1, treinamentoId: 1 }, { unique: true });

// Índice composto para melhorar a performance de consultas que filtram por usuário e status
InscricaoTreinamentoSchema.index({ usuarioId: 1, statusProgresso: 1 });

// --- Criação e Exportação do Modelo ---
// Registra o modelo no Mongoose com o nome 'InscricaoTreinamento' e o schema definido acima
const InscricaoTreinamento = mongoose.model<IInscricaoTreinamento>('InscricaoTreinamento', InscricaoTreinamentoSchema);

// Exporta o modelo para ser utilizado em outros arquivos da aplicação
export default InscricaoTreinamento;
