// src/types/api.ts

// Importa os tipos de usuário do arquivo vizinho
import { User, UserRole, TipoUsuarioEnum } from './user';
import { Offer } from './offer'; // Importa Offer
import { Contratacao} from './contratacao'; // Importar Contratacao

// --- Tipos Relacionados à Autenticação ---

/** Dados enviados no corpo da requisição de login */
// (Não estritamente necessário como interface separada, mas pode ser útil)
// export interface LoginCredentials {
//   email: string;
//   senha: string;
// }

/** Resposta esperada da API de login em caso de sucesso */
export interface LoginResponse {
  user: User;    // O objeto do usuário retornado
  token: string; // O token JWT
  message?: string; // Mensagem opcional de sucesso
}

/** Dados enviados no corpo da requisição de registro */
export interface RegistrationData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cpfCnpj: string;
  tipoUsuario: TipoUsuarioEnum; // Usa o tipo TipoUsuarioEnum importado
  endereco?: string;
  foto?: string;
}

/** Resposta esperada da API de registro em caso de sucesso */
export interface RegistrationResponse {
  message: string;
  // user?: User; // Descomente se a API retornar o usuário criado
}

// --- Tipos Gerais de API ---

/** Estrutura comum para respostas de erro da API */
export interface ApiErrorResponse {
  message: string; // Mensagem de erro vinda do backend
  // statusCode?: number; // Opcional: código de status interno da API
  errorCode?: string;  // Código de erro específico para tratamento mais robusto
}

// --- Adicione outros tipos de API aqui ---
// Exemplo: Tipos para Ofertas de Serviço
// export interface Offer { ... }
// export interface OfferResponse { offers: Offer[]; }
// export interface CreateOfferData { ... }
/** Dados que podem ser enviados para atualizar o perfil */
export interface ProfileUpdateData {
  idUsuario?: string; // Identificador único do usuário
  id?: string;      // Identificador alternativo que pode vir da API
  nome?: string;
  email?: string; // É seguro permitir atualização de email? Depende das regras do backend
  telefone?: string;
  cpfCnpj?: string;
  endereco?: string;
  foto?: string;
  // Adicione outros campos atualizáveis conforme necessário
}

/** Resposta esperada da API ao buscar o perfil (GET /profile) */
// Frequentemente retorna o objeto User (talvez sem o token)
// Vamos assumir que retorna o objeto User completo para consistência com AuthContext
export type GetProfileResponse = User;

/** Resposta esperada da API ao atualizar o perfil (PUT /profile) */
export interface UpdateProfileResponse {
  message: string;
  user?: User; // A API PODE retornar o usuário atualizado
}

/** Resposta esperada da API ao excluir a conta (DELETE /profile) */
export interface DeleteAccountResponse {
  message: string;
}

// ... (outros tipos de API) ...

// --- Tipos de API para Ofertas ---

/** Resposta da API ao buscar lista de ofertas */
export interface FetchOffersResponse {
  offers: Offer[];
  total?: number; // Para paginação
  page?: number; // Para paginação
  // ... outros metadados
}

/** Resposta da API ao criar/atualizar uma oferta */
export interface OfferMutationResponse {
  message: string; 
  success: boolean;
  offer?: Offer; // Pode retornar a oferta criada/atualizada
}

// --- Tipos de API para Contratação ---

/** Resposta da API ao criar uma contratação */
export interface ContratacaoResponse {
  message: string;
  contratacao?: Contratacao; // Pode retornar a contratação criada
}

/** Resposta da API ao buscar lista de contratações (ex: para dashboards) */
export interface FetchContratacoesResponse {
  contratacoes: Contratacao[];
  total?: number;
  page?: number;
  // ... metadados de paginação ...
}
// Opcional: Parâmetros para filtrar busca de contratações
/*
import { ContratacaoStatus } from '../types/contratacao';
export interface FetchContratacoesParams {
    status?: ContratacaoStatus[];
    page?: number;
    limit?: number;
    // outros filtros...
}
*/
