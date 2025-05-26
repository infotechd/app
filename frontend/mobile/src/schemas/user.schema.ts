import { z } from 'zod';
import { TipoUsuarioEnum } from '../types/user';

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
 * Alinhado com a interface User em types/user.ts
 */
export const userSchema = z.object({
  // Identificadores - pelo menos um deve estar presente
  idUsuario: z.string().optional(),
  id: z.string().optional(),

  // Campos obrigatórios
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  tipoUsuario: tipoUsuarioEnumSchema,

  // Token (opcional)
  token: z.string().optional(),

  // Campos opcionais
  telefone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),

  // Campos adicionais alinhados com o backend
  dataNascimento: z.union([z.string(), z.date()]).optional(),
  genero: z.enum(['Feminino', 'Masculino', 'Prefiro não dizer']).optional(),

  // Timestamps do MongoDB
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
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
  telefone: z.string()
    .regex(/^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/, { 
      message: 'Por favor, insira um número de telefone válido com DDD (11 dígitos)' 
    })
    .optional(),
  cpfCnpj: z.string()
    .refine(
      (value) => {
        if (!value) return true; // Skip validation if empty
        const numeroLimpo = value.replace(/\D/g, '');
        return numeroLimpo.length === 11 || numeroLimpo.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    )
    .refine(
      (value) => {
        if (!value) return true; // Skip validation if empty
        const numeroLimpo = value.replace(/\D/g, '');
        return !/^(\d)\1+$/.test(numeroLimpo);
      },
      { message: 'CPF/CNPJ não pode conter todos os dígitos iguais' }
    )
    .optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
  dataNascimento: z.union([z.string(), z.date()])
    .refine(
      (value) => {
        if (!value) return true; // Skip validation if empty
        const date = typeof value === 'string' ? new Date(value) : value;
        return date <= new Date(); // Ensure date is not in the future
      },
      { message: 'A data de nascimento não pode ser no futuro' }
    )
    .optional(),
  genero: z.enum(['Feminino', 'Masculino', 'Prefiro não dizer']).optional(),
}).refine(data => data.idUsuario || data.id, {
  message: "Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente",
  path: ["idUsuario"]
});
