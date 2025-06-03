import { z } from 'zod';

/**
 * Esquema Zod para ContratacaoStatus
 * 
 * Este esquema define os possíveis estados de uma contratação no sistema,
 * desde a aceitação pendente até disputas.
 */
export const contratacaoStatusSchema = z.enum([
  'pending_acceptance', // aceitação pendente
  'accepted', // aceito
  'rejected', // rejeitado
  'in_progress', // em andamento
  'completed', // concluído
  'paid', // pago
  'cancelled_buyer', // cancelado pelo comprador
  'cancelled_provider', // cancelado pelo prestador
  'disputed' // em disputa
]);

// Inferência de tipo a partir do esquema
export type ContratacaoStatus = z.infer<typeof contratacaoStatusSchema>;

/**
 * Esquema Zod para Contratacao
 * 
 * Define a estrutura de dados para uma contratação completa,
 * incluindo identificadores, status, preço e datas relevantes.
 */
export const contratacaoSchema = z.object({
  _id: z.string(), // identificador único da contratação
  ofertaId: z.string(), // identificador da oferta relacionada
  compradorId: z.string(), // identificador do comprador
  prestadorId: z.string(), // identificador do prestador de serviço
  status: contratacaoStatusSchema, // status atual da contratação
  precoContratado: z.number().positive({ message: "Preço contratado deve ser um valor positivo" }), // valor acordado
  dataContratacao: z.string(), // data em que a contratação foi realizada
  dataInicioEstimada: z.string().nullable().optional(), // data estimada para início do serviço
  dataConclusao: z.string().nullable().optional(), // data de conclusão do serviço
});

// Inferência de tipo a partir do esquema
export type Contratacao = z.infer<typeof contratacaoSchema>;

/**
 * Esquema Zod para ContratacaoData (criação)
 * 
 * Define os dados mínimos necessários para criar uma nova contratação.
 */
export const contratacaoDataSchema = z.object({
  ofertaId: z.string(), // identificador da oferta a ser contratada
});

// Inferência de tipo a partir do esquema
export type ContratacaoData = z.infer<typeof contratacaoDataSchema>;

/**
 * Esquema Zod para FetchContratacoesParams
 * 
 * Define os parâmetros de consulta para buscar contratações,
 * incluindo filtros, paginação e ordenação.
 */
export const fetchContratacoesParamsSchema = z.object({
  status: z.array(contratacaoStatusSchema).optional(), // filtro por status
  page: z.number().optional(), // número da página para paginação
  limit: z.number().optional(), // limite de itens por página
  sortBy: z.enum(['dataContratacao', 'status', 'precoContratado']).optional(), // campo para ordenação
  sortOrder: z.enum(['asc', 'desc']).optional(), // ordem de classificação (ascendente ou descendente)
});

// Inferência de tipo a partir do esquema
export type FetchContratacoesParams = z.infer<typeof fetchContratacoesParamsSchema>;
