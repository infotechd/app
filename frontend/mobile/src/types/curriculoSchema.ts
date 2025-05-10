import { z } from 'zod';

/**
 * Zod schema for CurriculoData
 */
export const curriculoDataSchema = z.object({
  experiencia: z.string().min(1, { message: "Experiência é obrigatória" }),
  habilidades: z.string().min(1, { message: "Habilidades são obrigatórias" }),
  projetos: z.string().min(1, { message: "Projetos são obrigatórios" }),
});

// Type inference from the schema
export type CurriculoData = z.infer<typeof curriculoDataSchema>;

/**
 * Zod schema for CurriculoResponse
 */
export const curriculoResponseSchema = z.object({
  message: z.string(),
});

// Type inference from the schema
export type CurriculoResponse = z.infer<typeof curriculoResponseSchema>;

/**
 * Zod schema for Curriculo
 */
export const curriculoSchema = curriculoDataSchema.extend({
  _id: z.string(),
  prestadorId: z.string(),
});

// Type inference from the schema
export type Curriculo = z.infer<typeof curriculoSchema>;