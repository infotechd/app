import { z } from 'zod';
import mongoose from 'mongoose';
import { ContratacaoStatusEnum } from '../models/Contratacao';

// Schema para validação de ObjectId do MongoDB - garante que o ID fornecido seja válido
const objectIdSchema = z.string().refine(
  (value) => mongoose.Types.ObjectId.isValid(value),
  { message: 'ID inválido' }
);

// Schema para criar uma nova contratação - requer apenas o ID da oferta relacionada
export const criarContratacaoSchema = z.object({
  ofertaId: objectIdSchema
});

// Schema para atualizar o status de uma contratação - valida se o status fornecido está entre os valores permitidos
export const atualizarStatusContratacaoSchema = z.object({
  status: z.enum(Object.values(ContratacaoStatusEnum) as [string, ...string[]], {
    errorMap: () => ({ message: `Status deve ser um dos seguintes valores: ${Object.values(ContratacaoStatusEnum).join(', ')}` })
  })
});

// Schema para validar parâmetros de rota - usado para validar o ID da contratação nas requisições
export const contratacaoParamsSchema = z.object({
  contratacaoId: objectIdSchema
});

// Schema para validar parâmetros de consulta na listagem de contratações - permite filtrar por status
export const listarContratacoesQuerySchema = z.object({
  status: z.enum(Object.values(ContratacaoStatusEnum) as [string, ...string[]]).optional()
});

// Tipos TypeScript gerados a partir dos schemas Zod - utilizados para tipagem estática no código
export type CriarContratacaoDTO = z.infer<typeof criarContratacaoSchema>;
export type AtualizarStatusContratacaoDTO = z.infer<typeof atualizarStatusContratacaoSchema>;
export type ContratacaoParams = z.infer<typeof contratacaoParamsSchema>;
export type ListarContratacoesQuery = z.infer<typeof listarContratacoesQuerySchema>;
