import { z } from 'zod';

/**
 * Zod schema for ReviewData
 */
export const reviewDataSchema = z.object({
  receptorId: z.string(),
  nota: z.number().min(1).max(5, { message: "A nota deve estar entre 1 e 5" }),
  comentario: z.string().optional(),
});

// Type inference from the schema
export type ReviewData = z.infer<typeof reviewDataSchema>;

/**
 * Zod schema for ReviewResponse
 */
export const reviewResponseSchema = z.object({
  message: z.string(),
});

// Type inference from the schema
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;