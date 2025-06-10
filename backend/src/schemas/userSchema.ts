import { z } from 'zod';
import { TipoUsuarioEnum } from '../models/User';

// Expressão regular para validação de formato de email
// Verifica se o email segue o padrão nome@dominio.extensão
const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// Expressão regular para validação de telefone brasileiro
// Aceita formatos como (11)12345-6789 ou 11123456789
const telefoneRegex = /^(?:\(\d{2}\)\s?)?\d{5}-?\d{4}$|^\d{11}$/;

// Esquema base para usuário que define os campos comuns entre criação e atualização
// Contém validações para todos os campos básicos de um usuário
const userBaseSchema = z.object({
  // Campo para o nome completo do usuário
  // Requer pelo menos 3 caracteres e remove espaços extras
  nome: z.string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
    .trim(),

  // Campo para o email do usuário
  // Valida formato, converte para minúsculas e remove espaços extras
  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(emailRegex, { message: 'Por favor, insira um endereço de email válido' })
    .toLowerCase()
    .trim(),

  // Campo para o telefone do usuário (opcional)
  // Valida o formato do telefone brasileiro e garante que tenha 11 dígitos
  telefone: z.string()
    .regex(telefoneRegex, { message: 'Por favor, insira um número de telefone válido com DDD (11 dígitos)' })
    .refine(
      (value) => !value || value.replace(/\D/g, '').length === 11,
      { message: 'O telefone deve conter 11 dígitos numéricos (DDD + número)' }
    )
    .optional(),

  // Campo para CPF (11 dígitos) ou CNPJ (14 dígitos)
  // Remove caracteres não numéricos e valida o comprimento
  cpfCnpj: z.string()
    .trim()
    .refine(
      (value) => {
        const cleanedValue = value.replace(/\D/g, '');
        return cleanedValue.length === 11 || cleanedValue.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    ),

  // Campo para o tipo de usuário
  // Utiliza enum definido no modelo User para limitar as opções válidas
  tipoUsuario: z.enum(Object.values(TipoUsuarioEnum) as [string, ...string[]], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }).optional(),

  // Campos para os papéis do usuário
  isComprador: z.boolean().optional(),
  isPrestador: z.boolean().optional(),
  isAnunciante: z.boolean().optional(),

  // Campo opcional para o endereço do usuário
  endereco: z.string().trim().optional(),

  // Campo opcional para o URL da foto do usuário
  foto: z.string().trim().optional(),

  // Campo opcional para a data de nascimento
  // Valida o formato da data e garante que não seja no futuro
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
  // Limita as opções a valores predefinidos
  genero: z.enum(['Feminino', 'Masculino', 'Prefiro não dizer'] as [string, ...string[]], {
    errorMap: () => ({ message: 'Gênero inválido' })
  }).optional(),
});

// Esquema para criação de novo usuário no sistema
// Estende o esquema base e adiciona campo de senha obrigatório com validações de segurança
export const createUserSchema = userBaseSchema.extend({
  // Campo para a senha do usuário
  // Requer pelo menos 8 caracteres e deve conter maiúsculas, minúsculas, números e caracteres especiais
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
// Padroniza o formato para sempre usar um objeto 'user' contendo os campos a serem atualizados
// Isso simplifica a validação e evita confusão sobre o formato esperado
export const updateUserSchema = z.object({
  user: userBaseSchema
    .partial()
    .extend({
      // Campo opcional para atualização de senha
      // Mantém as mesmas regras de validação da criação quando fornecido
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
// Contém apenas os campos necessários para o login: email e senha
export const loginUserSchema = z.object({
  // Campo para o email de login
  // Valida formato e normaliza para minúsculas
  email: z.string()
    .email({ message: 'Email inválido' })
    .toLowerCase()
    .trim(),

  // Campo para a senha de login
  // Apenas verifica se foi fornecida
  senha: z.string()
    .min(1, { message: 'Senha é obrigatória' }),
});

// Tipos TypeScript derivados dos esquemas Zod
// Utilizados para tipagem estática em funções que manipulam dados de usuário
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
