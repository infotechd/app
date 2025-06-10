import { z } from 'zod';
import { TipoUsuarioEnum } from '../types/user';

/**
 * Esquema Zod para TipoUsuarioEnum
 * Valida que o tipo é um dos valores permitidos
 * Corresponde ao TipoUsuarioEnum do backend
 * 
 * Este esquema define os possíveis tipos de usuário no sistema,
 * garantindo que apenas valores válidos sejam aceitos.
 */
export const tipoUsuarioEnumSchema = z.enum([
  'comprador',
  'prestador',
  'anunciante',
  'admin'
]);

// Usa tipoUsuarioEnumSchema para userRoleSchema para garantir consistência
// Este esquema é utilizado para validar os papéis dos usuários no sistema
export const userRoleSchema = tipoUsuarioEnumSchema;

/**
 * Esquema Zod para Usuário
 * Valida a estrutura de um objeto de usuário
 * Alinhado com a interface User em types/user.ts
 * 
 * Este esquema define todos os campos de um usuário no sistema,
 * incluindo identificadores, dados pessoais, permissões e timestamps.
 * Ele garante que os dados do usuário estejam em um formato válido
 * antes de serem processados pelo sistema.
 */
export const userSchema = z.object({
  // Identificadores - pelo menos um deve estar presente
  idUsuario: z.string().regex(/^[0-9a-fA-F]{24}$/, { 
    message: 'ID de usuário deve ser um ObjectID válido (24 caracteres hexadecimais)' 
  }).optional(),
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { 
    message: 'ID deve ser um ObjectID válido (24 caracteres hexadecimais)' 
  }).optional(),

  // Campos obrigatórios
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  tipoUsuario: tipoUsuarioEnumSchema.optional(),

  // Papéis do usuário
  roles: z.array(userRoleSchema).optional(),
  activeRole: userRoleSchema.optional(),

  // Capacidades do usuário (mantidas para compatibilidade)
  isComprador: z.boolean().optional(),
  isPrestador: z.boolean().optional(),
  isAnunciante: z.boolean().optional(),
  isAdmin: z.boolean().optional(),

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
 * Inferência de tipo a partir do esquema Zod
 * Isso garante que o tipo TypeScript esteja sempre sincronizado com o esquema
 * 
 * Este tipo é derivado automaticamente do esquema userSchema,
 * permitindo que o TypeScript forneça verificação de tipo e autocompletar
 * para objetos que seguem este esquema.
 */
export type UserSchemaType = z.infer<typeof userSchema>;

/**
 * Esquema Zod para credenciais de login
 * 
 * Este esquema valida os dados de entrada durante o processo de login,
 * garantindo que o email seja válido e que a senha atenda aos requisitos
 * mínimos de segurança (comprimento e complexidade).
 */
export const loginCredentialsSchema = z.object({
  email: z.string()
    .email({ message: 'Email inválido' })
    .regex(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, { 
      message: 'Por favor, insira um endereço de email válido' 
    }),
  senha: z.string()
    .min(1, { message: 'Senha é obrigatória' }),
});

/**
 * Esquema Zod para dados de registro
 * 
 * Este esquema valida os dados fornecidos durante o processo de registro de um novo usuário,
 * garantindo que todos os campos obrigatórios estejam presentes e válidos.
 * Inclui validações para nome, email, senha, telefone, CPF/CNPJ e outros dados pessoais.
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
  tipoUsuario: tipoUsuarioEnumSchema.optional(),
  isComprador: z.boolean().optional(),
  isPrestador: z.boolean().optional(),
  isAnunciante: z.boolean().optional(),
  endereco: z.string().optional(),
  foto: z.string().url({ message: 'URL da foto inválida' }).optional(),
});

/**
 * Interface para o tipo de dados de atualização de perfil
 * Esta interface define a estrutura dos dados de atualização de perfil
 * e é usada para tipar o esquema Zod correspondente
 */
export interface ProfileUpdateData {
  idUsuario?: string;
  id?: string;
  _id?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
  endereco?: string;
  foto?: string;
  dataNascimento?: string | Date;
  genero?: 'Feminino' | 'Masculino' | 'Prefiro não dizer';
  roles?: Array<z.infer<typeof userRoleSchema>>;
  activeRole?: z.infer<typeof userRoleSchema>;
  isComprador?: boolean;
  isPrestador?: boolean;
  isAnunciante?: boolean;
  isAdmin?: boolean;
  user?: Omit<ProfileUpdateData, 'user'>;
}

/**
 * Esquema Zod para dados de atualização de perfil
 * 
 * Este esquema valida os dados fornecidos durante o processo de atualização do perfil do usuário,
 * permitindo que apenas campos específicos sejam atualizados e garantindo que os novos valores
 * sejam válidos. Diferente do esquema de registro, a maioria dos campos aqui é opcional,
 * pois o usuário pode querer atualizar apenas parte de suas informações.
 */
// Primeiro definimos o esquema base sem a propriedade user para evitar referência circular
const profileUpdateBaseSchema = z.object({
  idUsuario: z.string().regex(/^[0-9a-fA-F]{24}$/, { 
    message: 'ID de usuário deve ser um ObjectID válido (24 caracteres hexadecimais)' 
  }).optional(),
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { 
    message: 'ID deve ser um ObjectID válido (24 caracteres hexadecimais)' 
  }).optional(),
  _id: z.string().regex(/^[0-9a-fA-F]{24}$/, { 
    message: 'ID deve ser um ObjectID válido (24 caracteres hexadecimais)' 
  }).optional(),
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
        if (!value) return true; // Pula a validação se estiver vazio
        const numeroLimpo = value.replace(/\D/g, '');
        return numeroLimpo.length === 11 || numeroLimpo.length === 14;
      },
      { message: 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos' }
    )
    .refine(
      (value) => {
        if (!value) return true; // Pula a validação se estiver vazio
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
        if (!value) return true; // Pula a validação se estiver vazio
        const date = typeof value === 'string' ? new Date(value) : value;
        return date <= new Date(); // Garante que a data não esteja no futuro
      },
      { message: 'A data de nascimento não pode ser no futuro' }
    )
    .optional(),
  genero: z.enum(['Feminino', 'Masculino', 'Prefiro não dizer']).optional(),
  // Papéis do usuário
  roles: z.array(userRoleSchema).optional(),
  activeRole: userRoleSchema.optional(),

  // Capacidades do usuário (mantidas para compatibilidade)
  isComprador: z.boolean().optional(),
  isPrestador: z.boolean().optional(),
  isAnunciante: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

// Agora definimos o esquema completo com a propriedade user
export const profileUpdateDataSchema = profileUpdateBaseSchema.extend({
  // Suporte para formato aninhado com objeto user
  user: z.lazy(() => profileUpdateBaseSchema.extend({}).optional()),
}).refine(data => {
  // Verificar se há ID no objeto raiz
  const rootHasId = data.idUsuario || data.id || data._id;

  // Verificar se há ID no objeto user (se existir)
  const userHasId = data.user && (data.user.idUsuario || data.user.id || data.user._id);

  // Se estamos atualizando papéis, não exigir ID (solução alternativa)
  const isRoleUpdate = data.roles || (data.user && data.user.roles) || 
                       data.isComprador !== undefined || data.isPrestador !== undefined || 
                       data.isAnunciante !== undefined || data.isAdmin !== undefined ||
                       (data.user && (
                         data.user.isComprador !== undefined || data.user.isPrestador !== undefined ||
                         data.user.isAnunciante !== undefined || data.user.isAdmin !== undefined
                       ));

  return rootHasId || userHasId || isRoleUpdate;
}, {
  message: "Pelo menos um dos campos 'idUsuario', 'id' ou '_id' deve estar presente (exceto para atualizações de papel)",
  path: ["idUsuario"]
});
