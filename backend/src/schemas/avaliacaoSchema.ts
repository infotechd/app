import { z } from 'zod';

/**
 * Esquema base para validação de avaliações
 * Define os campos comuns utilizados tanto na criação quanto na atualização de avaliações
 * Utiliza a biblioteca Zod para validação de dados
 */
const avaliacaoBaseSchema = z.object({
  /**
   * ID da contratação associada à avaliação
   * Deve ser uma string no formato de ObjectId do MongoDB (24 caracteres hexadecimais)
   */
  contratacaoId: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID da contratação inválido'
    }),

  /**
   * ID do usuário que está criando a avaliação
   * Deve ser uma string no formato de ObjectId do MongoDB (24 caracteres hexadecimais)
   */
  autor: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID do autor inválido'
    }),

  /**
   * ID do usuário que está recebendo a avaliação
   * Deve ser uma string no formato de ObjectId do MongoDB (24 caracteres hexadecimais)
   */
  receptor: z.string()
    .refine(value => /^[0-9a-fA-F]{24}$/.test(value), {
      message: 'ID do receptor inválido'
    }),

  /**
   * Nota atribuída na avaliação
   * Deve ser um número inteiro entre 1 e 5
   */
  nota: z.number()
    .int()
    .min(1, { message: 'A nota mínima é 1' })
    .max(5, { message: 'A nota máxima é 5' }),

  /**
   * Comentário opcional sobre a avaliação
   * Limitado a 1000 caracteres e com espaços em branco removidos das extremidades
   */
  comentario: z.string()
    .max(1000, { message: 'O comentário não pode exceder 1000 caracteres' })
    .trim()
    .optional(),
});

/**
 * Esquema para validação na criação de uma nova avaliação
 * Utiliza todos os campos definidos no esquema base
 */
export const createAvaliacaoSchema = avaliacaoBaseSchema;

/**
 * Esquema para validação na atualização de uma avaliação existente
 * Permite atualizar apenas a nota e o comentário, tornando ambos opcionais
 */
export const updateAvaliacaoSchema = z.object({
  /**
   * Nova nota a ser atribuída (opcional na atualização)
   * Deve ser um número inteiro entre 1 e 5
   */
  nota: z.number()
    .int()
    .min(1, { message: 'A nota mínima é 1' })
    .max(5, { message: 'A nota máxima é 5' })
    .optional(),

  /**
   * Novo comentário a ser atribuído (opcional na atualização)
   * Limitado a 1000 caracteres e com espaços em branco removidos das extremidades
   */
  comentario: z.string()
    .max(1000, { message: 'O comentário não pode exceder 1000 caracteres' })
    .trim()
    .optional(),
});

/**
 * Tipos TypeScript derivados dos esquemas Zod
 * Utilizados para tipagem estática em funções que manipulam avaliações
 */
export type CreateAvaliacaoInput = z.infer<typeof createAvaliacaoSchema>;
export type UpdateAvaliacaoInput = z.infer<typeof updateAvaliacaoSchema>;
