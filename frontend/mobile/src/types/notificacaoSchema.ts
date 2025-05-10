import { z } from 'zod';

/**
 * Zod schema for NotificacaoType
 */
export const notificacaoTypeSchema = z.enum([
  'geral',
  'chat',
  'contratacao',
  'oferta',
  'pagamento',
  'avaliacao',
  'comunidade',
  'sistema'
]);

// Type inference from the schema
export type NotificacaoType = z.infer<typeof notificacaoTypeSchema>;

/**
 * Zod schema for NotificacaoContextData
 */
export const notificacaoContextDataSchema = z.object({
  contratacaoId: z.string().optional(),
  ofertaId: z.string().optional(),
  chatId: z.string().optional(),
  usuarioId: z.string().optional(),
  publicacaoId: z.string().optional(),
});

// Type inference from the schema
export type NotificacaoContextData = z.infer<typeof notificacaoContextDataSchema>;

/**
 * Zod schema for Notificacao
 */
export const notificacaoSchema = z.object({
  _id: z.string(),
  usuarioId: z.string(),
  titulo: z.string().min(1, { message: "Título é obrigatório" }),
  mensagem: z.string().min(1, { message: "Mensagem é obrigatória" }),
  lida: z.boolean(),
  dataNotificacao: z.string(),
  
  // Optional fields
  tipo: notificacaoTypeSchema.optional(),
  link: z.string().url({ message: "Link inválido" }).optional(),
  contextData: notificacaoContextDataSchema.optional(),
});

// Type inference from the schema
export type Notificacao = z.infer<typeof notificacaoSchema>;

/**
 * Zod schema for FetchNotificacoesResponse
 */
export const fetchNotificacoesResponseSchema = z.object({
  notificacoes: z.array(notificacaoSchema),
});

// Type inference from the schema
export type FetchNotificacoesResponse = z.infer<typeof fetchNotificacoesResponseSchema>;

/**
 * Zod schema for NotificacaoActionResponse
 */
export const notificacaoActionResponseSchema = z.object({
  message: z.string(),
  notificacao: notificacaoSchema.optional(),
});

// Type inference from the schema
export type NotificacaoActionResponse = z.infer<typeof notificacaoActionResponseSchema>;