import { z } from 'zod';

/**
 * Esquema Zod para AdStatus
 * 
 * Este esquema define os possíveis estados de um anúncio no sistema:
 * - draft: rascunho, anúncio ainda em edição
 * - pending_approval: aguardando aprovação do administrador
 * - active: anúncio ativo e visível para usuários
 * - inactive: anúncio temporariamente desativado
 * - rejected: anúncio rejeitado pelo administrador
 */
export const adStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'active',
  'inactive',
  'rejected'
]);

// Inferência de tipo a partir do esquema
export type AdStatus = z.infer<typeof adStatusSchema>;

/**
 * Esquema Zod para Anúncio (Ad)
 * 
 * Este esquema define a estrutura de dados de um anúncio completo no sistema:
 * - _id: identificador único do anúncio
 * - title: título do anúncio que será exibido aos usuários
 * - description: descrição detalhada do anúncio
 * - advertiserId: identificador do anunciante que criou o anúncio
 * - status: estado atual do anúncio (conforme definido em adStatusSchema)
 * - views: número de visualizações do anúncio (opcional)
 * - clicks: número de cliques no anúncio (opcional)
 */
export const adSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  advertiserId: z.string(),
  status: adStatusSchema,

  // Campos opcionais
  views: z.number().nonnegative().optional(),
  clicks: z.number().nonnegative().optional(),
});

// Inferência de tipo a partir do esquema
export type Ad = z.infer<typeof adSchema>;

/**
 * Esquema Zod para Dados do Anúncio (AdData)
 * 
 * Este esquema define os dados necessários para criar ou atualizar um anúncio:
 * - title: título do anúncio (obrigatório)
 * - description: descrição detalhada do anúncio (obrigatório)
 * 
 * Diferente do esquema Ad completo, este esquema contém apenas os campos
 * que o usuário precisa fornecer ao criar ou editar um anúncio.
 */
export const adDataSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
});

// Inferência de tipo a partir do esquema
export type AdData = z.infer<typeof adDataSchema>;

/**
 * Esquema Zod para Resposta de Busca de Anúncios (FetchAdsResponse)
 * 
 * Este esquema define a estrutura de dados retornada pela API ao buscar anúncios:
 * - ads: array contendo os anúncios encontrados
 * - total: número total de anúncios disponíveis (opcional, usado para paginação)
 * - page: número da página atual (opcional, usado para paginação)
 * 
 * Este formato é utilizado para facilitar a implementação de listagens paginadas
 * de anúncios na interface do usuário.
 */
export const fetchAdsResponseSchema = z.object({
  ads: z.array(adSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

// Inferência de tipo a partir do esquema
export type FetchAdsResponse = z.infer<typeof fetchAdsResponseSchema>;
