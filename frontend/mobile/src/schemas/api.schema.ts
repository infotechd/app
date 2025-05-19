import { z } from 'zod';
import { userSchema } from './user.schema';
import { offerSchema } from './offer.schema';
import { contratacaoSchema } from './contratacao.schema';

/**
 * Zod schema for LoginResponse
 * Validates the structure of a login response from the API
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
 * Zod schema for RegistrationResponse
 * Validates the structure of a registration response from the API
 */
export const registrationResponseSchema = z.object({
  message: z.string(),
});

/**
 * Zod schema for ApiErrorResponse
 * Validates the structure of an error response from the API
 */
export const apiErrorResponseSchema = z.object({
  message: z.string(),
  errorCode: z.string().optional(),
});

/**
 * Zod schema for UpdateProfileResponse
 * Validates the structure of a profile update response from the API
 * 
 * Nota: Consistente com loginResponseSchema, garantindo que o token
 * seja preservado se estiver presente no objeto user retornado.
 */
export const updateProfileResponseSchema = z.object({
  message: z.string(),
  user: userSchema.optional(),
});

/**
 * Zod schema for DeleteAccountResponse
 * Validates the structure of an account deletion response from the API
 */
export const deleteAccountResponseSchema = z.object({
  message: z.string(),
});

/**
 * Zod schema for FetchOffersResponse
 * Validates the structure of a response containing a list of offers
 */
export const fetchOffersResponseSchema = z.object({
  offers: z.array(offerSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

/**
 * Zod schema for OfferMutationResponse
 * Validates the structure of a response from creating or updating an offer
 */
export const offerMutationResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  offer: offerSchema.optional(),
});

/**
 * Zod schema for ContratacaoResponse
 * Validates the structure of a response from creating a contract
 */
export const contratacaoResponseSchema = z.object({
  message: z.string(),
  contratacao: contratacaoSchema.optional(),
});

/**
 * Zod schema for FetchContratacoesResponse
 * Validates the structure of a response containing a list of contracts
 */
export const fetchContratacoesResponseSchema = z.object({
  contratacoes: z.array(contratacaoSchema),
  total: z.number().optional(),
  page: z.number().optional(),
});

/**
 * Type inferences from the Zod schemas
 * These ensure that the TypeScript types are always in sync with the schemas
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
