import { z } from 'zod';

/**
 * Zod schema for TipoUsuarioEnum
 * Validates that the tipo is one of the allowed values
 * Matches the backend TipoUsuarioEnum
 */
export const tipoUsuarioEnumSchema = z.enum([
  'comprador',
  'prestador',
  'anunciante',
  'admin'
]);

// Use tipoUsuarioEnumSchema for userRoleSchema to ensure consistency
export const userRoleSchema = tipoUsuarioEnumSchema;

/**
 * Zod schema for User
 * Validates the structure of a user object
 */
export const userSchema = z.object({
  // Aceita tanto idUsuario quanto id (um dos dois é obrigatório)
  idUsuario: z.string().optional(),
  id: z.string().optional(),
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  tipoUsuario: tipoUsuarioEnumSchema,
  token: z.string().optional(),

  // Campos opcionais
  telefone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
}).refine(data => data.idUsuario || data.id, {
  message: "Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente",
  path: ["idUsuario"]
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
  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, { 
      message: 'Por favor, insira um endereço de email válido' 
    }),
  senha: z.string()
    .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    }),
});

/**
 * Zod schema for registration data
 */
export const registrationDataSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, { 
      message: 'Por favor, insira um endereço de email válido' 
    }),
  senha: z.string()
    .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    }),
  telefone: z.string()
    .regex(/^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/, { 
      message: 'Por favor, insira um número de telefone válido com DDD (11 dígitos)' 
    })
    .optional(),
  cpfCnpj: z.string()
    .refine(
      (value) => {
        const numeroLimpo = value.replace(/\D/g, '');
        return numeroLimpo.length === 11 || numeroLimpo.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    )
    .refine(
      (value) => {
        const numeroLimpo = value.replace(/\D/g, '');
        return !/^(\d)\1+$/.test(numeroLimpo);
      },
      { message: 'CPF/CNPJ não pode conter todos os dígitos iguais' }
    ),
  tipoUsuario: tipoUsuarioEnumSchema,
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
});

/**
 * Zod schema for profile update data
 */
export const profileUpdateDataSchema = z.object({
  idUsuario: z.string().optional(),
  id: z.string().optional(),
  nome: z.string().min(1, { message: 'Nome é obrigatório' }).optional(),
  email: z.string().email({ message: 'Email inválido' }).optional(),
  telefone: z.string().optional(),
  cpfCnpj: z.string().min(11, { message: 'CPF/CNPJ inválido' }).optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
}).refine(data => data.idUsuario || data.id, {
  message: "Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente",
  path: ["idUsuario"]
});
