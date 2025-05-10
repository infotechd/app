import { z } from 'zod';

/**
 * Zod schema for ContratacaoStatus
 * Validates that the status is one of the allowed values
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

/**
 * Zod schema for Contratacao
 * Validates the structure of a contract object
 */
export const contratacaoSchema = z.object({
  _id: z.string(),
  ofertaId: z.string(),
  compradorId: z.string(),
  prestadorId: z.string(),
  status: contratacaoStatusSchema,
  precoContratado: z.number().positive({ message: 'Preço contratado deve ser positivo' }),
  dataContratacao: z.string(),
  dataInicioEstimada: z.string().nullable().optional(),
  dataConclusao: z.string().nullable().optional(),
});

/**
 * Zod schema for ContratacaoData
 * Validates the structure of data for creating a contract
 */
export const contratacaoDataSchema = z.object({
  ofertaId: z.string(),
});

/**
 * Zod schema for FetchContratacoesParams
 * Validates the structure of parameters for fetching contracts
 */
export const fetchContratacoesParamsSchema = z.object({
  status: z.array(contratacaoStatusSchema).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().optional(),
  sortBy: z.enum(['dataContratacao', 'status', 'precoContratado']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Type inferences from the Zod schemas
 * These ensure that the TypeScript types are always in sync with the schemas
 */
export type ContratacaoStatusSchemaType = z.infer<typeof contratacaoStatusSchema>;
export type ContratacaoSchemaType = z.infer<typeof contratacaoSchema>;
export type ContratacaoDataSchemaType = z.infer<typeof contratacaoDataSchema>;
export type FetchContratacoesParamsSchemaType = z.infer<typeof fetchContratacoesParamsSchema>;