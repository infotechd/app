import { z } from 'zod';

/**
 * Schema Zod para CurriculoData
 * 
 * Este schema define a estrutura de dados para o currículo do prestador de serviços,
 * incluindo validações para garantir que todos os campos obrigatórios sejam preenchidos.
 */
export const curriculoDataSchema = z.object({
  experiencia: z.string().min(1, { message: "Experiência é obrigatória" }), // Campo que armazena a experiência profissional do prestador
  habilidades: z.string().min(1, { message: "Habilidades são obrigatórias" }), // Campo que armazena as habilidades técnicas do prestador
  projetos: z.string().min(1, { message: "Projetos são obrigatórios" }), // Campo que armazena os projetos realizados pelo prestador
});

// Inferência de tipo a partir do schema
export type CurriculoData = z.infer<typeof curriculoDataSchema>;

/**
 * Schema Zod para CurriculoResponse
 * 
 * Este schema define a estrutura da resposta retornada pelas operações
 * relacionadas ao currículo, como criação, atualização ou exclusão.
 */
export const curriculoResponseSchema = z.object({
  message: z.string(), // Mensagem de resposta da operação realizada
});

// Inferência de tipo a partir do schema
export type CurriculoResponse = z.infer<typeof curriculoResponseSchema>;

/**
 * Schema Zod para Curriculo
 * 
 * Este schema estende o curriculoDataSchema adicionando campos de identificação
 * necessários para o armazenamento e recuperação do currículo no banco de dados.
 */
export const curriculoSchema = curriculoDataSchema.extend({
  _id: z.string(), // Identificador único do currículo no banco de dados
  prestadorId: z.string(), // Identificador do prestador de serviços associado ao currículo
});

// Inferência de tipo a partir do schema
export type Curriculo = z.infer<typeof curriculoSchema>;
