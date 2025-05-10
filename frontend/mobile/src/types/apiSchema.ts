import { z } from 'zod';
import { userSchema, userRoleSchema, tipoUsuarioEnumSchema } from './userSchema';
import { offerSchema } from './offerSchema';
import { contratacaoSchema } from './contratacaoSchema';

/**
 * Zod schema for LoginResponse
 */
export const loginResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
  message: z.string().optional(),
});

// Type inference from the schema
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Zod schema for RegistrationData
 */
export const registrationDataSchema = z.object({
  nome: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  telefone: z.string().optional(),
  cpfCnpj: z.string().min(1, { message: "CPF/CNPJ é obrigatório" }),
  tipoUsuario: tipoUsuarioEnumSchema,
  endereco: z.string().optional(),
  foto: z.string().url().optional(),
});

// Type inference from the schema
export type RegistrationData = z.infer<typeof registrationDataSchema>;

/**
 * Zod schema for RegistrationResponse
 */
export const registrationResponseSchema = z.object({
  message: z.string(),
});

// Type inference from the schema
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

/**
 * Zod schema for ApiErrorResponse
 */
export const apiErrorResponseSchema = z.object({
  message: z.string(),
});

// Type inference from the schema
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Zod schema for ProfileUpdateData
 */
export const profileUpdateDataSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  foto: z.string().url().optional(),
});

// Type inference from the schema
export type ProfileUpdateData = z.infer<typeof profileUpdateDataSchema>;

/**
 * Zod schema for GetProfileResponse
 */
export const getProfileResponseSchema = userSchema;

// Type inference from the schema
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;

/**
 * Zod schema for UpdateProfileResponse
 */
export const updateProfileResponseSchema = z.object({
  message: z.string(),
  user: userSchema.optional(),
});

// Type inference from the schema
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;

/**
 * Zod schema for DeleteAccountResponse
 */
export const deleteAccountResponseSchema = z.object({
  message: z.string(),
});

// Type inference from the schema
export type DeleteAccountResponse = z.infer<typeof deleteAccountResponseSchema>;

/**
 * Zod schema for FetchOffersResponse
 */
export const fetchOffersResponseSchema = z.object({
  offers: z.array(offerSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

// Type inference from the schema
export type FetchOffersResponse = z.infer<typeof fetchOffersResponseSchema>;

/**
 * Zod schema for OfferMutationResponse
 */
export const offerMutationResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  offer: offerSchema.optional(),
});

// Type inference from the schema
export type OfferMutationResponse = z.infer<typeof offerMutationResponseSchema>;

/**
 * Zod schema for ContratacaoResponse
 */
export const contratacaoResponseSchema = z.object({
  message: z.string(),
  contratacao: contratacaoSchema.optional(),
});

// Type inference from the schema
export type ContratacaoResponse = z.infer<typeof contratacaoResponseSchema>;

/**
 * Zod schema for FetchContratacoesResponse
 */
export const fetchContratacoesResponseSchema = z.object({
  contratacoes: z.array(contratacaoSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

// Type inference from the schema
export type FetchContratacoesResponse = z.infer<typeof fetchContratacoesResponseSchema>;
