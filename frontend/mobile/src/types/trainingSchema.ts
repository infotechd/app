import { z } from 'zod';

/**
 * Zod schema for TrainingFormat
 */
export const trainingFormatSchema = z.enum(['video', 'pdf', 'webinar']);

// Type inference from the schema
export type TrainingFormat = z.infer<typeof trainingFormatSchema>;

/**
 * Zod schema for TrainingStatus
 */
export const trainingStatusSchema = z.enum(['draft', 'published', 'archived']);

// Type inference from the schema
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;

/**
 * Zod schema for Training
 */
export const trainingSchema = z.object({
  _id: z.string(),
  titulo: z.string().min(1, { message: "Título é obrigatório" }),
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  formato: trainingFormatSchema,
  preco: z.number().min(0, { message: "Preço não pode ser negativo" }),
  status: trainingStatusSchema,
  dataHora: z.string().nullable(),
  anuncianteId: z.string(),
});

// Type inference from the schema
export type Training = z.infer<typeof trainingSchema>;

/**
 * Zod schema for TrainingCreateData
 */
export const trainingCreateDataSchema = z.object({
  titulo: z.string().min(1, { message: "Título é obrigatório" }),
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  formato: trainingFormatSchema,
  preco: z.number().min(0, { message: "Preço não pode ser negativo" }),
  dataHora: z.string().nullable().optional(),
  status: trainingStatusSchema.optional(),
});

// Type inference from the schema
export type TrainingCreateData = z.infer<typeof trainingCreateDataSchema>;

/**
 * Zod schema for TrainingUpdateData
 */
export const trainingUpdateDataSchema = trainingCreateDataSchema.partial();

// Type inference from the schema
export type TrainingUpdateData = z.infer<typeof trainingUpdateDataSchema>;

/**
 * Zod schema for FetchTrainingsResponse
 */
export const fetchTrainingsResponseSchema = z.object({
  trainings: z.array(trainingSchema),
});

// Type inference from the schema
export type FetchTrainingsResponse = z.infer<typeof fetchTrainingsResponseSchema>;

/**
 * Zod schema for FetchTrainingDetailResponse
 */
export const fetchTrainingDetailResponseSchema = z.object({
  treinamento: trainingSchema,
  message: z.string().optional(),
});

// Type inference from the schema
export type FetchTrainingDetailResponse = z.infer<typeof fetchTrainingDetailResponseSchema>;

/**
 * Zod schema for TrainingMutationResponse
 */
export const trainingMutationResponseSchema = z.object({
  message: z.string(),
  treinamento: trainingSchema.optional(),
});

// Type inference from the schema
export type TrainingMutationResponse = z.infer<typeof trainingMutationResponseSchema>;