import { z } from 'zod';
import { contratacaoStatusSchema } from './contratacaoSchema';

/**
 * Zod schema for CompromissoStatus
 */
export const compromissoStatusSchema = z.union([
  contratacaoStatusSchema,
  z.enum(['scheduled', 'confirmed'])
]);

// Type inference from the schema
export type CompromissoStatus = z.infer<typeof compromissoStatusSchema>;

/**
 * Zod schema for Compromisso
 */
export const compromissoSchema = z.object({
  _id: z.string(),
  contratacaoId: z.string(),
  data: z.string(), // ISO 8601 date string
  status: compromissoStatusSchema,
  
  // Optional fields
  descricaoServico: z.string().optional(),
  compradorNome: z.string().optional(),
});

// Type inference from the schema
export type Compromisso = z.infer<typeof compromissoSchema>;

/**
 * Zod schema for Agenda
 */
export const agendaSchema = z.object({
  _id: z.string(),
  prestadorId: z.string(),
  compromissos: z.array(compromissoSchema),
});

// Type inference from the schema
export type Agenda = z.infer<typeof agendaSchema>;

/**
 * Zod schema for FetchAgendaResponse
 */
export const fetchAgendaResponseSchema = z.object({
  agenda: agendaSchema.nullable(),
});

// Type inference from the schema
export type FetchAgendaResponse = z.infer<typeof fetchAgendaResponseSchema>;

/**
 * Zod schema for UpdateCompromissoStatusData
 */
export const updateCompromissoStatusDataSchema = z.object({
  status: compromissoStatusSchema,
});

// Type inference from the schema
export type UpdateCompromissoStatusData = z.infer<typeof updateCompromissoStatusDataSchema>;

/**
 * Zod schema for UpdateAgendaResponse
 */
export const updateAgendaResponseSchema = z.object({
  agenda: agendaSchema,
  message: z.string().optional(),
});

// Type inference from the schema
export type UpdateAgendaResponse = z.infer<typeof updateAgendaResponseSchema>;