import { z } from 'zod';
import mongoose from 'mongoose';
import { ContratacaoStatusEnum } from '../models/Contratacao';

// Validação de ObjectId do MongoDB
const objectIdSchema = z.string().refine(
  (value) => mongoose.Types.ObjectId.isValid(value),
  { message: 'ID inválido' }
);

// Schema para criar uma nova contratação
export const criarContratacaoSchema = z.object({
  ofertaId: objectIdSchema
});

// Schema para atualizar o status de uma contratação
export const atualizarStatusContratacaoSchema = z.object({
  status: z.enum(Object.values(ContratacaoStatusEnum) as [string, ...string[]], {
    errorMap: () => ({ message: `Status deve ser um dos seguintes valores: ${Object.values(ContratacaoStatusEnum).join(', ')}` })
  })
});

// Schema para parâmetros de rota (contratacaoId)
export const contratacaoParamsSchema = z.object({
  contratacaoId: objectIdSchema
});

// Schema para query params de listagem (filtro por status)
export const listarContratacoesQuerySchema = z.object({
  status: z.enum(Object.values(ContratacaoStatusEnum) as [string, ...string[]]).optional()
});

// Tipos TypeScript derivados dos schemas Zod
export type CriarContratacaoDTO = z.infer<typeof criarContratacaoSchema>;
export type AtualizarStatusContratacaoDTO = z.infer<typeof atualizarStatusContratacaoSchema>;
export type ContratacaoParams = z.infer<typeof contratacaoParamsSchema>;
export type ListarContratacoesQuery = z.infer<typeof listarContratacoesQuerySchema>;