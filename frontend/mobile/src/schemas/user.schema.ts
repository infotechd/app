import { z } from 'zod';

/**
 * Zod schema for UserRole
 * Validates that the role is one of the allowed values
 */
export const userRoleSchema = z.enum([
  'comprador',
  'prestador',
  'anunciante',
  'administrador'
]);

/**
 * Zod schema for TipoUsuarioEnum
 * Validates that the tipo is one of the allowed values
 */
export const tipoUsuarioEnumSchema = z.enum([
  'comprador',
  'prestador',
  'anunciante',
  'admin'
]);

/**
 * Zod schema for User
 * Validates the structure of a user object
 */
export const userSchema = z.object({
  idUsuario: z.string(),
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  tipoUsuario: tipoUsuarioEnumSchema,
  token: z.string(),

  // Campos opcionais
  telefone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
});

/**
 * Type inference from the Zod schema
 * This ensures that the TypeScript type is always in sync with the schema
 */
export type UserSchemaType = z.infer<typeof userSchema>;

/**
 * Zod schema for login credentials
 */
export const loginCredentialsSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

/**
 * Zod schema for registration data
 */
export const registrationDataSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  telefone: z.string().optional(),
  cpfCnpj: z.string().min(11, { message: 'CPF/CNPJ inválido' }),
  tipoUsuario: tipoUsuarioEnumSchema,
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
});

/**
 * Zod schema for profile update data
 */
export const profileUpdateDataSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }).optional(),
  email: z.string().email({ message: 'Email inválido' }).optional(),
  telefone: z.string().optional(),
  cpfCnpj: z.string().min(11, { message: 'CPF/CNPJ inválido' }).optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
});
