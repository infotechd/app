import { z } from 'zod';

/**
 * Zod schema for OfferStatus
 */
export const offerStatusSchema = z.enum(['draft', 'ready', 'inactive', 'archived']);

// Type inference from the schema
export type OfferStatus = z.infer<typeof offerStatusSchema>;

/**
 * Zod schema for IHorarioDisponivel
 */
export const horarioDisponivelSchema = z.object({
  inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: "Formato de hora inválido. Use HH:MM (ex: 09:30)" 
  }),
  fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: "Formato de hora inválido. Use HH:MM (ex: 17:00)" 
  }),
}).refine(data => {
  // Validar que a hora de fim é depois da hora de início
  const inicio = data.inicio.split(':').map(Number);
  const fim = data.fim.split(':').map(Number);
  
  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const fimMinutos = fim[0] * 60 + fim[1];
  
  return fimMinutos > inicioMinutos;
}, {
  message: "A hora de fim deve ser posterior à hora de início",
  path: ["fim"]
});

// Type inference from the schema
export type IHorarioDisponivel = z.infer<typeof horarioDisponivelSchema>;

/**
 * Zod schema for IRecorrenciaSemanal
 */
export const recorrenciaSemanalSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horarios: z.array(horarioDisponivelSchema).min(1, { 
    message: "Pelo menos um horário deve ser fornecido" 
  }),
});

// Type inference from the schema
export type IRecorrenciaSemanal = z.infer<typeof recorrenciaSemanalSchema>;

/**
 * Zod schema for IDisponibilidade
 */
export const disponibilidadeSchema = z.object({
  recorrenciaSemanal: z.array(recorrenciaSemanalSchema).optional(),
  duracaoMediaMinutos: z.number().positive().optional(),
  observacoes: z.string().optional(),
});

// Type inference from the schema
export type IDisponibilidade = z.infer<typeof disponibilidadeSchema>;

/**
 * Zod schema for Offer
 */
export const offerSchema = z.object({
  _id: z.string(),
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  preco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  status: offerStatusSchema,
  disponibilidade: z.union([
    disponibilidadeSchema,
    z.string()
  ]),
  prestadorId: z.string(),
  
  // Optional fields
  dataCriacao: z.string().optional(),
  dataAtualizacao: z.string().optional(),
});

// Type inference from the schema
export type Offer = z.infer<typeof offerSchema>;

/**
 * Zod schema for OfferData (create/update)
 */
export const offerDataSchema = z.object({
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  preco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  status: offerStatusSchema,
  disponibilidade: disponibilidadeSchema,
});

// Type inference from the schema
export type OfferData = z.infer<typeof offerDataSchema>;

/**
 * Zod schema for FetchOffersParams
 */
export const fetchOffersParamsSchema = z.object({
  textoPesquisa: z.string().optional(),
  precoMax: z.number().optional(),
  precoMin: z.number().optional(),
  categorias: z.array(z.string()).optional(),
  status: offerStatusSchema.optional(),
  prestadorId: z.string().optional(),
  sortBy: z.enum(['preco', 'dataCriacao', 'avaliacao']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// Type inference from the schema
export type FetchOffersParams = z.infer<typeof fetchOffersParamsSchema>;