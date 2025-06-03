import { z } from 'zod';

/**
 * Schema Zod para ReviewData (Dados de Avaliação)
 * 
 * Descrição: Define as regras de validação para os dados de avaliação
 * enviados para a API. Utiliza a biblioteca Zod para garantir que os
 * dados estejam no formato correto antes do envio.
 */
export const reviewDataSchema = z.object({
  receptorId: z.string(), // ID do usuário que está sendo avaliado
  nota: z.number().min(1).max(5, { message: "A nota deve estar entre 1 e 5" }), // Validação da nota
  comentario: z.string().optional(), // Comentário opcional
});

// Inferência de tipo a partir do schema
export type ReviewData = z.infer<typeof reviewDataSchema>;

/**
 * Schema Zod para ReviewResponse (Resposta de Avaliação)
 * 
 * Descrição: Define as regras de validação para a resposta recebida
 * da API após o envio de uma avaliação. Garante que a resposta
 * contenha os campos esperados.
 */
export const reviewResponseSchema = z.object({
  message: z.string(), // Mensagem de retorno da API
});

// Inferência de tipo a partir do schema
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;
