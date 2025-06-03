import { z } from 'zod';

/**
 * Schema Zod para os métodos de pagamento
 * Define as opções válidas para métodos de pagamento no sistema
 */
export const paymentMethodSchema = z.enum(['cartao', 'boleto', 'pix']);

// Inferência de tipo a partir do schema
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/**
 * Schema Zod para os dados de pagamento
 * Define a estrutura e validações para os dados enviados na requisição de pagamento
 */
export const paymentDataSchema = z.object({
  contratacaoId: z.string(),
  valor: z.number().positive({ message: "Valor deve ser positivo" }),
  metodo: paymentMethodSchema,
});

// Inferência de tipo a partir do schema
export type PaymentData = z.infer<typeof paymentDataSchema>;

/**
 * Schema Zod para a resposta de pagamento
 * Define a estrutura esperada da resposta da API de processamento de pagamento
 */
export const paymentResponseSchema = z.object({
  message: z.string(),
  // Campos opcionais que podem ser retornados pela API
  transactionId: z.string().optional(),
  statusPagamento: z.string().optional(),
});

// Inferência de tipo a partir do schema
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
