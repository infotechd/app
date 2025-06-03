import { z } from 'zod';

/**
 * Schema Zod para NegociacaoStatus
 * 
 * Este schema define os possíveis estados de uma negociação:
 * - pendente: aguardando resposta
 * - contraproposta: uma nova proposta foi feita
 * - confirmada: negociação aceita
 * - rejeitada: negociação recusada
 * - cancelada: negociação cancelada
 */
export const negociacaoStatusSchema = z.enum([
  'pendente',
  'contraproposta',
  'confirmada',
  'rejeitada',
  'cancelada'
]);

// Inferência de tipo a partir do schema
export type NegociacaoStatus = z.infer<typeof negociacaoStatusSchema>;

/**
 * Schema Zod para PropostaAjuste
 * 
 * Define a estrutura de uma proposta de ajuste com:
 * - novoPreco: valor monetário proposto
 * - novoPrazo: prazo para execução do serviço
 * - observacoes: comentários adicionais (opcional)
 */
export const propostaAjusteSchema = z.object({
  novoPreco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  novoPrazo: z.string().min(1, { message: "Prazo é obrigatório" }),
  observacoes: z.string().optional(),
});

// Inferência de tipo a partir do schema
export type PropostaAjuste = z.infer<typeof propostaAjusteSchema>;

/**
 * Schema Zod para Negociacao
 * 
 * Define a estrutura completa de uma negociação entre comprador e prestador:
 * - _id: identificador único da negociação
 * - contratacaoId: referência à contratação relacionada
 * - compradorId: identificador do comprador
 * - prestadorId: identificador do prestador de serviço
 * - propostaInicial: proposta inicial feita pelo comprador
 * - respostaProvider: contraproposta do prestador (opcional)
 * - status: estado atual da negociação
 * - dataCriacao: data de criação da negociação
 * - dataUltimaAtualizacao: data da última modificação
 */
export const negociacaoSchema = z.object({
  _id: z.string(),
  contratacaoId: z.string(),
  compradorId: z.string(),
  prestadorId: z.string(),
  propostaInicial: propostaAjusteSchema,
  respostaProvider: propostaAjusteSchema.optional(),
  status: negociacaoStatusSchema,
  dataCriacao: z.string().optional(),
  dataUltimaAtualizacao: z.string().optional(),
});

// Inferência de tipo a partir do schema
export type Negociacao = z.infer<typeof negociacaoSchema>;

/**
 * Schema Zod para NegociacaoInitiateData
 * 
 * Define os dados necessários para iniciar uma negociação:
 * - contratacaoId: identificador da contratação
 * - providerId: identificador do prestador
 * - propostaInicial: proposta inicial para a negociação
 */
export const negociacaoInitiateDataSchema = z.object({
  contratacaoId: z.string(),
  providerId: z.string(),
  propostaInicial: propostaAjusteSchema,
});

// Inferência de tipo a partir do schema
export type NegociacaoInitiateData = z.infer<typeof negociacaoInitiateDataSchema>;

/**
 * Schema Zod para NegociacaoRespondData
 * 
 * Define os dados necessários para responder a uma negociação:
 * - respostaProvider: contraproposta do prestador de serviço
 */
export const negociacaoRespondDataSchema = z.object({
  respostaProvider: propostaAjusteSchema,
});

// Inferência de tipo a partir do schema
export type NegociacaoRespondData = z.infer<typeof negociacaoRespondDataSchema>;

/**
 * Schema Zod para NegociacaoResponse
 * 
 * Define a estrutura da resposta da API para operações de negociação:
 * - message: mensagem de retorno da operação
 * - negociacao: dados da negociação (opcional)
 */
export const negociacaoResponseSchema = z.object({
  message: z.string(),
  negociacao: negociacaoSchema.optional(),
});

// Inferência de tipo a partir do schema
export type NegociacaoResponse = z.infer<typeof negociacaoResponseSchema>;
