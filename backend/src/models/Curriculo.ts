// Arquivo de modelo para Currículo no backend (TypeScript)

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; 

// --- Interfaces ---

// Interface que define a estrutura de uma experiência profissional
export interface IExperiencia {
  cargo: string;
  empresa: string;
  periodoInicio: Date;
  periodoFim?: Date; // Campo opcional
  descricao?: string; // Campo opcional
}

// Interface que define a estrutura de um projeto no portfólio
export interface IProjeto {
  nome: string;
  descricao?: string; // Campo opcional
  link?: string; // Campo opcional
  imagemUrl?: string; // Campo opcional
}

// Interface principal que define a estrutura completa de um documento Currículo
export interface ICurriculo extends Document {
  prestadorId: Types.ObjectId | IUser; // Referência ao usuário prestador de serviço
  resumoProfissional?: string; // Campo opcional
  experiencias?: IExperiencia[]; // Lista opcional de experiências profissionais
  habilidades?: string[]; // Lista opcional de habilidades
  projetos?: IProjeto[]; // Lista opcional de projetos
  // Campos de data gerados automaticamente pelo Mongoose
  createdAt: Date;
  updatedAt: Date;
  // Possibilidade de adicionar outros campos estruturados no futuro (formacaoAcademica, certificacoes, etc.)
}

// --- Schemas Mongoose ---

// Esquema para Experiência Profissional, baseado na interface IExperiencia
const ExperienciaSchema: Schema<IExperiencia> = new Schema({
  cargo: {
    type: String,
    required: [true, 'O cargo na experiência é obrigatório.'],
    trim: true
  },
  empresa: {
    type: String,
    required: [true, 'A empresa na experiência é obrigatória.'],
    trim: true
  },
  periodoInicio: {
    type: Date,
    required: [true, 'A data de início da experiência é obrigatória.']
  },
  periodoFim: {
    type: Date,
    required: false // Campo opcional para experiências atuais
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false // Campo opcional para detalhes adicionais
  }
}, { _id: false }); // Não cria IDs separados para subdocumentos

// Esquema para Projetos do portfólio, baseado na interface IProjeto
const ProjetoSchema: Schema<IProjeto> = new Schema({
  nome: {
    type: String,
    required: [true, 'O nome do projeto é obrigatório.'],
    trim: true
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false // Campo opcional para detalhes do projeto
  },
  link: {
    type: String,
    trim: true,
    // Possibilidade de adicionar validação de URL no futuro
    required: false // Campo opcional para link do projeto
  },
  imagemUrl: {
    type: String,
    trim: true,
    // Possibilidade de adicionar validação de URL no futuro
    required: false // Campo opcional para imagem do projeto
  }
}, { _id: false }); // Não cria IDs separados para subdocumentos

// Esquema principal do Currículo, baseado na interface ICurriculo
const CurriculoSchema: Schema<ICurriculo> = new Schema(
  {
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Garante que cada prestador tenha apenas um currículo
      index: true // Otimiza consultas por prestador
    },
    resumoProfissional: {
      type: String,
      trim: true,
      maxlength: 2000, // Limite de caracteres para o resumo
      required: false // Campo opcional
    },
    experiencias: { 
      type: [ExperienciaSchema], // Lista de experiências usando o esquema definido
      required: false // Campo opcional
    },
    habilidades: { 
      type: [String], // Lista de strings representando habilidades
      index: true, // Otimiza buscas por habilidades
      required: false, // Campo opcional
      validate: [ 
        // Validador que garante que não existam strings vazias na lista
        (arr: string[]) => !arr || arr.every(h => typeof h === 'string' && h.trim().length > 0),
        'Habilidades não podem ser strings vazias.'
      ]
    },
    projetos: { 
      type: [ProjetoSchema], // Lista de projetos usando o esquema definido
      required: false // Campo opcional
    },
    // Possibilidade de adicionar outros campos estruturados no futuro
    // formacaoAcademica: { type: [FormacaoSchema], required: false },
    // certificacoes: { type: [CertificacaoSchema], required: false },
  },
  {
    timestamps: true // Adiciona campos automáticos de data de criação e atualização
  }
);

// Cria e exporta o modelo 'Curriculo' baseado no esquema definido
const Curriculo = mongoose.model<ICurriculo>('Curriculo', CurriculoSchema);

export default Curriculo;
