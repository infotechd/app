import { z } from 'zod';

// Offer schema
export const offerSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  price: z.number().positive(),
  userId: z.string().uuid(),
  category: z.string(),
  status: z.enum(['active', 'pending', 'completed', 'cancelled']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Offer type derived from schema
export type Offer = z.infer<typeof offerSchema>;

// Offer creation schema (without id and timestamps)
export const createOfferSchema = offerSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type CreateOffer = z.infer<typeof createOfferSchema>;

// Offer update schema (all fields optional)
export const updateOfferSchema = createOfferSchema.partial();

export type UpdateOffer = z.infer<typeof updateOfferSchema>;

// Offer search parameters schema
export const offerSearchSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  status: z.enum(['active', 'pending', 'completed', 'cancelled']).optional(),
  userId: z.string().uuid().optional(),
});

export type OfferSearch = z.infer<typeof offerSearchSchema>;