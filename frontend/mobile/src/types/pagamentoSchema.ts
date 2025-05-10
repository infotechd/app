import { z } from 'zod';

/**
 * Zod schema for PaymentMethod
 */
export const paymentMethodSchema = z.enum(['cartao', 'boleto', 'pix']);

// Type inference from the schema
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/**
 * Zod schema for PaymentData
 */
export const paymentDataSchema = z.object({
  contratacaoId: z.string(),
  valor: z.number().positive({ message: "Valor deve ser positivo" }),
  metodo: paymentMethodSchema,
});

// Type inference from the schema
export type PaymentData = z.infer<typeof paymentDataSchema>;

/**
 * Zod schema for PaymentResponse
 */
export const paymentResponseSchema = z.object({
  message: z.string(),
  // Optional fields that might be returned by the API
  transactionId: z.string().optional(),
  statusPagamento: z.string().optional(),
});

// Type inference from the schema
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;