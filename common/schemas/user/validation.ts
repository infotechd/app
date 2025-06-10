import { z } from 'zod';

// Expressão regular para validação de formato de email
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// Expressão regular para validação de telefone brasileiro
const telefoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;

// Esquema base para usuário que define os campos comuns entre criação e atualização
export const userBaseSchema = z.object({
  // Campo para o nome completo do usuário
  nome: z.string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
    .trim(),

  // Campo para o email do usuário
  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(emailRegex, { message: 'Por favor, insira um endereço de email válido' })
    .toLowerCase()
    .trim(),

  // Campo para o telefone do usuário (opcional)
  telefone: z.string()
    .regex(telefoneRegex, { message: 'Por favor, insira um número de telefone válido com DDD (11 dígitos)' })
    .refine(
      (value) => !value || value.replace(/\D/g, '').length === 11,
      { message: 'O telefone deve conter 11 dígitos numéricos (DDD + número)' }
    )
    .optional(),

  // Campo para CPF (11 dígitos) ou CNPJ (14 dígitos)
  cpfCnpj: z.string()
    .trim()
    .refine(
      (value) => {
        const cleanedValue = value.replace(/\D/g, '');
        return cleanedValue.length === 11 || cleanedValue.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    ),

  // Campo opcional para o endereço do usuário
  endereco: z.string().trim().optional(),

  // Campo opcional para o URL da foto do usuário
  foto: z.string().trim().optional(),

  // Campo opcional para a data de nascimento
  dataNascimento: z.string()
    .refine(
      (value) => !value || !isNaN(Date.parse(value)),
      { message: 'Data de nascimento inválida' }
    )
    .transform((value) => value ? new Date(value) : undefined)
    .refine(
      (value) => !value || value <= new Date(),
      { message: 'A data de nascimento não pode estar no futuro' }
    )
    .optional(),

  // Campo opcional para o gênero do usuário
  genero: z.enum(['Feminino', 'Masculino', 'Prefiro não dizer'] as [string, ...string[]], {
    errorMap: () => ({ message: 'Gênero inválido' })
  }).optional(),

  // Campos para os papéis do usuário
  roles: z.array(z.enum(['comprador', 'prestador', 'anunciante', 'admin'] as [string, ...string[]])).optional(),
  isComprador: z.boolean().optional(),
  isPrestador: z.boolean().optional(),
  isAnunciante: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

// Esquema para criação de novo usuário no sistema
export const createUserSchema = userBaseSchema.extend({
  // Campo para a senha do usuário
  senha: z.string()
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
      message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (como !@#$%^&*)'
    })
    .refine(
      (password) => {
        // Verifica se a senha não contém sequências óbvias
        const commonSequences = ['123456', 'abcdef', 'qwerty', 'password'];
        return !commonSequences.some(seq => password.toLowerCase().includes(seq));
      },
      {
        message: 'Senha não deve conter sequências óbvias como "123456" ou "password"'
      }
    ),
});

// Esquema para atualização de dados do usuário
export const updateUserSchema = z.object({
  user: userBaseSchema
    .partial()
    .extend({
      // Campo opcional para atualização de senha
      senha: z.string()
        .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/, {
          message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (como !@#$%^&*)'
        })
        .refine(
          (password) => {
            // Verifica se a senha não contém sequências óbvias
            const commonSequences = ['123456', 'abcdef', 'qwerty', 'password'];
            return !commonSequences.some(seq => password.toLowerCase().includes(seq));
          },
          {
            message: 'Senha não deve conter sequências óbvias como "123456" ou "password"'
          }
        )
        .optional(),

      // Campos de ID - pelo menos um deles deve estar presente
      id: z.string().optional(),
      idUsuario: z.string().optional(),
    })
    .refine(
      (data) => data.id !== undefined || data.idUsuario !== undefined,
      {
        message: "Pelo menos um dos campos 'idUsuario' ou 'id' deve estar presente",
        path: ["idUsuario"]
      }
    )
});

// Esquema para autenticação de usuário no sistema
export const loginUserSchema = z.object({
  // Campo para o email de login
  email: z.string()
    .email({ message: 'Email inválido' })
    .toLowerCase()
    .trim(),

  // Campo para a senha de login
  senha: z.string()
    .min(1, { message: 'Senha é obrigatória' }),
});

// Tipos TypeScript derivados dos esquemas Zod
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;