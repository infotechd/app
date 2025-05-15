import { z } from 'zod';
import { userSchema } from './userSchema';

/**
 * Zod schema for PublicacaoType
 */
export const publicacaoTypeSchema = z.enum(['post', 'evento']);

// Type inference from the schema
export type PublicacaoType = z.infer<typeof publicacaoTypeSchema>;

/**
 * Zod schema for PublicacaoStatus
 */
export const publicacaoStatusSchema = z.enum([
  'pending_approval',
  'approved',
  'rejected',
  'hidden_by_user',
  'hidden_by_admin'
]);

// Type inference from the schema
export type PublicacaoStatus = z.infer<typeof publicacaoStatusSchema>;

/**
 * Zod schema for EventoDetails
 */
export const eventoDetailsSchema = z.object({
  dataEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    message: "Formato de data inválido. Use YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS.MSSZ"
  }),
  local: z.string().optional(),
  tema: z.string().optional(),
});

// Type inference from the schema
export type EventoDetails = z.infer<typeof eventoDetailsSchema>;

/**
 * Zod schema for Publicacao
 */
export const publicacaoSchema = z.object({
  _id: z.string(),
  conteudo: z.string().min(1, { message: "Conteúdo é obrigatório" }),
  tipo: publicacaoTypeSchema,
  status: publicacaoStatusSchema,
  dataPostagem: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    message: "Formato de data inválido. Use YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS.MSSZ"
  }),
  autorId: z.string(),

  // Optional fields
  autor: z.object({
    idUsuario: z.string(),
    nome: z.string(),
    foto: z.string().optional(),
  }).optional(),
  detalhesEvento: eventoDetailsSchema.optional(),
});

// Type inference from the schema
export type Publicacao = z.infer<typeof publicacaoSchema>;

/**
 * Zod schema for PublicacaoData
 */
export const publicacaoDataSchema = z.object({
  conteudo: z.string().min(1, { message: "Conteúdo é obrigatório" }),
  tipo: publicacaoTypeSchema,
  detalhesEvento: eventoDetailsSchema.optional(),
}).refine(
  (data) => {
    // Se o tipo for 'evento', detalhesEvento é obrigatório
    return data.tipo !== 'evento' || (data.tipo === 'evento' && !!data.detalhesEvento);
  },
  {
    message: "Detalhes do evento são obrigatórios para publicações do tipo 'evento'",
    path: ['detalhesEvento']
  }
);

// Type inference from the schema
export type PublicacaoData = z.infer<typeof publicacaoDataSchema>;

/**
 * Zod schema for FetchPublicacoesResponse
 */
export const fetchPublicacoesResponseSchema = z.object({
  publicacoes: z.array(publicacaoSchema),
});

// Type inference from the schema
export type FetchPublicacoesResponse = z.infer<typeof fetchPublicacoesResponseSchema>;

/**
 * Zod schema for CreatePublicacaoResponse
 */
export const createPublicacaoResponseSchema = z.object({
  message: z.string(),
  publicacao: publicacaoSchema.optional(),
});

// Type inference from the schema
export type CreatePublicacaoResponse = z.infer<typeof createPublicacaoResponseSchema>;
