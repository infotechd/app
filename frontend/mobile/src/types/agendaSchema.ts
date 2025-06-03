import { z } from 'zod';
import { contratacaoStatusSchema } from './contratacaoSchema';

/**
 * Schema Zod para CompromissoStatus
 * 
 * Este schema define os possíveis estados de um compromisso,
 * combinando os estados de contratação com estados específicos
 * de agendamento ('scheduled' e 'confirmed').
 */
export const compromissoStatusSchema = z.union([
  contratacaoStatusSchema,
  z.enum(['scheduled', 'confirmed']) // 'agendado', 'confirmado'
]);

// Inferência de tipo a partir do schema
export type CompromissoStatus = z.infer<typeof compromissoStatusSchema>;

/**
 * Schema Zod para Compromisso
 * 
 * Define a estrutura de dados para um compromisso na agenda,
 * incluindo identificadores, data, status e informações opcionais.
 */
export const compromissoSchema = z.object({
  _id: z.string(), // Identificador único do compromisso
  contratacaoId: z.string(), // Referência à contratação relacionada
  data: z.string(), // String de data no formato ISO 8601
  status: compromissoStatusSchema, // Status atual do compromisso

  // Campos opcionais
  descricaoServico: z.string().optional(), // Descrição do serviço a ser prestado
  compradorNome: z.string().optional(), // Nome do comprador/cliente
});

// Inferência de tipo a partir do schema
export type Compromisso = z.infer<typeof compromissoSchema>;

/**
 * Schema Zod para Agenda
 * 
 * Define a estrutura de uma agenda completa, que pertence a um prestador
 * e contém uma lista de compromissos.
 */
export const agendaSchema = z.object({
  _id: z.string(), // Identificador único da agenda
  prestadorId: z.string(), // Identificador do prestador de serviços
  compromissos: z.array(compromissoSchema), // Lista de compromissos na agenda
});

// Inferência de tipo a partir do schema
export type Agenda = z.infer<typeof agendaSchema>;

/**
 * Schema Zod para FetchAgendaResponse
 * 
 * Define a estrutura da resposta ao buscar uma agenda,
 * que pode retornar uma agenda ou null caso não exista.
 */
export const fetchAgendaResponseSchema = z.object({
  agenda: agendaSchema.nullable(), // Agenda encontrada ou null
});

// Inferência de tipo a partir do schema
export type FetchAgendaResponse = z.infer<typeof fetchAgendaResponseSchema>;

/**
 * Schema Zod para UpdateCompromissoStatusData
 * 
 * Define a estrutura dos dados necessários para atualizar
 * o status de um compromisso.
 */
export const updateCompromissoStatusDataSchema = z.object({
  status: compromissoStatusSchema, // Novo status do compromisso
});

// Inferência de tipo a partir do schema
export type UpdateCompromissoStatusData = z.infer<typeof updateCompromissoStatusDataSchema>;

/**
 * Schema Zod para UpdateAgendaResponse
 * 
 * Define a estrutura da resposta após atualizar uma agenda,
 * incluindo a agenda atualizada e uma mensagem opcional.
 */
export const updateAgendaResponseSchema = z.object({
  agenda: agendaSchema, // Agenda atualizada
  message: z.string().optional(), // Mensagem opcional sobre a atualização
});

// Inferência de tipo a partir do schema
export type UpdateAgendaResponse = z.infer<typeof updateAgendaResponseSchema>;
