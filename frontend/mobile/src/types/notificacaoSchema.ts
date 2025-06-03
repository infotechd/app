import { z } from 'zod';

/**
 * Schema Zod para NotificacaoType
 * 
 * Este schema define os tipos possíveis de notificações no sistema,
 * como notificações gerais, de chat, contratação, etc.
 */
export const notificacaoTypeSchema = z.enum([
  'geral',      // Notificações de propósito geral
  'chat',       // Notificações relacionadas a mensagens de chat
  'contratacao', // Notificações sobre processos de contratação
  'oferta',     // Notificações sobre ofertas recebidas ou enviadas
  'pagamento',  // Notificações relacionadas a transações financeiras
  'avaliacao',  // Notificações sobre avaliações recebidas
  'comunidade', // Notificações de atividades na comunidade
  'sistema'     // Notificações do sistema (manutenção, atualizações, etc.)
]);

// Inferência de tipo a partir do schema
export type NotificacaoType = z.infer<typeof notificacaoTypeSchema>;

/**
 * Schema Zod para NotificacaoContextData
 * 
 * Este schema define os dados de contexto que podem estar associados a uma notificação,
 * como IDs de contratações, ofertas, chats, etc. Estes dados permitem que a notificação
 * seja vinculada a entidades específicas no sistema.
 */
export const notificacaoContextDataSchema = z.object({
  contratacaoId: z.string().optional(), // ID da contratação relacionada à notificação
  ofertaId: z.string().optional(),      // ID da oferta relacionada à notificação
  chatId: z.string().optional(),        // ID do chat relacionado à notificação
  usuarioId: z.string().optional(),     // ID do usuário relacionado à notificação
  publicacaoId: z.string().optional(),  // ID da publicação relacionada à notificação
});

// Inferência de tipo a partir do schema
export type NotificacaoContextData = z.infer<typeof notificacaoContextDataSchema>;

/**
 * Schema Zod para Notificacao
 * 
 * Este schema define a estrutura completa de uma notificação no sistema,
 * incluindo dados obrigatórios como título e mensagem, e dados opcionais
 * como tipo e dados de contexto.
 */
export const notificacaoSchema = z.object({
  _id: z.string(),                                                // Identificador único da notificação
  usuarioId: z.string(),                                          // ID do usuário destinatário da notificação
  titulo: z.string().min(1, { message: "Título é obrigatório" }), // Título da notificação
  mensagem: z.string().min(1, { message: "Mensagem é obrigatória" }), // Conteúdo da notificação
  lida: z.boolean(),                                              // Indica se a notificação foi lida
  dataNotificacao: z.string(),                                    // Data e hora em que a notificação foi criada

  // Campos opcionais
  tipo: notificacaoTypeSchema.optional(),                         // Tipo da notificação
  link: z.string().url({ message: "Link inválido" }).optional(),  // Link associado à notificação
  contextData: notificacaoContextDataSchema.optional(),           // Dados de contexto da notificação
});

// Inferência de tipo a partir do schema
export type Notificacao = z.infer<typeof notificacaoSchema>;

/**
 * Schema Zod para FetchNotificacoesResponse
 * 
 * Este schema define a estrutura da resposta da API ao buscar notificações,
 * contendo um array de objetos de notificação.
 */
export const fetchNotificacoesResponseSchema = z.object({
  notificacoes: z.array(notificacaoSchema), // Array de notificações retornadas pela API
});

// Inferência de tipo a partir do schema
export type FetchNotificacoesResponse = z.infer<typeof fetchNotificacoesResponseSchema>;

/**
 * Schema Zod para NotificacaoActionResponse
 * 
 * Este schema define a estrutura da resposta da API após realizar uma ação
 * em uma notificação (como marcar como lida, excluir, etc).
 */
export const notificacaoActionResponseSchema = z.object({
  message: z.string(),                      // Mensagem de resposta da API
  notificacao: notificacaoSchema.optional(), // Objeto de notificação atualizado (opcional)
});

// Inferência de tipo a partir do schema
export type NotificacaoActionResponse = z.infer<typeof notificacaoActionResponseSchema>;
