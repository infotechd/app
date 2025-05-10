import { z } from 'zod';
import { tipoUsuarioEnumSchema } from './userSchema';
import { contratacaoStatusSchema } from './contratacaoSchema';

/**
 * Zod schema for UsuariosPorTipoItem
 */
export const usuariosPorTipoItemSchema = z.object({
  _id: z.union([tipoUsuarioEnumSchema, z.string()]),
  count: z.number().nonnegative(),
});

// Type inference from the schema
export type UsuariosPorTipoItem = z.infer<typeof usuariosPorTipoItemSchema>;

/**
 * Zod schema for ContratacoesPorStatusItem
 */
export const contratacoesPorStatusItemSchema = z.object({
  _id: z.union([contratacaoStatusSchema, z.string()]),
  count: z.number().nonnegative(),
});

// Type inference from the schema
export type ContratacoesPorStatusItem = z.infer<typeof contratacoesPorStatusItemSchema>;

/**
 * Zod schema for Relatorio
 */
export const relatorioSchema = z.object({
  usuariosPorTipo: z.array(usuariosPorTipoItemSchema),
  contratacoesPorStatus: z.array(contratacoesPorStatusItemSchema),
  avgRating: z.number().min(0).max(5),
  totalPublicacoes: z.number().nonnegative(),
  timestamp: z.string(),
});

// Type inference from the schema
export type Relatorio = z.infer<typeof relatorioSchema>;

/**
 * Zod schema for FetchRelatorioResponse
 */
export const fetchRelatorioResponseSchema = z.object({
  relatorio: relatorioSchema,
  message: z.string().optional(),
});

// Type inference from the schema
export type FetchRelatorioResponse = z.infer<typeof fetchRelatorioResponseSchema>;
