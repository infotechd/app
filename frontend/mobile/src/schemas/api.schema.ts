import { z } from 'zod';
import { userSchema } from './user.schema';
import { offerSchema } from './offer.schema';
import { contratacaoSchema } from './contratacao.schema';

/**
 * Schema Zod para LoginResponse
 * Valida a estrutura de uma resposta de login da API
 * 
 * Nota: Embora o backend envie o token separadamente do objeto user,
 * no frontend o token é adicionado ao objeto user antes da validação
 * para facilitar o uso no AuthContext.
 */
export const loginResponseSchema = z.object({
  user: userSchema._def.schema.extend({
    token: z.string() // Garante que o token esteja presente no objeto user
    // Nota: Anteriormente usava .unwrap() que não existe na API do Zod
    // Foi corrigido para usar diretamente .extend() que é o método correto
  }),
  token: z.string().optional(), // Opcional aqui porque será movido para dentro do user
  message: z.string().optional(),
});

/**
 * Schema Zod para RegistrationResponse
 * Valida a estrutura de uma resposta de registro da API
 */
export const registrationResponseSchema = z.object({
  message: z.string(),
});

/**
 * Schema Zod para ApiErrorResponse
 * Valida a estrutura de uma resposta de erro da API
 */
export const apiErrorResponseSchema = z.object({
  message: z.string(),
  errorCode: z.string().optional(),
});

/**
 * Schema Zod para UpdateProfileResponse
 * Valida a estrutura de uma resposta de atualização de perfil da API
 * 
 * Nota: Consistente com loginResponseSchema, garantindo que o token
 * seja preservado se estiver presente no objeto user retornado.
 */
export const updateProfileResponseSchema = z.object({
  message: z.string(),
  user: userSchema.optional(),
  token: z.string().optional(),
});

/**
 * Schema Zod para DeleteAccountResponse
 * Valida a estrutura de uma resposta de exclusão de conta da API
 */
export const deleteAccountResponseSchema = z.object({
  message: z.string(),
});

/**
 * Schema Zod para FetchOffersResponse
 * Valida a estrutura de uma resposta contendo uma lista de ofertas
 */
export const fetchOffersResponseSchema = z.object({
  offers: z.array(offerSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

/**
 * Schema Zod para OfferMutationResponse
 * Valida a estrutura de uma resposta de criação ou atualização de uma oferta
 */
export const offerMutationResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  offer: offerSchema.optional(),
});

/**
 * Schema Zod para ContratacaoResponse
 * Valida a estrutura de uma resposta de criação de um contrato
 */
export const contratacaoResponseSchema = z.object({
  message: z.string(),
  contratacao: contratacaoSchema.optional(),
});

/**
 * Schema Zod para FetchContratacoesResponse
 * Valida a estrutura de uma resposta contendo uma lista de contratos
 */
export const fetchContratacoesResponseSchema = z.object({
  contratacoes: z.array(contratacaoSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

/**
 * Inferências de tipo dos schemas Zod
 * Isso garante que os tipos TypeScript estejam sempre sincronizados com os schemas
 */
export type LoginResponseSchemaType = z.infer<typeof loginResponseSchema>;
export type RegistrationResponseSchemaType = z.infer<typeof registrationResponseSchema>;
export type ApiErrorResponseSchemaType = z.infer<typeof apiErrorResponseSchema>;
export type UpdateProfileResponseSchemaType = z.infer<typeof updateProfileResponseSchema>;
export type DeleteAccountResponseSchemaType = z.infer<typeof deleteAccountResponseSchema>;
export type FetchOffersResponseSchemaType = z.infer<typeof fetchOffersResponseSchema>;
export type OfferMutationResponseSchemaType = z.infer<typeof offerMutationResponseSchema>;
export type ContratacaoResponseSchemaType = z.infer<typeof contratacaoResponseSchema>;
export type FetchContratacoesResponseSchemaType = z.infer<typeof fetchContratacoesResponseSchema>;
