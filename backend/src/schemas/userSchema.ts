import { z } from 'zod';
import { TipoUsuarioEnum } from '../models/User';

// Regex para validação de email
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// Regex para validação de telefone brasileiro
const telefoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;

// Schema base para usuário (campos comuns entre criação e atualização)
const userBaseSchema = z.object({
  nome: z.string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
    .trim(),

  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(emailRegex, { message: 'Por favor, insira um endereço de email válido' })
    .toLowerCase()
    .trim(),

  telefone: z.string()
    .regex(telefoneRegex, { message: 'Por favor, insira um número de telefone válido com DDD (11 dígitos)' })
    .refine(
      (value) => !value || value.replace(/\D/g, '').length === 11,
      { message: 'O telefone deve conter 11 dígitos numéricos (DDD + número)' }
    )
    .optional(),

  cpfCnpj: z.string()
    .trim()
    .refine(
      (value) => {
        const cleanedValue = value.replace(/\D/g, '');
        return cleanedValue.length === 11 || cleanedValue.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    ),

  tipoUsuario: z.enum(Object.values(TipoUsuarioEnum) as [string, ...string[]], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }),

  endereco: z.string().trim().optional(),

  foto: z.string().trim().optional(),
});

// Schema para criação de usuário (inclui senha obrigatória)
export const createUserSchema = userBaseSchema.extend({
  senha: z.string()
    .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    }),
});

// Schema para atualização de usuário (todos os campos são opcionais)
export const updateUserSchema = userBaseSchema
  .partial()
  .extend({
    senha: z.string()
      .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
      })
      .optional(),
  });

// Schema para login de usuário
export const loginUserSchema = z.object({
  email: z.string()
    .email({ message: 'Email inválido' })
    .toLowerCase()
    .trim(),

  senha: z.string()
    .min(1, { message: 'Senha é obrigatória' }),
});

// Tipos TypeScript derivados dos schemas Zod
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
