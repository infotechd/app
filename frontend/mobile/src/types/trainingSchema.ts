import { z } from 'zod';

/**
 * Esquema Zod para TrainingFormat (Formato de Treinamento)
 * 
 * Define os possíveis formatos de um treinamento:
 * - video: treinamento em formato de vídeo
 * - pdf: treinamento em formato de documento PDF
 * - webinar: treinamento ao vivo online
 */
export const trainingFormatSchema = z.enum(['video', 'pdf', 'webinar']);

// Inferência de tipo a partir do esquema
// Este tipo representa o formato do treinamento, derivado do esquema acima
export type TrainingFormat = z.infer<typeof trainingFormatSchema>;

/**
 * Esquema Zod para TrainingStatus (Status do Treinamento)
 * 
 * Define os possíveis estados de um treinamento:
 * - draft: rascunho (treinamento em criação)
 * - published: publicado (treinamento disponível)
 * - archived: arquivado (treinamento não mais disponível)
 */
export const trainingStatusSchema = z.enum(['draft', 'published', 'archived']);

// Inferência de tipo a partir do esquema
// Este tipo representa o status atual do treinamento, derivado do esquema acima
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;

/**
 * Esquema Zod para Training (Treinamento)
 * 
 * Define a estrutura completa de um treinamento, incluindo:
 * - Informações básicas (título, descrição, formato)
 * - Preço e status
 * - Data e hora de realização
 * - ID do anunciante que oferece o treinamento
 */
export const trainingSchema = z.object({
  _id: z.string(),                                                        // Identificador único do treinamento
  titulo: z.string().min(1, { message: "Título é obrigatório" }),         // Título do treinamento (obrigatório)
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),   // Descrição detalhada do treinamento (obrigatória)
  formato: trainingFormatSchema,                                          // Formato do treinamento (video, pdf, webinar)
  preco: z.number().min(0, { message: "Preço não pode ser negativo" }),   // Preço do treinamento (não pode ser negativo)
  status: trainingStatusSchema,                                           // Status atual do treinamento
  dataHora: z.string().nullable(),                                        // Data e hora de realização (pode ser nulo)
  anuncianteId: z.string(),                                               // ID do anunciante que oferece o treinamento
});

// Inferência de tipo a partir do esquema
// Este tipo representa a estrutura completa de um treinamento com todos seus atributos
export type Training = z.infer<typeof trainingSchema>;

/**
 * Esquema Zod para TrainingCreateData (Dados para Criação de Treinamento)
 * 
 * Define os campos necessários para criar um novo treinamento.
 * Alguns campos como status são opcionais e terão valores padrão definidos pelo sistema.
 */
export const trainingCreateDataSchema = z.object({
  titulo: z.string().min(1, { message: "Título é obrigatório" }),         // Título do treinamento (obrigatório)
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),   // Descrição detalhada do treinamento (obrigatória)
  formato: trainingFormatSchema,                                          // Formato do treinamento (video, pdf, webinar)
  preco: z.number().min(0, { message: "Preço não pode ser negativo" }),   // Preço do treinamento (não pode ser negativo)
  dataHora: z.string().nullable().optional(),                             // Data e hora de realização (opcional)
  status: trainingStatusSchema.optional(),                                // Status do treinamento (opcional)
});

// Inferência de tipo a partir do esquema
// Este tipo representa os dados necessários para criar um novo treinamento
export type TrainingCreateData = z.infer<typeof trainingCreateDataSchema>;

/**
 * Esquema Zod para TrainingUpdateData (Dados para Atualização de Treinamento)
 * 
 * Versão parcial do esquema de criação, permitindo atualizar apenas 
 * os campos específicos que precisam ser modificados.
 */
export const trainingUpdateDataSchema = trainingCreateDataSchema.partial();

// Inferência de tipo a partir do esquema
// Este tipo representa os dados para atualização parcial de um treinamento existente
// Todos os campos são opcionais, permitindo atualizar apenas o que for necessário
export type TrainingUpdateData = z.infer<typeof trainingUpdateDataSchema>;

/**
 * Esquema Zod para FetchTrainingsResponse (Resposta de Busca de Treinamentos)
 * 
 * Define a estrutura da resposta ao buscar uma lista de treinamentos,
 * contendo um array com os treinamentos encontrados.
 */
export const fetchTrainingsResponseSchema = z.object({
  trainings: z.array(trainingSchema),  // Array contendo todos os treinamentos encontrados na busca
});

// Inferência de tipo a partir do esquema
// Este tipo representa a estrutura de resposta quando se busca uma lista de treinamentos
export type FetchTrainingsResponse = z.infer<typeof fetchTrainingsResponseSchema>;

/**
 * Esquema Zod para FetchTrainingDetailResponse (Resposta de Detalhes do Treinamento)
 * 
 * Define a estrutura da resposta ao buscar os detalhes de um treinamento específico,
 * contendo o objeto do treinamento e uma mensagem opcional.
 */
export const fetchTrainingDetailResponseSchema = z.object({
  treinamento: trainingSchema,       // Objeto contendo os detalhes completos do treinamento específico
  message: z.string().optional(),    // Mensagem opcional relacionada à operação (sucesso, erro, etc.)
});

// Inferência de tipo a partir do esquema
// Este tipo representa a estrutura de resposta quando se busca os detalhes de um treinamento específico
export type FetchTrainingDetailResponse = z.infer<typeof fetchTrainingDetailResponseSchema>;

/**
 * Esquema Zod para TrainingMutationResponse (Resposta de Mutação de Treinamento)
 * 
 * Define a estrutura da resposta após operações de criação, atualização ou exclusão
 * de um treinamento, contendo uma mensagem e opcionalmente o objeto do treinamento.
 */
export const trainingMutationResponseSchema = z.object({
  message: z.string(),                        // Mensagem informativa sobre o resultado da operação
  treinamento: trainingSchema.optional(),     // Objeto do treinamento (opcional, presente em criação/atualização)
});

// Inferência de tipo a partir do esquema
// Este tipo representa a estrutura de resposta após operações de mutação (criação, atualização, exclusão)
export type TrainingMutationResponse = z.infer<typeof trainingMutationResponseSchema>;
