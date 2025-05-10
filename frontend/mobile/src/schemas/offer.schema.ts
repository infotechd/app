import { z } from 'zod';

/**
 * Zod schema for OfferStatus
 * Validates that the status is one of the allowed values
 */
export const offerStatusSchema = z.enum([
  'draft',
  'ready',
  'inactive',
  'archived'
]);

/**
 * Zod schema for IHorarioDisponivel
 * Validates the structure of a time slot
 */
export const horarioDisponivelSchema = z.object({
  inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora inválido. Use HH:MM (ex: 09:30)'
  }),
  fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora inválido. Use HH:MM (ex: 17:00)'
  }),
});

/**
 * Zod schema for IRecorrenciaSemanal
 * Validates the structure of a weekly recurrence
 */
export const recorrenciaSemanalSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horarios: z.array(horarioDisponivelSchema),
});

/**
 * Zod schema for IDisponibilidade
 * Validates the structure of availability
 */
export const disponibilidadeSchema = z.object({
  recorrenciaSemanal: z.array(recorrenciaSemanalSchema).optional(),
  duracaoMediaMinutos: z.number().positive().optional(),
  observacoes: z.string().optional(),
});

/**
 * Zod schema for Offer
 * Validates the structure of an offer object
 */
export const offerSchema = z.object({
  _id: z.string(),
  descricao: z.string().min(1, { message: 'Descrição é obrigatória' }),
  preco: z.number().positive({ message: 'Preço deve ser positivo' }),
  status: offerStatusSchema,
  disponibilidade: z.union([
    disponibilidadeSchema,
    z.string()
  ]),
  prestadorId: z.string(),
  
  // Campos opcionais
  dataCriacao: z.string().optional(),
  dataAtualizacao: z.string().optional(),
});

/**
 * Zod schema for OfferData
 * Validates the structure of data for creating or updating an offer
 */
export const offerDataSchema = z.object({
  descricao: z.string().min(1, { message: 'Descrição é obrigatória' }),
  preco: z.number().positive({ message: 'Preço deve ser positivo' }),
  status: offerStatusSchema,
  disponibilidade: disponibilidadeSchema,
});

/**
 * Zod schema for FetchOffersParams
 * Validates the structure of parameters for fetching offers
 */
export const fetchOffersParamsSchema = z.object({
  textoPesquisa: z.string().optional(),
  precoMax: z.number().positive().optional(),
  precoMin: z.number().positive().optional(),
  categorias: z.array(z.string()).optional(),
  status: offerStatusSchema.optional(),
  prestadorId: z.string().optional(),
  sortBy: z.enum(['preco', 'dataCriacao', 'avaliacao']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
});

/**
 * Type inferences from the Zod schemas
 * These ensure that the TypeScript types are always in sync with the schemas
 */
export type OfferStatusSchemaType = z.infer<typeof offerStatusSchema>;
export type HorarioDisponivelSchemaType = z.infer<typeof horarioDisponivelSchema>;
export type RecorrenciaSemanalSchemaType = z.infer<typeof recorrenciaSemanalSchema>;
export type DisponibilidadeSchemaType = z.infer<typeof disponibilidadeSchema>;
export type OfferSchemaType = z.infer<typeof offerSchema>;
export type OfferDataSchemaType = z.infer<typeof offerDataSchema>;
export type FetchOffersParamsSchemaType = z.infer<typeof fetchOffersParamsSchema>;