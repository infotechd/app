import { z } from 'zod';
import { TipoUsuarioEnum } from '../models/User';
import { AnuncioStatusEnum, AnuncioTipoEnum } from '../models/Anuncio';

// Regex para validação de URL
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// Tipos de usuário válidos para segmentação (excluindo 'admin')
const tiposUsuarioSegmentacaoValidos = [
  TipoUsuarioEnum.COMPRADOR,
  TipoUsuarioEnum.PRESTADOR,
  TipoUsuarioEnum.ANUNCIANTE
];

// Schema para segmentação
const segmentacaoSchema = z.object({
  regioes: z.array(z.string()).optional(),
  tiposUsuario: z.array(
    z.enum(tiposUsuarioSegmentacaoValidos as [string, ...string[]], {
      errorMap: () => ({ message: 'Tipo de usuário inválido na segmentação' })
    })
  ).optional(),
}).optional();

// Schema base para anúncio (campos comuns entre criação e atualização)
const anuncioBaseSchema = z.object({
  anuncianteId: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID do anunciante inválido'
    }),
  
  titulo: z.string()
    .min(1, { message: 'O título do anúncio é obrigatório' })
    .max(100, { message: 'O título não pode exceder 100 caracteres' })
    .trim(),
  
  conteudo: z.string()
    .min(1, { message: 'O conteúdo do anúncio é obrigatório' })
    .max(1000, { message: 'O conteúdo não pode exceder 1000 caracteres' })
    .trim(),
  
  imagens: z.array(z.string()).optional(),
  
  link: z.string()
    .regex(urlRegex, { message: 'Por favor, insira uma URL válida para o link' })
    .trim()
    .optional(),
  
  status: z.enum(Object.values(AnuncioStatusEnum) as [string, ...string[]], {
    errorMap: () => ({ message: 'Status inválido' })
  }).default(AnuncioStatusEnum.RASCUNHO),
  
  motivoRejeicao: z.string()
    .max(500, { message: 'O motivo de rejeição não pode exceder 500 caracteres' })
    .trim()
    .optional(),
  
  tipoAnuncio: z.enum(Object.values(AnuncioTipoEnum) as [string, ...string[]], {
    errorMap: () => ({ message: 'Tipo de anúncio inválido' })
  }).optional(),
  
  dataInicioExibicao: z.string()
    .refine(value => !isNaN(Date.parse(value)), {
      message: 'Data de início de exibição inválida'
    })
    .transform(value => new Date(value))
    .optional(),
  
  dataFimExibicao: z.string()
    .refine(value => !isNaN(Date.parse(value)), {
      message: 'Data de fim de exibição inválida'
    })
    .transform(value => new Date(value))
    .optional(),
  
  segmentacao: segmentacaoSchema,
});

// Validação adicional para dataFimExibicao
const anuncioSchemaWithDateValidation = anuncioBaseSchema.refine(
  (data) => {
    if (data.dataInicioExibicao && data.dataFimExibicao) {
      return data.dataFimExibicao >= data.dataInicioExibicao;
    }
    return true;
  },
  {
    message: 'A data de fim da exibição deve ser igual ou posterior à data de início',
    path: ['dataFimExibicao'],
  }
);

// Schema para criação de anúncio
export const createAnuncioSchema = anuncioSchemaWithDateValidation;

// Schema para atualização de anúncio (todos os campos são opcionais exceto anuncianteId)
export const updateAnuncioSchema = anuncioBaseSchema
  .partial()
  .extend({
    anuncianteId: z.string()
      .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
        message: 'ID do anunciante inválido'
      }),
  })
  .refine(
    (data) => {
      if (data.dataInicioExibicao && data.dataFimExibicao) {
        return data.dataFimExibicao >= data.dataInicioExibicao;
      }
      return true;
    },
    {
      message: 'A data de fim da exibição deve ser igual ou posterior à data de início',
      path: ['dataFimExibicao'],
    }
  );

// Tipos TypeScript derivados dos schemas Zod
export type CreateAnuncioInput = z.infer<typeof createAnuncioSchema>;
export type UpdateAnuncioInput = z.infer<typeof updateAnuncioSchema>;