import { z } from 'zod';

/**
 * Zod schema for AdStatus
 */
export const adStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'active',
  'inactive',
  'rejected'
]);

// Type inference from the schema
export type AdStatus = z.infer<typeof adStatusSchema>;

/**
 * Zod schema for Ad
 */
export const adSchema = z.object({
  _id: z.string(),
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  advertiserId: z.string(),
  status: adStatusSchema,
  
  // Optional fields
  views: z.number().nonnegative().optional(),
  clicks: z.number().nonnegative().optional(),
});

// Type inference from the schema
export type Ad = z.infer<typeof adSchema>;

/**
 * Zod schema for AdData
 */
export const adDataSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
});

// Type inference from the schema
export type AdData = z.infer<typeof adDataSchema>;

/**
 * Zod schema for FetchAdsResponse
 */
export const fetchAdsResponseSchema = z.object({
  ads: z.array(adSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

// Type inference from the schema
export type FetchAdsResponse = z.infer<typeof fetchAdsResponseSchema>;