/**
 * @deprecated Este arquivo está mantido apenas para compatibilidade.
 * Importe os schemas diretamente de '../schemas/api.schema.ts' e '../schemas/user.schema.ts'.
 * 
 * Este arquivo serve como um ponto central de re-exportação de schemas e tipos
 * definidos em outros arquivos, facilitando a migração gradual para a nova estrutura.
 */

import { z } from 'zod'; // Importa a biblioteca Zod para validação de esquemas

// Importa schemas de api.schema.ts
// Estes schemas são utilizados para validar as respostas da API
import {
  loginResponseSchema,       // Schema para validar resposta de login
  registrationResponseSchema, // Schema para validar resposta de registro
  apiErrorResponseSchema,     // Schema para validar erros da API
  updateProfileResponseSchema, // Schema para validar resposta de atualização de perfil
  deleteAccountResponseSchema, // Schema para validar resposta de exclusão de conta
  fetchOffersResponseSchema,   // Schema para validar resposta de busca de ofertas
  offerMutationResponseSchema, // Schema para validar resposta de mutação de ofertas
  contratacaoResponseSchema,   // Schema para validar resposta de contratação
  fetchContratacoesResponseSchema, // Schema para validar resposta de busca de contratações

  // Tipos inferidos dos schemas acima
  // Estes tipos são gerados automaticamente a partir dos schemas
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
// Estes schemas são utilizados para validar dados relacionados ao usuário
import {
  userSchema,                // Schema para validar dados do usuário
  registrationDataSchema,    // Schema para validar dados de registro
  profileUpdateDataSchema    // Schema para validar dados de atualização de perfil
} from '../schemas/user.schema';

// Re-exporta os schemas para manter compatibilidade
// Esta seção disponibiliza os schemas importados para outros módulos que ainda utilizam este arquivo
export {
  loginResponseSchema,        // Schema de resposta de login
  registrationDataSchema,     // Schema de dados de registro
  registrationResponseSchema, // Schema de resposta de registro
  apiErrorResponseSchema,     // Schema de resposta de erro da API
  profileUpdateDataSchema,    // Schema de dados de atualização de perfil
  updateProfileResponseSchema, // Schema de resposta de atualização de perfil
  deleteAccountResponseSchema, // Schema de resposta de exclusão de conta
  fetchOffersResponseSchema,   // Schema de resposta de busca de ofertas
  offerMutationResponseSchema, // Schema de resposta de mutação de ofertas
  contratacaoResponseSchema,   // Schema de resposta de contratação
  fetchContratacoesResponseSchema // Schema de resposta de busca de contratações
};

// Define getProfileResponseSchema como userSchema para manter compatibilidade
// Este schema é utilizado para validar a resposta da API ao buscar o perfil do usuário
export const getProfileResponseSchema = userSchema;

// Re-exporta os tipos inferidos para manter compatibilidade
// Esta seção define tipos TypeScript baseados nos schemas para uso em toda a aplicação
export type LoginResponse = LoginResponseSchemaType; // Tipo para resposta de login
export type RegistrationData = z.infer<typeof registrationDataSchema>; // Tipo para dados de registro
export type RegistrationResponse = RegistrationResponseSchemaType; // Tipo para resposta de registro
export type ApiErrorResponse = ApiErrorResponseSchemaType; // Tipo para resposta de erro da API
export type ProfileUpdateData = z.infer<typeof profileUpdateDataSchema>; // Tipo para dados de atualização de perfil
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>; // Tipo para resposta de busca de perfil
export type UpdateProfileResponse = UpdateProfileResponseSchemaType; // Tipo para resposta de atualização de perfil
export type DeleteAccountResponse = DeleteAccountResponseSchemaType; // Tipo para resposta de exclusão de conta
export type FetchOffersResponse = FetchOffersResponseSchemaType; // Tipo para resposta de busca de ofertas
export type OfferMutationResponse = OfferMutationResponseSchemaType; // Tipo para resposta de mutação de ofertas
export type ContratacaoResponse = ContratacaoResponseSchemaType; // Tipo para resposta de contratação
export type FetchContratacoesResponse = FetchContratacoesResponseSchemaType; // Tipo para resposta de busca de contratações
