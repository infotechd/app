// models/Curriculo.ts (Backend - Convertido para TypeScript)

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
// Importa a interface do usuário para referenciação correta
import { IUser } from './User'; // Ajuste o caminho se necessário

// --- Interfaces ---

// Interface para o subdocumento Experiencia
export interface IExperiencia {
  cargo: string;
  empresa: string;
  periodoInicio: Date;
  periodoFim?: Date; // Opcional
  descricao?: string; // Opcional
}

// Interface para o subdocumento Projeto (Portfólio)
export interface IProjeto {
  nome: string;
  descricao?: string; // Opcional
  link?: string; // Opcional
  imagemUrl?: string; // Opcional
}

// Interface principal que define a estrutura de um documento Curriculo
export interface ICurriculo extends Document {
  prestadorId: Types.ObjectId | IUser; // Pode ser populado com IUser
  resumoProfissional?: string; // Opcional
  experiencias?: IExperiencia[]; // Array opcional de experiências
  habilidades?: string[]; // Array opcional de habilidades
  projetos?: IProjeto[]; // Array opcional de projetos
  // Timestamps (adicionados pelo Mongoose)
  createdAt: Date;
  updatedAt: Date;
  // Adicionar outros campos estruturados se necessário (formacaoAcademica, certificacoes, etc.)
}

// --- Schemas Mongoose ---

// Sub-schema Mongoose para Experiencia Profissional, tipado com IExperiencia
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
    required: false // Data fim é opcional
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false // Descrição opcional
  }
}, { _id: false });

// Sub-schema Mongoose para Projetos (Portfólio), tipado com IProjeto
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
    required: false
  },
  link: {
    type: String,
    trim: true,
    // match: [urlRegex, 'URL inválida para o link do projeto.'], // Adicionar regex de URL se necessário
    required: false
  },
  imagemUrl: {
    type: String,
    trim: true,
    // match: [urlRegex, 'URL inválida para a imagem do projeto.'], // Adicionar regex de URL se necessário
    required: false
  }
}, { _id: false });

// Schema Mongoose principal para Curriculo, tipado com ICurriculo
const CurriculoSchema: Schema<ICurriculo> = new Schema(
  {
    prestadorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Garante um currículo por prestador
      index: true
    },
    resumoProfissional: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: false
    },
    experiencias: { // Array do sub-schema ExperienciaSchema
      type: [ExperienciaSchema],
      required: false // O array como um todo não é obrigatório
    },
    habilidades: { // Array de strings
      type: [String],
      index: true, // Pode ajudar em buscas futuras
      required: false,
      validate: [ // Validador para evitar strings vazias no array
        (arr: string[]) => !arr || arr.every(h => typeof h === 'string' && h.trim().length > 0),
        'Habilidades não podem ser strings vazias.'
      ]
    },
    projetos: { // Array do sub-schema ProjetoSchema
      type: [ProjetoSchema],
      required: false
    },
    // Outros campos estruturados podem ser adicionados aqui
    // formacaoAcademica: { type: [FormacaoSchema], required: false },
    // certificacoes: { type: [CertificacaoSchema], required: false },
  },
  {
    timestamps: true // Adiciona createdAt e updatedAt
  }
);

// Exporta o modelo 'Curriculo' tipado
const Curriculo = mongoose.model<ICurriculo>('Curriculo', CurriculoSchema);

export default Curriculo;