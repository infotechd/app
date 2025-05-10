import { z } from 'zod';

/**
 * Zod schema for NegociacaoStatus
 */
export const negociacaoStatusSchema = z.enum([
  'pendente',
  'contraproposta',
  'confirmada',
  'rejeitada',
  'cancelada'
]);

// Type inference from the schema
export type NegociacaoStatus = z.infer<typeof negociacaoStatusSchema>;

/**
 * Zod schema for PropostaAjuste
 */
export const propostaAjusteSchema = z.object({
  novoPreco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  novoPrazo: z.string().min(1, { message: "Prazo é obrigatório" }),
  observacoes: z.string().optional(),
});

// Type inference from the schema
export type PropostaAjuste = z.infer<typeof propostaAjusteSchema>;

/**
 * Zod schema for Negociacao
 */
export const negociacaoSchema = z.object({
  _id: z.string(),
  contratacaoId: z.string(),
  compradorId: z.string(),
  prestadorId: z.string(),
  propostaInicial: propostaAjusteSchema,
  respostaProvider: propostaAjusteSchema.optional(),
  status: negociacaoStatusSchema,
  dataCriacao: z.string().optional(),
  dataUltimaAtualizacao: z.string().optional(),
});

// Type inference from the schema
export type Negociacao = z.infer<typeof negociacaoSchema>;

/**
 * Zod schema for NegociacaoInitiateData
 */
export const negociacaoInitiateDataSchema = z.object({
  contratacaoId: z.string(),
  providerId: z.string(),
  propostaInicial: propostaAjusteSchema,
});

// Type inference from the schema
export type NegociacaoInitiateData = z.infer<typeof negociacaoInitiateDataSchema>;

/**
 * Zod schema for NegociacaoRespondData
 */
export const negociacaoRespondDataSchema = z.object({
  respostaProvider: propostaAjusteSchema,
});

// Type inference from the schema
export type NegociacaoRespondData = z.infer<typeof negociacaoRespondDataSchema>;

/**
 * Zod schema for NegociacaoResponse
 */
export const negociacaoResponseSchema = z.object({
  message: z.string(),
  negociacao: negociacaoSchema.optional(),
});

// Type inference from the schema
export type NegociacaoResponse = z.infer<typeof negociacaoResponseSchema>;