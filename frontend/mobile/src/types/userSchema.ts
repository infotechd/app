import { z } from 'zod';
import { TipoUsuarioEnum } from './user';

/**
 * Zod schema for UserRole
 */
export const userRoleSchema = z.enum([
  TipoUsuarioEnum.COMPRADOR,
  TipoUsuarioEnum.PRESTADOR,
  TipoUsuarioEnum.ANUNCIANTE,
  TipoUsuarioEnum.ADMIN
]);

/**
 * Zod schema for TipoUsuarioEnum
 */
export const tipoUsuarioEnumSchema = z.enum([
  TipoUsuarioEnum.COMPRADOR,
  TipoUsuarioEnum.PRESTADOR,
  TipoUsuarioEnum.ANUNCIANTE,
  TipoUsuarioEnum.ADMIN
]);

// Type inference from the schema
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Zod schema for User
 */
export const userSchema = z.object({
  idUsuario: z.string().uuid(),
  nome: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  tipoUsuario: userRoleSchema,
  token: z.string(),

  // Optional fields
  telefone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: "URL da foto inválida" }).optional(),
});

// Type inference from the schema
export type User = z.infer<typeof userSchema>;

/**
 * Partial schema for user updates
 */
export const userUpdateSchema = userSchema.partial().omit({ token: true, idUsuario: true });

// Type inference from the schema
export type UserUpdate = z.infer<typeof userUpdateSchema>;
