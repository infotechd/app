import { z } from 'zod';
import { userSchema } from './userSchema';

/**
 * Este arquivo define os esquemas Zod para validação de dados relacionados a publicações no sistema.
 * Os esquemas Zod são utilizados para validar a estrutura e os tipos de dados das publicações,
 * garantindo que os dados estejam no formato correto antes de serem processados.
 */

/**
 * Esquema Zod para o tipo de Publicação
 * Define os tipos possíveis de publicação: post ou evento
 */
export const publicacaoTypeSchema = z.enum(['post', 'evento']);

// Inferência de tipo a partir do esquema
export type PublicacaoType = z.infer<typeof publicacaoTypeSchema>;

/**
 * Esquema Zod para o Status da Publicação
 * Define os possíveis estados de uma publicação no sistema
 */
export const publicacaoStatusSchema = z.enum([
  'pending_approval', // aguardando aprovação
  'approved',         // aprovado
  'rejected',         // rejeitado
  'hidden_by_user',   // ocultado pelo usuário
  'hidden_by_admin'   // ocultado pelo administrador
]);

// Inferência de tipo a partir do esquema
export type PublicacaoStatus = z.infer<typeof publicacaoStatusSchema>;

/**
 * Esquema Zod para Detalhes de Evento
 * Define a estrutura de dados para informações específicas de eventos
 */
export const eventoDetailsSchema = z.object({
  dataEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, {
    message: "Formato de data inválido. Use YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS.MSSZ"
  }),
  local: z.string().optional(),
  tema: z.string().optional(),
});

// Inferência de tipo a partir do esquema
export type EventoDetails = z.infer<typeof eventoDetailsSchema>;

/**
 * Esquema Zod para Publicação
 * Define a estrutura completa de uma publicação no sistema
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

  // Campos opcionais
  autor: z.object({
    idUsuario: z.string(),
    nome: z.string(),
    foto: z.string().optional(),
  }).optional(),
  detalhesEvento: eventoDetailsSchema.optional(),
});

// Inferência de tipo a partir do esquema
export type Publicacao = z.infer<typeof publicacaoSchema>;

/**
 * Esquema Zod para Dados de Publicação
 * Define a estrutura de dados necessária para criar uma nova publicação
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

// Inferência de tipo a partir do esquema
export type PublicacaoData = z.infer<typeof publicacaoDataSchema>;

/**
 * Esquema Zod para Resposta de Busca de Publicações
 * Define a estrutura da resposta ao buscar publicações no sistema
 */
export const fetchPublicacoesResponseSchema = z.object({
  publicacoes: z.array(publicacaoSchema),
});

// Inferência de tipo a partir do esquema
export type FetchPublicacoesResponse = z.infer<typeof fetchPublicacoesResponseSchema>;

/**
 * Esquema Zod para Resposta de Criação de Publicação
 * Define a estrutura da resposta ao criar uma nova publicação
 */
export const createPublicacaoResponseSchema = z.object({
  message: z.string(),
  publicacao: publicacaoSchema.optional(),
});

// Inferência de tipo a partir do esquema
export type CreatePublicacaoResponse = z.infer<typeof createPublicacaoResponseSchema>;
