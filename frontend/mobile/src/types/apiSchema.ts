/**
 * @deprecated Este arquivo está mantido apenas para compatibilidade.
 * Importe os schemas diretamente de '../schemas/api.schema.ts' e '../schemas/user.schema.ts'.
 */

import { z } from 'zod';

// Importa schemas de api.schema.ts
import {
  loginResponseSchema,
  registrationResponseSchema,
  apiErrorResponseSchema,
  updateProfileResponseSchema,
  deleteAccountResponseSchema,
  fetchOffersResponseSchema,
  offerMutationResponseSchema,
  contratacaoResponseSchema,
  fetchContratacoesResponseSchema,

  // Tipos inferidos
  LoginResponseSchemaType,
  RegistrationResponseSchemaType,
  ApiErrorResponseSchemaType,
  UpdateProfileResponseSchemaType,
  DeleteAccountResponseSchemaType,
  FetchOffersResponseSchemaType,
  OfferMutationResponseSchemaType,
  ContratacaoResponseSchemaType,
  FetchContratacoesResponseSchemaType
} from '../schemas/api.schema';

// Importa schemas de user.schema.ts
import {
  userSchema,
  registrationDataSchema,
  profileUpdateDataSchema
} from '../schemas/user.schema';

// Re-exporta os schemas para manter compatibilidade
export {
  loginResponseSchema,
  registrationDataSchema,
  registrationResponseSchema,
  apiErrorResponseSchema,
  profileUpdateDataSchema,
  updateProfileResponseSchema,
  deleteAccountResponseSchema,
  fetchOffersResponseSchema,
  offerMutationResponseSchema,
  contratacaoResponseSchema,
  fetchContratacoesResponseSchema
};

// Define getProfileResponseSchema como userSchema para manter compatibilidade
export const getProfileResponseSchema = userSchema;

// Re-exporta os tipos inferidos para manter compatibilidade
export type LoginResponse = LoginResponseSchemaType;
export type RegistrationData = z.infer<typeof registrationDataSchema>;
export type RegistrationResponse = RegistrationResponseSchemaType;
export type ApiErrorResponse = ApiErrorResponseSchemaType;
export type ProfileUpdateData = z.infer<typeof profileUpdateDataSchema>;
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;
export type UpdateProfileResponse = UpdateProfileResponseSchemaType;
export type DeleteAccountResponse = DeleteAccountResponseSchemaType;
export type FetchOffersResponse = FetchOffersResponseSchemaType;
export type OfferMutationResponse = OfferMutationResponseSchemaType;
export type ContratacaoResponse = ContratacaoResponseSchemaType;
export type FetchContratacoesResponse = FetchContratacoesResponseSchemaType;
