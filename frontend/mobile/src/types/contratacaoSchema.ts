import { z } from 'zod';

/**
 * Zod schema for ContratacaoStatus
 */
export const contratacaoStatusSchema = z.enum([
  'pending_acceptance',
  'accepted',
  'rejected',
  'in_progress',
  'completed',
  'paid',
  'cancelled_buyer',
  'cancelled_provider',
  'disputed'
]);

// Type inference from the schema
export type ContratacaoStatus = z.infer<typeof contratacaoStatusSchema>;

/**
 * Zod schema for Contratacao
 */
export const contratacaoSchema = z.object({
  _id: z.string(),
  ofertaId: z.string(),
  compradorId: z.string(),
  prestadorId: z.string(),
  status: contratacaoStatusSchema,
  precoContratado: z.number().positive({ message: "Preço contratado deve ser um valor positivo" }),
  dataContratacao: z.string(),
  dataInicioEstimada: z.string().nullable().optional(),
  dataConclusao: z.string().nullable().optional(),
});

// Type inference from the schema
export type Contratacao = z.infer<typeof contratacaoSchema>;

/**
 * Zod schema for ContratacaoData (create)
 */
export const contratacaoDataSchema = z.object({
  ofertaId: z.string(),
});

// Type inference from the schema
export type ContratacaoData = z.infer<typeof contratacaoDataSchema>;

/**
 * Zod schema for FetchContratacoesParams
 */
export const fetchContratacoesParamsSchema = z.object({
  status: z.array(contratacaoStatusSchema).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  sortBy: z.enum(['dataContratacao', 'status', 'precoContratado']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Type inference from the schema
export type FetchContratacoesParams = z.infer<typeof fetchContratacoesParamsSchema>;