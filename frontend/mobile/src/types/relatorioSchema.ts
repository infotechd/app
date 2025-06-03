// src/types/relatorioSchema.ts
// Este arquivo define os schemas Zod para validação de dados relacionados aos relatórios do sistema

import { z } from 'zod';
import { tipoUsuarioEnumSchema } from './userSchema';
import { contratacaoStatusSchema } from './contratacaoSchema';

/**
 * Schema Zod para UsuariosPorTipoItem
 * 
 * Define a estrutura de validação para itens que representam a contagem de usuários por tipo.
 * Cada item contém um identificador de tipo de usuário e sua respectiva contagem.
 */
export const usuariosPorTipoItemSchema = z.object({
  _id: z.union([tipoUsuarioEnumSchema, z.string()]), // O tipo de usuário (ex: 'comprador', 'prestador')
  count: z.number().nonnegative(), // Quantidade de usuários desse tipo (deve ser não-negativo)
});

// Inferência de tipo a partir do schema
export type UsuariosPorTipoItem = z.infer<typeof usuariosPorTipoItemSchema>;

/**
 * Schema Zod para ContratacoesPorStatusItem
 * 
 * Define a estrutura de validação para itens que representam a contagem de contratações por status.
 * Cada item contém um identificador de status de contratação e sua respectiva contagem.
 */
export const contratacoesPorStatusItemSchema = z.object({
  _id: z.union([contratacaoStatusSchema, z.string()]), // O status da contratação (ex: 'concluído', 'em_andamento')
  count: z.number().nonnegative(), // Quantidade de contratações nesse status (deve ser não-negativo)
});

// Inferência de tipo a partir do schema
export type ContratacoesPorStatusItem = z.infer<typeof contratacoesPorStatusItemSchema>;

/**
 * Schema Zod para Relatorio
 * 
 * Define a estrutura completa de um relatório no sistema, incluindo estatísticas
 * sobre usuários, contratações, avaliações e publicações.
 */
export const relatorioSchema = z.object({
  usuariosPorTipo: z.array(usuariosPorTipoItemSchema), // Agregação de contagem de usuários por cada tipoUsuario
  contratacoesPorStatus: z.array(contratacoesPorStatusItemSchema), // Agregação de contagem de contratações por cada status
  avgRating: z.number().min(0).max(5), // Média geral das avaliações (nota) registradas na plataforma (entre 0 e 5)
  totalPublicacoes: z.number().nonnegative(), // Contagem total de publicações da comunidade com status 'aprovado'
  timestamp: z.string(), // Data/Hora em que o relatório foi gerado (formato ISO 8601 string)
});

// Inferência de tipo a partir do schema
export type Relatorio = z.infer<typeof relatorioSchema>;

/**
 * Schema Zod para FetchRelatorioResponse
 * 
 * Define a estrutura da resposta da API ao buscar os dados do relatório.
 * Contém o objeto relatório e uma mensagem opcional.
 */
export const fetchRelatorioResponseSchema = z.object({
  relatorio: relatorioSchema, // A API retorna um objeto 'relatorio'
  message: z.string().optional(), // Mensagem opcional retornada pela API
});

// Inferência de tipo a partir do schema
export type FetchRelatorioResponse = z.infer<typeof fetchRelatorioResponseSchema>;
