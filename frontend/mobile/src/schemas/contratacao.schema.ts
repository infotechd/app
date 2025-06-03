import { z } from 'zod';

/**
 * Schema Zod para ContratacaoStatus
 * Valida que o status é um dos valores permitidos
 * 
 * Este esquema define os possíveis estados de uma contratação no sistema,
 * desde a aceitação pendente até disputas.
 */
export const contratacaoStatusSchema = z.enum([
  'pending_acceptance', // Aceitação pendente
  'accepted', // Aceito
  'rejected', // Rejeitado
  'in_progress', // Em andamento
  'completed', // Concluído
  'paid', // Pago
  'cancelled_buyer', // Cancelado pelo comprador
  'cancelled_provider', // Cancelado pelo prestador
  'disputed' // Em disputa
]);

/**
 * Schema Zod para Contratacao
 * Valida a estrutura de um objeto de contrato
 * 
 * Este esquema define todos os campos necessários para uma contratação
 * e suas respectivas validações.
 */
export const contratacaoSchema = z.object({
  _id: z.string(), // Identificador único da contratação
  ofertaId: z.string(), // Referência à oferta relacionada
  compradorId: z.string(), // Identificador do usuário comprador
  prestadorId: z.string(), // Identificador do usuário prestador de serviço
  status: contratacaoStatusSchema, // Status atual da contratação
  precoContratado: z.number().positive({ message: 'Preço contratado deve ser positivo' }), // Valor acordado para o serviço
  dataContratacao: z.string(), // Data em que a contratação foi realizada
  dataInicioEstimada: z.string().nullable().optional(), // Data estimada para início do serviço (opcional)
  dataConclusao: z.string().nullable().optional(), // Data de conclusão do serviço (opcional)
});

/**
 * Schema Zod para ContratacaoData
 * Valida a estrutura de dados para criação de um contrato
 * 
 * Este esquema é utilizado quando um novo contrato está sendo criado,
 * contendo apenas os campos necessários para iniciar uma contratação.
 */
export const contratacaoDataSchema = z.object({
  ofertaId: z.string(), // Identificador da oferta que será contratada
});

/**
 * Schema Zod para FetchContratacoesParams
 * Valida a estrutura de parâmetros para buscar contratos
 * 
 * Este esquema define os parâmetros que podem ser utilizados para filtrar,
 * paginar e ordenar a listagem de contratações.
 */
export const fetchContratacoesParamsSchema = z.object({
  status: z.array(contratacaoStatusSchema).optional(), // Lista de status para filtrar as contratações
  page: z.number().positive().optional(), // Número da página para paginação
  limit: z.number().positive().optional(), // Limite de itens por página
  sortBy: z.enum(['dataContratacao', 'status', 'precoContratado']).optional(), // Campo para ordenação
  sortOrder: z.enum(['asc', 'desc']).optional(), // Direção da ordenação (ascendente ou descendente)
});

/**
 * Inferências de tipos a partir dos schemas Zod
 * Isso garante que os tipos TypeScript estejam sempre sincronizados com os schemas
 * 
 * Estas definições de tipos são utilizadas em todo o aplicativo para garantir
 * consistência e segurança de tipos ao trabalhar com contratações.
 */
export type ContratacaoStatusSchemaType = z.infer<typeof contratacaoStatusSchema>; // Tipo para os valores de status de contratação
export type ContratacaoSchemaType = z.infer<typeof contratacaoSchema>; // Tipo para o objeto completo de contratação
export type ContratacaoDataSchemaType = z.infer<typeof contratacaoDataSchema>; // Tipo para os dados de criação de contratação
export type FetchContratacoesParamsSchemaType = z.infer<typeof fetchContratacoesParamsSchema>; // Tipo para os parâmetros de busca de contratações
