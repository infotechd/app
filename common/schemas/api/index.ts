import { z } from 'zod';

// API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// API response type derived from schema
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Pagination parameters schema
export const paginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationParamsSchema>;

// Paginated response schema
export const paginatedResponseSchema = z.object({
  items: z.array(z.any()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginatedResponse<T = any> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().int().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;