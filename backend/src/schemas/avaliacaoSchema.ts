import { z } from 'zod';

// Schema base para avaliação (campos comuns entre criação e atualização)
const avaliacaoBaseSchema = z.object({
  contratacaoId: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID da contratação inválido'
    }),
  
  autor: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID do autor inválido'
    }),
  
  receptor: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID do receptor inválido'
    }),
  
  nota: z.number()
    .int()
    .min(1, { message: 'A nota mínima é 1' })
    .max(5, { message: 'A nota máxima é 5' }),
  
  comentario: z.string()
    .max(1000, { message: 'O comentário não pode exceder 1000 caracteres' })
    .trim()
    .optional(),
});

// Schema para criação de avaliação
export const createAvaliacaoSchema = avaliacaoBaseSchema;

// Schema para atualização de avaliação (apenas nota e comentário podem ser atualizados)
export const updateAvaliacaoSchema = z.object({
  nota: z.number()
    .int()
    .min(1, { message: 'A nota mínima é 1' })
    .max(5, { message: 'A nota máxima é 5' })
    .optional(),
  
  comentario: z.string()
    .max(1000, { message: 'O comentário não pode exceder 1000 caracteres' })
    .trim()
    .optional(),
});

// Tipos TypeScript derivados dos schemas Zod
export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoSchema>;
export type UpdateAvaliacaoInput = z.infer<typeof updateAvaliacaoSchema>;