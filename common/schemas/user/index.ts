import { z } from 'zod';

// Exporta todos os esquemas de validação detalhados
import { createUserSchema, loginUserSchema } from './validation';
export * from './validation';

// Esquema simplificado do usuário para compatibilidade com código existente
export const userSchema = z.object({
  id: z.string(), // Identificador único do usuário
  nome: z.string().min(2), // Nome do usuário com mínimo de 2 caracteres
  email: z.string().email(), // Email do usuário com validação de formato
  senha: z.string().min(8).optional(), // Senha do usuário com mínimo de 8 caracteres (opcional para respostas da API)
  token: z.string().optional(), // Token JWT para autenticação
  refreshToken: z.string().optional(), // Refresh token para renovação de autenticação
  roles: z.array(z.string()).optional(), // Papéis do usuário como array de strings
  isComprador: z.boolean().optional(), // Flag para papel de comprador
  isPrestador: z.boolean().optional(), // Flag para papel de prestador
  isAnunciante: z.boolean().optional(), // Flag para papel de anunciante
  isAdmin: z.boolean().optional(), // Flag para papel de administrador
  createdAt: z.date().optional(), // Data de criação do registro
  updatedAt: z.date().optional(), // Data da última atualização do registro
});

// Tipos de usuário derivados dos esquemas - Usados para tipagem estática no TypeScript
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>; // Alias para CreateUserInput para compatibilidade
export type LoginUser = z.infer<typeof loginUserSchema>; // Alias para LoginUserInput para compatibilidade
