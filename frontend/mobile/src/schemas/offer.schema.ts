import { z } from 'zod';

/**
 * Schema Zod para OfferStatus
 * Valida que o status é um dos valores permitidos
 */
export const offerStatusSchema = z.enum([
  'draft',
  'ready',
  'inactive',
  'archived'
]);

/**
 * Schema Zod para estados brasileiros
 * Valida que o estado é um dos estados brasileiros
 */
export const estadoSchema = z.enum([
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
]);

/**
 * Schema Zod para IHorarioDisponivel
 * Valida a estrutura de um intervalo de tempo
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
 * Schema Zod para IRecorrenciaSemanal
 * Valida a estrutura de uma recorrência semanal
 */
export const recorrenciaSemanalSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horarios: z.array(horarioDisponivelSchema),
});

/**
 * Schema Zod para IDisponibilidade
 * Valida a estrutura de disponibilidade
 */
export const disponibilidadeSchema = z.object({
  recorrenciaSemanal: z.array(recorrenciaSemanalSchema).optional(),
  duracaoMediaMinutos: z.number().positive().optional(),
  observacoes: z.string().optional(),
});

/**
 * Schema Zod para Offer
 * Valida a estrutura de um objeto de oferta
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
  prestadorId: z.union([
    z.string(),
    z.object({ _id: z.string() })
  ]),

  // Campos opcionais
  dataCriacao: z.string().optional(),
  dataAtualizacao: z.string().optional(),
});

/**
 * Schema Zod para OfferData
 * Valida a estrutura de dados para criar ou atualizar uma oferta
 */
export const offerDataSchema = z.object({
  descricao: z.string().min(1, { message: 'Descrição é obrigatória' }),
  preco: z.number().positive({ message: 'Preço deve ser positivo' }),
  status: offerStatusSchema,
  disponibilidade: disponibilidadeSchema,
  categorias: z.array(z.string()).min(1, { message: 'Pelo menos uma categoria é obrigatória' }),
  localizacao: z.object({
    estado: estadoSchema,
    cidade: z.string().optional(),
  }),
});

/**
 * Schema Zod para FetchOffersParams
 * Valida a estrutura de parâmetros para buscar ofertas
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
  incluirPrestador: z.boolean().optional(),
});

/**
 * Inferências de tipo dos schemas Zod
 * Isso garante que os tipos TypeScript estejam sempre sincronizados com os schemas
 */
export type OfferStatusSchemaType = z.infer<typeof offerStatusSchema>;
export type HorarioDisponivelSchemaType = z.infer<typeof horarioDisponivelSchema>;
export type RecorrenciaSemanalSchemaType = z.infer<typeof recorrenciaSemanalSchema>;
export type DisponibilidadeSchemaType = z.infer<typeof disponibilidadeSchema>;
export type OfferSchemaType = z.infer<typeof offerSchema>;
export type OfferDataSchemaType = z.infer<typeof offerDataSchema>;
export type FetchOffersParamsSchemaType = z.infer<typeof fetchOffersParamsSchema>;
