// Arquivo: models/OfertaServico.ts (Backend - Modelo de dados para ofertas de serviços)

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Importação da interface de usuário

// --- Enums e Interfaces ---

// Enum que define os possíveis estados de uma oferta de serviço
export enum OfertaStatusEnum {
  RASCUNHO = 'rascunho',
  DISPONIVEL = 'disponível',
  PAUSADO = 'pausado',
  ENCERRADO = 'encerrado'
}

// Enum que define as categorias disponíveis para classificação dos serviços oferecidos
export enum CategoriaServicoEnum {
  LIMPEZA = 'Limpeza',
  MANUTENCAO = 'Manutenção',
  REFORMAS = 'Reformas',
  ELETRICA = 'Elétrica',
  HIDRAULICA = 'Hidráulica',
  PINTURA = 'Pintura',
  JARDINAGEM = 'Jardinagem',
  INFORMATICA = 'Informática',
  DESIGN = 'Design',
  MARKETING = 'Marketing',
  TRADUCAO = 'Tradução',
  AULAS = 'Aulas',
  CONSULTORIA = 'Consultoria',
  SAUDE = 'Saúde',
  BELEZA = 'Beleza',
  EVENTOS = 'Eventos',
  TRANSPORTE = 'Transporte',
  OUTROS = 'Outros'
}

// Enum que lista todos os estados brasileiros para localização do serviço
export enum EstadoBrasilEnum {
  AC = 'Acre',
  AL = 'Alagoas',
  AP = 'Amapá',
  AM = 'Amazonas',
  BA = 'Bahia',
  CE = 'Ceará',
  DF = 'Distrito Federal',
  ES = 'Espírito Santo',
  GO = 'Goiás',
  MA = 'Maranhão',
  MT = 'Mato Grosso',
  MS = 'Mato Grosso do Sul',
  MG = 'Minas Gerais',
  PA = 'Pará',
  PB = 'Paraíba',
  PR = 'Paraná',
  PE = 'Pernambuco',
  PI = 'Piauí',
  RJ = 'Rio de Janeiro',
  RN = 'Rio Grande do Norte',
  RS = 'Rio Grande do Sul',
  RO = 'Rondônia',
  RR = 'Roraima',
  SC = 'Santa Catarina',
  SP = 'São Paulo',
  SE = 'Sergipe',
  TO = 'Tocantins'
}

// Enum que lista todas as capitais brasileiras para facilitar a seleção de localidades
export enum CapitalBrasilEnum {
  RIO_BRANCO = 'Rio Branco',
  MACEIO = 'Maceió',
  MACAPA = 'Macapá',
  MANAUS = 'Manaus',
  SALVADOR = 'Salvador',
  FORTALEZA = 'Fortaleza',
  BRASILIA = 'Brasília',
  VITORIA = 'Vitória',
  GOIANIA = 'Goiânia',
  SAO_LUIS = 'São Luís',
  CUIABA = 'Cuiabá',
  CAMPO_GRANDE = 'Campo Grande',
  BELO_HORIZONTE = 'Belo Horizonte',
  BELEM = 'Belém',
  JOAO_PESSOA = 'João Pessoa',
  CURITIBA = 'Curitiba',
  RECIFE = 'Recife',
  TERESINA = 'Teresina',
  RIO_DE_JANEIRO = 'Rio de Janeiro',
  NATAL = 'Natal',
  PORTO_ALEGRE = 'Porto Alegre',
  PORTO_VELHO = 'Porto Velho',
  BOA_VISTA = 'Boa Vista',
  FLORIANOPOLIS = 'Florianópolis',
  SAO_PAULO = 'São Paulo',
  ARACAJU = 'Aracaju',
  PALMAS = 'Palmas'
}

// Interface que define a estrutura de dados para a localização do serviço
export interface ILocalizacao {
  estado: EstadoBrasilEnum;
  cidade?: string; // Campo opcional que pode conter uma capital ou outra cidade
}

// Interface que define a estrutura de um horário disponível com hora de início e fim
interface IHorarioDisponivel {
  inicio: string;
  fim: string;
}

// Interface que define a estrutura de recorrência semanal para disponibilidade
interface IRecorrenciaSemanal {
  diaSemana: number; // Número que representa o dia da semana: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horarios: IHorarioDisponivel[];
}

// Interface que define a estrutura completa de disponibilidade do prestador
export interface IDisponibilidade {
  recorrenciaSemanal?: IRecorrenciaSemanal[]; // Array opcional de configurações de recorrência semanal
  duracaoMediaMinutos?: number; // Duração média do serviço em minutos (opcional)
  observacoes?: string; // Campo opcional para observações adicionais
}

// Interface principal que define a estrutura completa de um documento de oferta de serviço no MongoDB
export interface IOfertaServico extends Document {
  prestadorId: Types.ObjectId | IUser; // Referência ao usuário prestador do serviço (pode ser populado com dados completos)
  descricao: string; // Descrição detalhada do serviço oferecido
  preco: number; // Valor cobrado pelo serviço
  status: OfertaStatusEnum; // Status atual da oferta (rascunho, disponível, etc.)
  disponibilidade?: IDisponibilidade; // Configurações de disponibilidade do prestador (campo opcional)
  categorias: string[]; // Lista de categorias em que o serviço se enquadra
  localizacao: ILocalizacao; // Informações sobre onde o serviço é oferecido
  // Campos de data gerados automaticamente pelo Mongoose
  createdAt: Date; // Data de criação do registro
  updatedAt: Date; // Data da última atualização do registro
}

// --- Schemas Mongoose ---

// Sub-schema para definição da estrutura de horários disponíveis no MongoDB
const HorarioDisponivelSchema: Schema<IHorarioDisponivel> = new Schema({
  inicio: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)']
  },
  fim: {
    type: String,
    required: true,
    match: [/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)']
  }
}, { _id: false }); // Configuração para não gerar ID único para cada horário

// Sub-schema para definição da estrutura de recorrência semanal no MongoDB
const RecorrenciaSemanalSchema: Schema<IRecorrenciaSemanal> = new Schema({
  diaSemana: {
    type: Number,
    required: true,
    min: 0, // Valor mínimo (Domingo)
    max: 6  // Valor máximo (Sábado)
  },
  horarios: { // Lista de horários disponíveis para o dia da semana especificado
    type: [HorarioDisponivelSchema],
    required: true // Obrigatório ter pelo menos um horário definido para cada dia incluído
  }
}, { _id: false }); // Configuração para não gerar ID único para cada recorrência

// Schema principal que define a estrutura completa do documento de oferta de serviço no MongoDB
const OfertaServicoSchema: Schema<IOfertaServico> = new Schema(
  {
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Referência ao modelo de usuário no banco de dados
      required: [true, 'O ID do prestador é obrigatório.'],
      index: true // Indexação para otimizar consultas por prestador
    },
    descricao: {
      type: String,
      required: [true, 'A descrição do serviço é obrigatória.'],
      trim: true, // Remove espaços em branco no início e fim
      maxlength: [2000, 'A descrição não pode exceder 2000 caracteres.']
    },
    preco: {
      type: Number,
      required: [true, 'O preço do serviço é obrigatório.'],
      min: [0, 'O preço não pode ser negativo.']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(OfertaStatusEnum), // Utiliza os valores definidos no enum TypeScript
        message: 'Status inválido: {VALUE}.'
      },
      default: OfertaStatusEnum.RASCUNHO, // Valor padrão ao criar nova oferta
      required: true, // Campo obrigatório
      index: true // Indexação para otimizar consultas por status
    },
    categorias: {
      type: [String],
      enum: {
        values: Object.values(CategoriaServicoEnum), // Utiliza os valores definidos no enum TypeScript
        message: 'Categoria inválida: {VALUE}.'
      },
      required: [true, 'Pelo menos uma categoria é obrigatória.'],
      validate: [
        {
          validator: function(v: string[]) {
            return v.length > 0; // Valida que o array não está vazio
          },
          message: 'Pelo menos uma categoria é obrigatória.'
        }
      ],
      index: true // Indexação para otimizar consultas por categorias
    },
    localizacao: {
      type: {
        estado: {
          type: String,
          enum: {
            values: Object.values(EstadoBrasilEnum), // Utiliza os valores definidos no enum TypeScript
            message: 'Estado inválido: {VALUE}.'
          },
          required: [true, 'O estado é obrigatório.']
        },
        cidade: {
          type: String,
          trim: true, // Remove espaços em branco no início e fim
          maxlength: [100, 'O nome da cidade não pode exceder 100 caracteres.']
        }
      },
      required: [true, 'A localização é obrigatória.'],
      index: true // Indexação para otimizar consultas por localização
    },
    disponibilidade: { // Configurações de disponibilidade do prestador
      type: { // Definição explícita do tipo para o Mongoose
        recorrenciaSemanal: {
          type: [RecorrenciaSemanalSchema], // Utiliza o schema de recorrência definido anteriormente
          default: undefined // Evita a criação de um array vazio quando não fornecido
        },
        duracaoMediaMinutos: {
          type: Number,
          min: 1 // Duração mínima de 1 minuto
        },
        observacoes: {
          type: String,
          trim: true, // Remove espaços em branco no início e fim
          maxlength: 500 // Limite de 500 caracteres para observações
        }
      },
      required: false // Campo opcional no documento
    }
    // Campo dataCriacao foi removido em favor do timestamps automático
  },
  {
    timestamps: true // Adiciona campos createdAt e updatedAt automaticamente
  }
);

// Cria e exporta o modelo 'OfertaServico' com tipagem TypeScript para uso no sistema
const OfertaServico = mongoose.model<IOfertaServico>('OfertaServico', OfertaServicoSchema);

export default OfertaServico;
