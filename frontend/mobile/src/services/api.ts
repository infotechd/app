// src/services/api.ts
// Importa tipos específicos da API
import {
  LoginResponse,
  ApiErrorResponse,
  RegistrationData,
  RegistrationResponse,
  GetProfileResponse,
  ProfileUpdateData,
  UpdateProfileResponse,
  DeleteAccountResponse,
  FetchOffersResponse,
  OfferMutationResponse,
  ContratacaoResponse,
  FetchContratacoesResponse
} from '../types/api';

import {
  Training,
  TrainingCreateData,
  FetchTrainingDetailResponse,
  FetchTrainingsResponse,
  TrainingMutationResponse,
} from '../types/training';

import {
  Offer,
  OfferData,
  FetchOffersParams
} from '../types/offer';

import {
  Contratacao,
  ContratacaoData
} from '../types/contratacao';

// Importa schemas do Zod
import { loginResponseSchema, registrationResponseSchema, updateProfileResponseSchema, 
  deleteAccountResponseSchema, fetchOffersResponseSchema, offerMutationResponseSchema,
  contratacaoResponseSchema, fetchContratacoesResponseSchema } from '../schemas/api.schema';
import { loginCredentialsSchema, registrationDataSchema, profileUpdateDataSchema } from '../schemas/user.schema';
import { userSchema } from '../types/userSchema';
import { offerDataSchema, fetchOffersParamsSchema } from '../schemas/offer.schema';
import { contratacaoDataSchema, fetchContratacoesParamsSchema } from '../schemas/contratacao.schema';
import { validateWithZod, validateWithZodSafe, validateWithZodResult } from '../utils/validation';

import { PaymentData, PaymentResponse } from '../types/pagamento';
import { ReviewData, ReviewResponse } from '../types/avaliacao';
import { CurriculoData, CurriculoResponse, Curriculo } from '../types/curriculo';

import {
  Agenda,
  FetchAgendaResponse,
  UpdateCompromissoStatusData,
  UpdateAgendaResponse,
  CompromissoStatus
} from '../types/agenda';

import { FetchAdsResponse } from '../types/ad';

import {
  Publicacao,
  PublicacaoData,
  FetchPublicacoesResponse,
  CreatePublicacaoResponse,
} from '../types/publicacao';

import {
  Notificacao,
  FetchNotificacoesResponse,
  NotificacaoActionResponse
} from '../types/notificacao';

import {
  Negociacao,
  NegociacaoInitiateData,
  NegociacaoRespondData,
  NegociacaoResponse
} from '../types/negociacao';

import {
  Relatorio,
  FetchRelatorioResponse
} from '../types/relatorio';

import axios from 'axios';
import { API_URL } from "../config/api";

// Interface para resposta de detalhes de uma oferta
export interface FetchOfferDetailResponse {
  success?: boolean;
  offer?: Offer;
  message?: string;
}

// --- Utilitários do Cliente API ---

/**
 * Interface para opções de requisição da API
 */
interface ApiRequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  retries?: number;
  delay?: number;
}

/**
 * Interface para resposta da API
 */
interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Verifica se o ambiente é um ambiente de teste
 */
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Verifica a conectividade de rede
 * @returns Promise que é resolvida se a conectividade estiver disponível
 */
const checkConnectivity = async (): Promise<void> => {
  if (isTestEnvironment()) {
    return; // Pula a verificação de conectividade em ambiente de teste
  }

  try {
    console.log('Verificando conectividade de rede...');
    await axios.head('https://www.google.com', { timeout: 5000 });
    console.log('✓ Conectividade com internet confirmada');
  } catch (error) {
    console.error('✗ Falha na verificação de conectividade:', error);
    // Continua mesmo se a verificação de conectividade falhar
  }
};

/**
 * Constrói uma URL com parâmetros de consulta
 * @param baseUrl - A URL base
 * @param params - Os parâmetros de consulta
 * @returns A URL completa com parâmetros de consulta
 */
const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) {
    return baseUrl;
  }

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => queryParams.append(key, String(item)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Analisa a resposta da API
 * @param response - O objeto Response do fetch
 * @returns Promise que é resolvida com os dados analisados
 * @throws Erro se a resposta não puder ser analisada
 */
const parseResponse = async <T>(response: Response): Promise<T> => {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text() as unknown as T;
    }
  } catch (error) {
    console.error('Erro ao analisar resposta:', error);
    throw new Error('Erro ao processar resposta da API');
  }
};

/**
 * Classe de erro personalizada para erros da API que inclui um código de erro
 */
export class ApiError extends Error {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
  }
}

/**
 * Trata erros da API
 * @param response - O objeto Response do fetch
 * @returns Promise que é resolvida com os dados do erro
 */
const handleApiError = async (response: Response): Promise<never> => {
  let errorData: ApiErrorResponse | null = null;

  try {
    errorData = await response.json();
  } catch (e) {
    // Ignora erro de análise
  }

  const errorMessage = errorData?.message || `Erro na API: ${response.status} ${response.statusText}`;
  const errorCode = errorData?.errorCode;

  throw new ApiError(errorMessage, errorCode);
};

/**
 * Faz uma requisição à API com lógica de novas tentativas
 * @param url - A URL para buscar
 * @param options - As opções da requisição
 * @returns Promise que é resolvida com a resposta
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = 3, 
  delay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Se for um 404, podemos querer tentar novamente
      if (response.status === 404) {
        // Na última tentativa, retorna a resposta 404
        if (attempt === retries) {
          return response;
        }
        // Caso contrário, espera e tenta novamente
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Para outras respostas, retorna imediatamente
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Na última tentativa, lança o erro
      if (attempt === retries) {
        throw lastError;
      }

      // Caso contrário, espera e tenta novamente
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Isso nunca deveria acontecer devido ao lançamento de erro no loop
  throw lastError || new Error('Erro desconhecido em fetchWithRetry');
}

/**
 * Faz uma requisição à API
 * @param endpoint - O endpoint da API
 * @param options - As opções da requisição
 * @returns Promise que é resolvida com os dados da resposta
 */
async function apiRequest<T>(endpoint: string, options: ApiRequestOptions): Promise<T> {
  const url = buildUrl(`${API_URL}${endpoint}`);

  // Prepara os cabeçalhos
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...options.headers || {}
  };

  // Adiciona cabeçalho Content-Type se o corpo estiver presente
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Adiciona cabeçalho Authorization se o token estiver presente
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  // Prepara opções da requisição
  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  // Adiciona corpo se estiver presente
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Faz a requisição
  const response = await fetchWithRetry(
    url, 
    fetchOptions, 
    options.retries || 3, 
    options.delay || 1000
  );

  // Trata respostas de erro
  if (!response.ok) {
    return handleApiError(response);
  }

  // Analisa e retorna a resposta
  return parseResponse<T>(response);
}
// --- Funções da API ---

/**
 * Realiza a chamada de API para autenticar o usuário.
 * @param email - O email do usuário.
 * @param senha - A senha do usuário.
 * @returns Uma Promise que resolve com os dados do usuário e token em caso de sucesso.
 * @throws Lança um erro com a mensagem do backend em caso de falha na autenticação ou erro de rede.
 */
export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    console.log('=== INICIANDO TENTATIVA DE LOGIN ===');
    console.log(`Email sendo usado: ${email}`);

    // Validar credenciais de login com Zod
    const credentials = validateWithZod(loginCredentialsSchema, { email, senha });

    // Verificar conectividade
    await checkConnectivity();

    console.log('Enviando requisição de login...');

    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
      retries: 3,
      delay: 1000
    });

    // Adiciona o token ao objeto user antes da validação
    // Isso é necessário porque o backend envia o token separadamente,
    // mas o schema espera que o token esteja dentro do objeto user
    if (response.token && response.user) {
      response.user.token = response.token;
    }

    // Validar resposta com Zod
    const data = validateWithZod(loginResponseSchema, response);

    console.log('✓ Login realizado com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO NO LOGIN ===', error);

    // Repassar o erro original ou criar um novo com mensagem mais amigável
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido no login');
    }
  }
};

/**
 * Realiza a chamada de API para registrar um novo usuário.
 * @param userData - Os dados do usuário para registro.
 * @returns Uma Promise que resolve com a mensagem de sucesso.
 * @throws Lança um erro com a mensagem do backend em caso de falha no registro ou erro de rede.
 */
export const register = async (userData: RegistrationData): Promise<RegistrationResponse> => {
  try {
    console.log('=== INICIANDO REGISTRO DE USUÁRIO ===');

    // Validar dados de registro com Zod
    const validatedUserData = validateWithZod(registrationDataSchema, userData);

    // Verificar conectividade
    await checkConnectivity();

    const response = await apiRequest<RegistrationResponse>('/auth/register', {
      method: 'POST',
      body: validatedUserData
    });

    // Validar resposta com Zod
    const data = validateWithZod(registrationResponseSchema, response);

    console.log('✓ Registro realizado com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO NO REGISTRO ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido no registro');
    }
  }
};

// --- Funções de Gerenciamento de Perfil ---

/**
 * Busca os dados do perfil do usuário autenticado.
 * @param token - O token JWT do usuário autenticado.
 * @returns Uma Promise que resolve com os dados do perfil (User).
 * @throws Lança um erro em caso de falha.
 */
export const getProfile = async (token: string): Promise<GetProfileResponse> => {
  try {
    console.log('=== BUSCANDO PERFIL DO USUÁRIO ===');

    // Validar token
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }

    const response = await apiRequest<GetProfileResponse>('/auth/profile', {
      method: 'GET',
      token
    });

    // Validar resposta com Zod (GetProfileResponse é um User)
    const data = validateWithZod(userSchema, response);

    console.log('✓ Perfil obtido com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO BUSCAR PERFIL ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao buscar perfil');
    }
  }
};

/**
 * Atualiza os dados do perfil do usuário autenticado.
 * @param token - O token JWT do usuário autenticado.
 * @param profileData - Um objeto contendo os campos a serem atualizados.
 * @returns Uma Promise que resolve com a mensagem de sucesso (e opcionalmente o usuário atualizado).
 * @throws Lança um erro em caso de falha.
 */
export const updateProfile = async (token: string, profileData: ProfileUpdateData): Promise<UpdateProfileResponse> => {
  try {
    console.log('=== ATUALIZANDO PERFIL DO USUÁRIO ===');

    // Validar token
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }

    // Validar dados do perfil com Zod
    console.log('Dados do perfil recebidos para atualização:', JSON.stringify(profileData, null, 2));
    const validatedProfileData = validateWithZod(profileUpdateDataSchema, profileData);
    console.log('Dados do perfil validados:', JSON.stringify(validatedProfileData, null, 2));

    // Verificar se o email está sendo alterado - isso não deve ser permitido aqui
    // Use a função requestEmailChange para alterar o email com verificação de segurança
    if (validatedProfileData.email) {
      console.warn('Tentativa de atualizar email através da função updateProfile. Use requestEmailChange para isso.');
      delete validatedProfileData.email;
    }

    // Verificar se a foto está sendo atualizada
    if (validatedProfileData.foto) {
      console.log('URL da foto a ser atualizada:', validatedProfileData.foto);
    } else {
      console.warn('Nenhuma URL de foto fornecida para atualização');
    }

    const response = await apiRequest<UpdateProfileResponse>('/auth/profile', {
      method: 'PUT',
      token,
      body: validatedProfileData
    });

    // Validar resposta com Zod
    console.log('Resposta recebida do servidor:', JSON.stringify(response, null, 2));
    const data = validateWithZod(updateProfileResponseSchema, response);
    console.log('Resposta validada:', JSON.stringify(data, null, 2));

    // Verificar se a resposta contém os dados do usuário atualizados
    if (data.user) {
      console.log('Dados do usuário retornados pelo servidor:', JSON.stringify(data.user, null, 2));
      if (data.user.foto) {
        console.log('URL da foto atualizada retornada pelo servidor:', data.user.foto);
      } else {
        console.warn('Servidor não retornou URL da foto no objeto do usuário');
      }
    } else {
      console.warn('Servidor não retornou dados do usuário na resposta');
    }

    console.log('✓ Perfil atualizado com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO ATUALIZAR PERFIL ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao atualizar perfil');
    }
  }
};

/**
 * Interface para os dados necessários para solicitar uma alteração de email
 */
export interface EmailChangeRequest {
  currentPassword: string;
  newEmail: string;
}

/**
 * Interface para a resposta da solicitação de alteração de email
 */
export interface EmailChangeResponse {
  message: string;
  success: boolean;
}

/**
 * Solicita uma alteração de email com verificação de segurança.
 * Requer a senha atual do usuário e envia um email de verificação para o novo endereço.
 * 
 * @param token - O token JWT do usuário autenticado.
 * @param data - Objeto contendo a senha atual e o novo email.
 * @returns Uma Promise que resolve com a mensagem de sucesso.
 * @throws Lança um erro em caso de falha.
 */
/**
 * Códigos de erro específicos para a funcionalidade de alteração de email
 */
export enum EmailChangeErrorCode {
  INVALID_TOKEN = 'EMAIL_CHANGE_INVALID_TOKEN',
  MISSING_FIELDS = 'EMAIL_CHANGE_MISSING_FIELDS',
  INVALID_EMAIL_FORMAT = 'EMAIL_CHANGE_INVALID_EMAIL_FORMAT',
  INCORRECT_PASSWORD = 'EMAIL_CHANGE_INCORRECT_PASSWORD',
  EMAIL_IN_USE = 'EMAIL_CHANGE_EMAIL_IN_USE',
  FEATURE_UNAVAILABLE = 'EMAIL_CHANGE_FEATURE_UNAVAILABLE',
  UNKNOWN_ERROR = 'EMAIL_CHANGE_UNKNOWN_ERROR'
}

export const requestEmailChange = async (token: string, data: EmailChangeRequest): Promise<EmailChangeResponse> => {
  try {
    console.log('=== SOLICITANDO ALTERAÇÃO DE EMAIL ===');

    // Validar token
    if (!token || typeof token !== 'string') {
      throw new ApiError('Token inválido', EmailChangeErrorCode.INVALID_TOKEN);
    }

    // Validar dados básicos
    if (!data.currentPassword || !data.newEmail) {
      throw new ApiError('Senha atual e novo email são obrigatórios', EmailChangeErrorCode.MISSING_FIELDS);
    }

    // Validar formato do email básico no cliente antes de enviar ao servidor
    if (!/\S+@\S+\.\S+/.test(data.newEmail)) {
      throw new ApiError('Formato de email inválido', EmailChangeErrorCode.INVALID_EMAIL_FORMAT);
    }

    // Nota: As validações de senha e verificação de email já existente 
    // agora são realizadas no backend

    // Endpoint agora implementado no backend
    console.log('✓ Enviando solicitação de alteração de email para o backend');

    const response = await apiRequest<EmailChangeResponse>('/auth/change-email', {
      method: 'POST',
      token,
      body: {
        currentPassword: data.currentPassword,
        newEmail: data.newEmail
      }
    });

    console.log('✓ Solicitação de alteração de email enviada com sucesso!');
    return {
      message: response.message || 'Email alterado com sucesso.',
      success: true
    };
  } catch (error) {
    console.error('=== ERRO AO SOLICITAR ALTERAÇÃO DE EMAIL ===', error);

    if (error instanceof ApiError) {
      // Se já é um ApiError, apenas repassa
      throw error;
    } else if (error instanceof Error) {
      // Converte Error comum para ApiError com código genérico
      throw new ApiError(error.message, EmailChangeErrorCode.UNKNOWN_ERROR);
    } else {
      // Erro desconhecido
      throw new ApiError('Erro desconhecido ao solicitar alteração de email', EmailChangeErrorCode.UNKNOWN_ERROR);
    }
  }
};

/**
 * Exclui a conta do usuário autenticado.
 * @param token - O token JWT do usuário autenticado.
 * @returns Uma Promise que resolve com a mensagem de sucesso.
 * @throws Lança um erro em caso de falha.
 */
export const deleteAccount = async (token: string): Promise<DeleteAccountResponse> => {
  try {
    console.log('=== EXCLUINDO CONTA DO USUÁRIO ===');

    // Validar token
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }

    const response = await apiRequest<DeleteAccountResponse>('/auth/profile', {
      method: 'DELETE',
      token
    });

    // Validar resposta com Zod
    const data = validateWithZod(deleteAccountResponseSchema, response);

    console.log('✓ Conta excluída com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO EXCLUIR CONTA ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao excluir conta');
    }
  }
};

// --- Funções da API de Treinamentos ---

/**
 * Busca a lista de treinamentos publicados.
 * Assume acesso público, sem necessidade de token.
 * @returns Uma Promise que resolve com a lista de treinamentos.
 * @throws Lança um erro em caso de falha.
 */
export const fetchTrainings = async (): Promise<FetchTrainingsResponse> => {
  try {
    console.log('=== BUSCANDO TREINAMENTOS ===');

    const data = await apiRequest<FetchTrainingsResponse>('/treinamentos', {
      method: 'GET'
    });

    // Validação da resposta
    if (!data || !Array.isArray(data.trainings)) {
      console.error("API fetchTrainings: Resposta inválida", data);
      throw new Error("Resposta inválida da API ao buscar treinamentos.");
    }

    console.log(`✓ ${data.trainings.length} treinamentos obtidos com sucesso!`);
    return data;
  } catch (error) {
    console.error('=== ERRO AO BUSCAR TREINAMENTOS ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao buscar treinamentos');
    }
  }
};

/**
 * Busca os detalhes de um treinamento específico pelo ID.
 * Assume acesso público.
 * @param id - O ID do treinamento a ser buscado.
 * @returns Uma Promise que resolve com os detalhes do treinamento.
 * @throws Lança um erro em caso de falha.
 */
export const fetchTrainingDetail = async (id: string): Promise<FetchTrainingDetailResponse> => {
  try {
    if (!id) {
      throw new Error("ID do treinamento é obrigatório.");
    }

    console.log(`=== BUSCANDO DETALHES DO TREINAMENTO ${id} ===`);

    const data = await apiRequest<FetchTrainingDetailResponse>(`/treinamentos/${id}`, {
      method: 'GET'
    });

    // Validação da resposta
    if (!data || !data.treinamento) {
      console.error("API fetchTrainingDetail: Resposta inválida", data);
      throw new Error("Resposta inválida da API ao buscar detalhes do treinamento.");
    }

    console.log('✓ Detalhes do treinamento obtidos com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO BUSCAR DETALHES DO TREINAMENTO ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao buscar detalhes do treinamento');
    }
  }
};

/**
 * Cria um novo treinamento. Requer autenticação (token).
 * @param token - O token JWT do usuário (Advertiser) autenticado.
 * @param trainingData - Os dados do treinamento a ser criado.
 * @returns Uma Promise que resolve com a mensagem de sucesso e/ou o treinamento criado.
 * @throws Lança um erro em caso de falha.
 */
export const createTraining = async (token: string, trainingData: TrainingCreateData): Promise<TrainingMutationResponse> => {
  try {
    console.log('=== CRIANDO NOVO TREINAMENTO ===');

    const data = await apiRequest<TrainingMutationResponse>('/treinamentos', {
      method: 'POST',
      token,
      body: trainingData
    });

    // Validação da resposta
    if (!data.message) {
      console.error("API createTraining: Resposta inválida", data);
      throw new Error("Resposta inválida da API após criar treinamento.");
    }

    console.log('✓ Treinamento criado com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO CRIAR TREINAMENTO ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao criar treinamento');
    }
  }
};


// --- Opcional: Adicionar updateTraining e deleteTraining se necessário ---
/*
export const updateTraining = async (token: string, id: string, trainingData: TrainingUpdateData): Promise<TrainingMutationResponse> => {
   // Implementação similar ao create, usando PUT e a rota /treinamento/:id
}

export const deleteTraining = async (token: string, id: string): Promise<{ message: string }> => {
  // Implementação similar, usando DELETE e a rota /treinamento/:id
}
*/

// src/services/api.ts

// ... (constante API_URL, funções existentes: login, register, profile, training) ...


// --- Funções da API de Ofertas de Serviço ---

/**
 * Busca ofertas com autenticação com base em filtros/parâmetros.
 * Usado pela tela BuscarOfertasScreen quando o usuário está logado.
 * @param token - Token JWT do usuário autenticado.
 * @param params - Objeto contendo os parâmetros de busca (texto, precoMax, etc.).
 * @returns Promise resolvendo com a lista de ofertas encontradas.
 */
export const fetchAuthenticatedOffers = async (token: string, params?: FetchOffersParams): Promise<FetchOffersResponse> => {
  // Constrói a query string a partir dos parâmetros
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Trata array de categorias (exemplo)
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
  }
  const queryString = queryParams.toString();

  // Constrói a URL correta para o endpoint de busca
  const url = `${API_URL}/ofertas/search${queryString ? `?${queryString}` : ''}`;

  const options = {
    method: 'GET',
    headers: { 
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };

  // Faz a requisição para o endpoint
  let response = await fetchWithRetry(url, options);

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }

    // Se for 404, fornece uma mensagem mais amigável
    if (response.status === 404) {
      console.log('Ambos os endpoints de busca falharam com 404. Retornando lista vazia.');
      // Retorna uma lista vazia em vez de lançar erro
      return { offers: [] };
    }

    throw new Error(errorData?.message || `Erro ao buscar ofertas autenticadas: ${response.status}`);
  }

  try {
    const data = await response.json();

    // Verifica se a resposta contém 'ofertas' (backend) ou 'offers' (frontend)
    if (data.ofertas && Array.isArray(data.ofertas)) {
      // Mapeia 'ofertas' para 'offers' para compatibilidade
      return { offers: data.ofertas };
    } else if (data.offers && Array.isArray(data.offers)) {
      // Já está no formato esperado
      return data;
    } else {
      console.warn("Resposta da API não contém array de ofertas autenticadas. Retornando lista vazia.");
      return { offers: [] };
    }
  } catch (parseError) {
    console.error("API fetchAuthenticatedOffers: Falha ao parsear resposta de sucesso", parseError);
    // Retorna lista vazia em vez de lançar erro
    return { offers: [] };
  }
};

/**
 * Busca ofertas públicas com base em filtros/parâmetros.
 * Usado pela tela BuscarOfertasScreen. Não requer token.
 * @param params - Objeto contendo os parâmetros de busca (texto, precoMax, etc.).
 * @returns Promise resolvendo com a lista de ofertas encontradas.
 */
export const fetchPublicOffers = async (params?: FetchOffersParams): Promise<FetchOffersResponse> => {
  // Constrói a query string a partir dos parâmetros
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Trata array de categorias (exemplo)
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
  }
  const queryString = queryParams.toString();

  // Constrói a URL correta para o endpoint de busca
  const url = `${API_URL}/ofertas/search${queryString ? `?${queryString}` : ''}`;

  const options = {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  };

  // Faz a requisição para o endpoint
  let response = await fetchWithRetry(url, options);

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }

    // Se for 404, fornece uma mensagem mais amigável
    if (response.status === 404) {
      console.log('Ambos os endpoints de busca falharam com 404. Retornando lista vazia.');
      // Retorna uma lista vazia em vez de lançar erro
      return { offers: [] };
    }

    throw new Error(errorData?.message || `Erro ao buscar ofertas públicas: ${response.status}`);
  }

  try {
    const data = await response.json();

    // Verifica se a resposta contém 'ofertas' (backend) ou 'offers' (frontend)
    if (data.ofertas && Array.isArray(data.ofertas)) {
      // Mapeia 'ofertas' para 'offers' para compatibilidade
      return { offers: data.ofertas };
    } else if (data.offers && Array.isArray(data.offers)) {
      // Já está no formato esperado
      return data;
    } else {
      console.warn("Resposta da API não contém array de ofertas públicas. Retornando lista vazia.");
      return { offers: [] };
    }
  } catch (parseError) {
    console.error("API fetchPublicOffers: Falha ao parsear resposta de sucesso", parseError);
    // Retorna lista vazia em vez de lançar erro
    return { offers: [] };
  }
};

/**
 * Busca as ofertas criadas pelo Prestador autenticado.
 * Usado pela tela OfertaServicoScreen. Requer token.
 * @param token - Token JWT do Prestador.
 * @param params - Filtros opcionais (ex: status).
 * @returns Promise resolvendo com a lista de ofertas do prestador.
 */
export const fetchMyOffers = async (token: string, params?: FetchOffersParams): Promise<FetchOffersResponse> => {
  // Constrói a query string (se houver filtros)
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) queryParams.append(key, String(value));
    });
  }
  const queryString = queryParams.toString();

  // Tenta ambos os endpoints possíveis para maior robustez
  const primaryUrl = `${API_URL}/ofertas/my-offers${queryString ? `?${queryString}` : ''}`;
  const fallbackUrl = `${API_URL}/oferta/my-offers${queryString ? `?${queryString}` : ''}`;

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  };

  // Tenta com o endpoint primário primeiro
  let response = await fetchWithRetry(primaryUrl, options);

  // Se ainda for 404 após as tentativas, tenta o endpoint alternativo
  if (response.status === 404) {
    console.log('Endpoint primário falhou, tentando endpoint alternativo...');
    response = await fetchWithRetry(fallbackUrl, options);
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }

    // Se for 404, fornece uma mensagem mais amigável
    if (response.status === 404) {
      console.log('Ambos os endpoints falharam com 404. Retornando lista vazia.');
      // Retorna uma lista vazia em vez de lançar erro
      return { offers: [] };
    }

    throw new Error(errorData?.message || `Erro ao buscar minhas ofertas: ${response.status}`);
  }

  try {
    const data: FetchOffersResponse = await response.json();
    // A tela original esperava data.ofertas, então vamos manter isso
    if (!data || !Array.isArray(data.offers)) {
      // Se a API retornar diretamente o array, ajuste: setOfertas(data) e o tipo de retorno
      console.warn("Resposta da API não contém array de ofertas. Retornando lista vazia.");
      return { offers: [] };
    }
    return data; // Retorna { offers: Offer[] }
  } catch (parseError) {
    console.error("API fetchMyOffers: Falha ao parsear resposta de sucesso", parseError);
    // Retorna lista vazia em vez de lançar erro
    return { offers: [] };
  }
};

/**
 * Cria uma nova oferta de serviço. Requer token do Prestador.
 * @param token - Token JWT do Prestador.
 * @param offerData - Dados da oferta a ser criada.
 * @returns Promise resolvendo com a mensagem e/ou oferta criada.
 */
export const createOffer = async (token: string, offerData: OfferData): Promise<OfferMutationResponse> => {
  let validatedOfferData: OfferData;

  try {
    // Validar os dados da oferta contra o schema antes de enviar
    // Isso garante que todos os campos obrigatórios estejam presentes e válidos
    validatedOfferData = validateWithZod(offerDataSchema, offerData);
  } catch (validationError) {
    // Se a validação falhar, retorna um erro detalhado
    console.error("Erro de validação ao criar oferta:", validationError);
    throw new Error(`Erro de validação: ${(validationError as Error).message}`);
  }

  // Tenta ambos os endpoints possíveis para maior robustez
  const primaryUrl = `${API_URL}/ofertas`;
  const fallbackUrl = `${API_URL}/oferta`;

  // Garantir que o status seja explicitamente definido no payload
  // Isso resolve o problema de ofertas sempre sendo salvas como rascunho
  // Forçar o status para 'ready' se não for explicitamente 'draft'
  const offerDataWithExplicitStatus = {
    ...validatedOfferData,
    status: validatedOfferData.status === 'draft' ? 'draft' : 'ready' // Força 'ready' a menos que seja explicitamente 'draft'
  };

  console.log('Criando oferta com status:', offerDataWithExplicitStatus.status);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(offerDataWithExplicitStatus),
  };

  // Tenta com o endpoint primário primeiro
  let response = await fetchWithRetry(primaryUrl, options);

  // Se ainda for 404 após as tentativas, tenta o endpoint alternativo
  if (response.status === 404) {
    console.log('Endpoint primário para criar oferta falhou, tentando endpoint alternativo...');
    response = await fetchWithRetry(fallbackUrl, options);
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }

    // Se for 404, fornece uma mensagem mais amigável
    if (response.status === 404) {
      console.log('Ambos os endpoints para criar oferta falharam com 404.');
      throw new Error("Serviço de criação de ofertas indisponível no momento. Tente novamente mais tarde.");
    }

    throw new Error(errorData?.message || `Erro ao criar oferta: ${response.status}`);
  }

  try {
    const data = await response.json();
    // Verifica se a resposta contém os campos necessários
    if (!data.message || data.success === undefined) {
      console.warn("Resposta da API não contém campos necessários após criar oferta:", data);
      // Retorna uma resposta padrão em vez de lançar erro
      return { 
        message: data.message || "Oferta criada com sucesso", 
        success: data.success !== undefined ? data.success : true 
      };
    }
    return data as OfferMutationResponse;
  } catch (parseError) {
    console.error("API createOffer: Falha ao parsear resposta de sucesso", parseError);
    // Retorna uma resposta padrão em vez de lançar erro
    return { message: "Oferta possivelmente criada, mas houve um erro ao processar a resposta", success: true };
  }
};

// --- Opcional: Funções de Update e Delete para Ofertas ---
/**
 * Atualiza uma oferta existente. Requer token do Prestador.
 * @param token - Token JWT.
 * @param offerId - ID da oferta a ser atualizada.
 * @param offerUpdateData - Campos da oferta a serem atualizados.
 * @returns Promise resolvendo com a mensagem e/ou oferta atualizada.
 */
export const updateOffer = async (token: string, offerId: string, offerUpdateData: Partial<OfferData>): Promise<OfferMutationResponse> => {
  // Para atualizações parciais, não validamos com o schema completo
  // pois nem todos os campos são obrigatórios em uma atualização
  // No entanto, validamos os campos que estão presentes para garantir que são válidos

  // Garantir que o status seja explicitamente definido no payload se estiver presente
  const dataToSend = {
    ...offerUpdateData,
    // Se status estiver presente, garantir que seja 'draft' ou 'ready'
    ...(offerUpdateData.status && {
      status: offerUpdateData.status === 'draft' ? 'draft' : 'ready'
    })
  };

  const response = await fetch(`${API_URL}/ofertas/${offerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(dataToSend),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao atualizar oferta ${offerId}: ${response.status}`);
  }
  try {
    const data: OfferMutationResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após atualizar oferta.");
    }
    return data;
  } catch (parseError) {
    console.error("API updateOffer: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (atualizar oferta).");
  }
};

/**
 * Exclui uma oferta. Requer token do Prestador.
 * @param token - Token JWT.
 * @param offerId - ID da oferta a ser excluída.
 * @returns Promise resolvendo com mensagem de sucesso.
 */
export const deleteOffer = async (token: string, offerId: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_URL}/ofertas/${offerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao excluir oferta ${offerId}: ${response.status}`);
  }
  try {
    // Assume que retorna apenas { message: string }
    const data: { message: string } = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após excluir oferta.");
    }
    return data;
  } catch (parseError) {
    console.error("API deleteOffer: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (excluir oferta).");
  }
};


// --- Função da API de Contratação ---

/**
 * Cria uma nova contratação para uma oferta. Requer token do Comprador.
 * @param token - Token JWT do Comprador.
 * @param contratacaoData - Dados da contratação (contém ofertaId).
 * @returns Promise resolvendo com a mensagem e/ou contratação criada.
 */
export const hireOffer = async (token: string, contratacaoData: ContratacaoData): Promise<ContratacaoResponse> => {
  const response = await fetch(`${API_URL}/contratacoes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(contratacaoData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao contratar oferta: ${response.status}`);
  }

  try {
    const data: ContratacaoResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após contratar oferta.");
    }
    return data;
  } catch (parseError) {
    console.error("API hireOffer: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (contratar oferta).");
  }
};

// Adicione aqui fetchMyContratacoes, updateContratacaoStatus, etc., conforme necessário

/**
 * Busca detalhes de uma oferta pública específica pelo ID.
 * Pode incluir autenticação opcional para usuários logados.
 * @param offerId - ID da oferta a ser buscada.
 * @param token - Token JWT opcional para usuários autenticados.
 * @returns Promise resolvendo com os detalhes da oferta.
 */
export const fetchPublicOfferById = async (offerId: string, token?: string): Promise<FetchOfferDetailResponse> => {
  // Tenta primeiro com o endpoint principal
  try {
    // Prepara os headers com ou sem token de autenticação
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Adiciona o token de autorização se fornecido
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/ofertas/public/${offerId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Se for 404, tenta com endpoint alternativo
      if (response.status === 404) {
        // Tenta com endpoint alternativo
        return await fetchPublicOfferByIdFallback(offerId, token);
      }

      let errorData: ApiErrorResponse | null = null;
      try { errorData = await response.json(); } catch (e) { /* Ignore */ }

      // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
      return {
        success: false,
        offer: undefined,
        message: errorData?.message || `Erro ao buscar detalhes da oferta ${offerId}: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      offer: data,
      message: 'Detalhes da oferta obtidos com sucesso'
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      // Se o erro for 404, tenta com endpoint alternativo
      return await fetchPublicOfferByIdFallback(offerId, token);
    }

    console.error("API fetchPublicOfferById: Erro na requisição", error);

    // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
    return {
      success: false,
      offer: undefined,
      message: error instanceof Error ? error.message : `Erro ao buscar detalhes da oferta ${offerId}`
    };
  }
};

// Função de fallback que tenta endpoints alternativos
const fetchPublicOfferByIdFallback = async (offerId: string, token?: string): Promise<FetchOfferDetailResponse> => {
  // Lista de endpoints alternativos para tentar
  const fallbackEndpoints = [
    `/oferta/public/${offerId}`,
    `/ofertas/${offerId}`,
    `/oferta/${offerId}`,
    // Adiciona endpoints que funcionam para usuários autenticados
    `/ofertas/${offerId}/details`,
    `/ofertas/${offerId}/public`
  ];

  let lastError: Error | null = null;

  // Tenta cada endpoint alternativo
  for (const endpoint of fallbackEndpoints) {
    try {
      // Prepara os headers com ou sem token de autenticação
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Adiciona o token de autorização se fornecido
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          offer: data,
          message: 'Detalhes da oferta obtidos com sucesso (endpoint alternativo)'
        };
      }

      let errorData: ApiErrorResponse | null = null;
      try { errorData = await response.json(); } catch (e) { /* Ignore */ }
      lastError = new Error(errorData?.message || `Erro ao buscar detalhes da oferta ${offerId}: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue; // Continua tentando outros endpoints
    }
  }

  // Se chegou aqui, todos os endpoints falharam
  console.error("API fetchPublicOfferById: Todos os endpoints falharam", lastError);

  // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
  // Isso permite que o componente OfferDetailScreen lide com o caso de oferta não encontrada
  return {
    success: false,
    offer: undefined,
    message: `Erro ao buscar detalhes da oferta ${offerId}, verifique se a oferta existe e está disponível`
  };
};

/**
 * Busca detalhes de uma oferta específica do prestador logado pelo ID.
 * Requer token do Prestador.
 * @param token - Token JWT do Prestador.
 * @param offerId - ID da oferta a ser buscada.
 * @returns Promise resolvendo com os detalhes da oferta.
 */
export const fetchMyOfferById = async (token: string, offerId: string): Promise<FetchOfferDetailResponse> => {
  // Tenta primeiro com o endpoint principal
  try {
    const response = await fetch(`${API_URL}/ofertas/${offerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Se for 404, tenta com endpoint alternativo
      if (response.status === 404) {
        // Tenta com endpoint alternativo
        return await fetchMyOfferByIdFallback(token, offerId);
      }

      let errorData: ApiErrorResponse | null = null;
      try { errorData = await response.json(); } catch (e) { /* Ignore */ }

      // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
      return {
        success: false,
        offer: undefined,
        message: errorData?.message || `Erro ao buscar detalhes da oferta ${offerId}: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      offer: data,
      message: 'Detalhes da oferta obtidos com sucesso'
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      // Se o erro for 404, tenta com endpoint alternativo
      return await fetchMyOfferByIdFallback(token, offerId);
    }

    console.error("API fetchMyOfferById: Erro na requisição", error);

    // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
    return {
      success: false,
      offer: undefined,
      message: error instanceof Error ? error.message : `Erro ao buscar detalhes da oferta ${offerId}`
    };
  }
};

// Função de fallback que tenta endpoints alternativos para ofertas do prestador
const fetchMyOfferByIdFallback = async (token: string, offerId: string): Promise<FetchOfferDetailResponse> => {
  // Lista de endpoints alternativos para tentar
  const fallbackEndpoints = [
    `/oferta/${offerId}`,
    `/ofertas/${offerId}/details`,
    `/ofertas/${offerId}/public`
  ];

  let lastError: Error | null = null;

  // Tenta cada endpoint alternativo
  for (const endpoint of fallbackEndpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          offer: data,
          message: 'Detalhes da oferta obtidos com sucesso (endpoint alternativo)'
        };
      }

      let errorData: ApiErrorResponse | null = null;
      try { errorData = await response.json(); } catch (e) { /* Ignore */ }
      lastError = new Error(errorData?.message || `Erro ao buscar detalhes da oferta ${offerId}: ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue; // Continua tentando outros endpoints
    }
  }

  // Se chegou aqui, todos os endpoints falharam
  console.error("API fetchMyOfferById: Todos os endpoints falharam", lastError);

  // Em vez de lançar um erro, retornamos um objeto de resposta com offer: undefined
  // Isso permite que o componente OfferDetailScreen lide com o caso de oferta não encontrada
  return {
    success: false,
    offer: undefined,
    message: `Oferta ${offerId} não encontrada`
  };
};

// --- Função da API de Pagamento ---
/**
 * Envia os dados de pagamento para processamento no backend.
 * @param token - Token JWT do usuário autenticado (Comprador).
 * @param paymentData - Dados do pagamento (contratacaoId, valor, metodo).
 * @returns Promise resolvendo com a resposta da API.
 * @throws Lança erro em caso de falha.
 */
export const processPayment = async (token: string, paymentData: PaymentData): Promise<PaymentResponse> => {
  const response = await fetch(`${API_URL}/pagamento`, { // Endpoint visto na tela original
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao processar pagamento: ${response.status}`);
  }

  try {
    const data: PaymentResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após processar pagamento.");
    }
    return data;
  } catch (parseError) {
    console.error("API processPayment: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (pagamento).");
  }
};

// --- Função da API de Avaliação ---
/**
 * Envia uma avaliação para um usuário específico.
 * @param token - Token JWT do usuário autenticado (avaliador).
 * @param reviewData - Dados da avaliação (receptorId, nota, comentario).
 * @returns Promise resolvendo com a resposta da API.
 * @throws Lança erro em caso de falha.
 */
export const submitReview = async (token: string, reviewData: ReviewData): Promise<ReviewResponse> => {
  const response = await fetch(`${API_URL}/avaliacao`, { // Endpoint visto na tela original
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao enviar avaliação: ${response.status}`);
  }

  try {
    const data: ReviewResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após enviar avaliação.");
    }
    return data;
  } catch (parseError) {
    console.error("API submitReview: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (avaliação).");
  }
};

// --- Função da API de Currículo ---

/**
 * Salva (cria ou atualiza) os dados do currículo do Prestador.
 * @param token - Token JWT do Prestador autenticado.
 * @param curriculoData - Dados do currículo a serem salvos.
 * @returns Promise resolvendo com a resposta da API.
 * @throws Lança erro em caso de falha.
 */
export const saveCurriculo = async (token: string, curriculoData: CurriculoData): Promise<CurriculoResponse> => {
  // Usando POST como no original (pode precisar ser PUT se a API diferenciar create/update)
  const response = await fetch(`${API_URL}/curriculo`, { // Endpoint visto na tela original
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(curriculoData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao salvar currículo: ${response.status}`);
  }

  try {
    const data: CurriculoResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após salvar currículo.");
    }
    return data;
  } catch (parseError) {
    console.error("API saveCurriculo: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (currículo).");
  }
};

/** Opcional: Função para buscar o currículo existente */
/*
export const getMyCurriculo = async (token: string): Promise<{ curriculo: Curriculo | null }> => {
  const response = await fetch(`${API_URL}/curriculo`, { // GET no mesmo endpoint? Verificar API
     method: 'GET',
     headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!response.ok) {
     if (response.status === 404) return { curriculo: null }; // Currículo não existe ainda
     let errorData: ApiErrorResponse | null = null;
     try { errorData = await response.json(); } catch (e) {}
     throw new Error(errorData?.message || `Erro ao buscar currículo: ${response.status}`);
  }
  try {
     // Assumindo que retorna { curriculo: Curriculo } ou { curriculo: null }
     const data: { curriculo: Curriculo | null } = await response.json();
     return data;
   } catch (parseError) {
     console.error("API getMyCurriculo: Falha ao parsear resposta", parseError);
     throw new Error("Erro ao processar resposta da API (buscar currículo).");
   }
}
*/

// --- Funções da API de Agenda ---

/** Busca a agenda do prestador autenticado. */
export const fetchAgenda = async (token: string): Promise<FetchAgendaResponse> => {
  const response = await fetch(`${API_URL}/agenda`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao buscar agenda: ${response.status}`);
  }

  try {
    const data: FetchAgendaResponse = await response.json();
    if (!data || !data.agenda) {
      throw new Error("Resposta inválida da API ao buscar agenda.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchAgenda: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (agenda).");
  }
};

/** Atualiza o status de um compromisso específico na agenda. */
export const updateCompromissoStatus = async (
  token: string,
  agendaId: string,
  compromissoId: string,
  statusData: UpdateCompromissoStatusData // Envia { status: novoStatus }
): Promise<UpdateAgendaResponse> => {
  const response = await fetch(`${API_URL}/agenda/${agendaId}/compromisso/${compromissoId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(statusData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao atualizar status do compromisso: ${response.status}`);
  }

  try {
    const data: UpdateAgendaResponse = await response.json();
    if (!data || !data.agenda) {
      throw new Error("Resposta inválida da API ao atualizar status do compromisso.");
    }
    return data;
  } catch (parseError) {
    console.error("API updateCompromissoStatus: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (atualizar status do compromisso).");
  }
};

// --- Função da API de Contratações (Visão Prestador) ---

/**
 * Busca as contratações recebidas pelo Prestador autenticado.
 * @param token - Token JWT do Prestador.
 * @param params - Parâmetros opcionais de filtragem/paginação (ex: status).
 * @returns Promise resolvendo com a lista de contratações recebidas.
 * @throws Lança erro em caso de falha.
 */
export const fetchReceivedContratacoes = async (
  token: string
  // params?: FetchContratacoesParams // Descomente se usar filtros/paginação
): Promise<FetchContratacoesResponse> => {

  // Constrói a query string se houver parâmetros
  // const queryParams = new URLSearchParams();
  // if (params) { /* ... lógica para adicionar params ... */ }
  // const queryString = queryParams.toString();

  // Endpoint é /api/contratacoes (plural) (backend filtra por token)
  // O backend diferencia pelo tipo de usuário no token
  const url = `${API_URL}/contratacoes`; // ${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao buscar contratações recebidas: ${response.status}`);
  }

  try {
    // Espera uma resposta no formato { contratacoes: Contratacao[] }
    const data: FetchContratacoesResponse = await response.json();
    if (!data || !Array.isArray(data.contratacoes)) {
      throw new Error("Resposta inválida da API ao buscar contratações recebidas.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchReceivedContratacoes: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (contratações recebidas).");
  }
};

// Você pode adicionar fetchMyHiredContratacoes (para Comprador) de forma similar se necessário


// --- Função da API de Contratações (Visão Comprador) ---

/**
 * Busca as contratações realizadas pelo Comprador autenticado.
 * @param token - Token JWT do Comprador.
 * @param params - Parâmetros opcionais de filtragem/paginação.
 * @returns Promise resolvendo com a lista de contratações feitas pelo comprador.
 * @throws Lança erro em caso de falha.
 */
export const fetchMyHiredContratacoes = async (
  token: string
  // params?: FetchContratacoesParams // Descomente para usar filtros
): Promise<FetchContratacoesResponse> => {

  // Constrói a query string se houver parâmetros
  // const queryParams = new URLSearchParams();
  // if (params) { /* ... lógica para adicionar params ... */ }
  // const queryString = queryParams.toString();

  // Endpoint é /api/contratacoes (plural)
  // O backend diferencia pelo tipo de usuário no token
  const url = `${API_URL}/contratacoes`; // ${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao buscar minhas contratações: ${response.status}`);
  }

  try {
    // Espera uma resposta no formato { contratacoes: Contratacao[] }
    const data: FetchContratacoesResponse = await response.json();
    if (!data || !Array.isArray(data.contratacoes)) {
      throw new Error("Resposta inválida da API ao buscar minhas contratações.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchMyHiredContratacoes: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (minhas contratações).");
  }
};


// --- Funções da API do Anunciante ---

/** Busca os anúncios criados pelo Anunciante autenticado. */
export const fetchMyAds = async (token: string): Promise<FetchAdsResponse> => {
  const response = await fetch(`${API_URL}/ad`, { // Endpoint hipotético /api/ad
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  if (!response.ok) {
    let ed: ApiErrorResponse | null = null; try { ed = await response.json(); } catch (e) {}
    throw new Error(ed?.message || `Erro ao buscar anúncios: ${response.status}`);
  }
  try {
    const data: FetchAdsResponse = await response.json();
    if (!data || !Array.isArray(data.ads)) { throw new Error("Resposta inválida (anúncios)."); }
    return data;
  } catch (e) { throw new Error("Erro ao processar resposta (anúncios)."); }
};

/** Busca os treinamentos criados pelo Anunciante autenticado. */
export const fetchMyTrainings = async (token: string): Promise<FetchTrainingsResponse> => {
  // Assume que GET /api/treinamento com token de anunciante filtra corretamente
  const response = await fetch(`${API_URL}/treinamento`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  if (!response.ok) {
    let ed: ApiErrorResponse | null = null; try { ed = await response.json(); } catch (e) {}
    throw new Error(ed?.message || `Erro ao buscar treinamentos: ${response.status}`);
  }
  try {
    const data: FetchTrainingsResponse = await response.json();
    if (!data || !Array.isArray(data.trainings)) { throw new Error("Resposta inválida (treinamentos)."); }
    return data;
  } catch (e) { throw new Error("Erro ao processar resposta (treinamentos)."); }
};

// Adicionar createAd, updateAd, etc. se necessário

// --- Funções da API de Comunidade (Publicações) ---

/**
 * Busca as publicações aprovadas da comunidade.
 * Assume acesso público (sem token). Pode aceitar filtros (ex: ?tipo=evento).
 * @returns Promise resolvendo com a lista de publicações.
 * @throws Lança erro em caso de falha.
 */
export const fetchPublicacoes = async (/* params?: FetchPublicacoesParams */): Promise<FetchPublicacoesResponse> => {
  // Adapte a URL se precisar de filtros, ex: /api/publicacao?status=approved
  const url = `${API_URL}/publicacao`; // Endpoint visto em CommunityScreen.tsx

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao buscar publicações: ${response.status}`);
  }

  try {
    // Espera resposta { publicacoes: Publicacao[] }
    const data: FetchPublicacoesResponse = await response.json();
    if (!data || !Array.isArray(data.publicacoes)) {
      throw new Error("Resposta inválida da API ao buscar publicações.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchPublicacoes: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (publicações).");
  }
};

/**
 * Cria uma nova publicação (post ou evento). Requer autenticação.
 * @param token - Token JWT do usuário autenticado.
 * @param publicacaoData - Dados da publicação a ser criada.
 * @returns Promise resolvendo com a mensagem de sucesso e/ou publicação criada.
 * @throws Lança erro em caso de falha.
 */
export const createPublicacao = async (token: string, publicacaoData: PublicacaoData): Promise<CreatePublicacaoResponse> => {
  const response = await fetch(`${API_URL}/publicacao`, { // Endpoint visto em CommunityScreen.tsx
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(publicacaoData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao criar publicação: ${response.status}`);
  }

  try {
    const data: CreatePublicacaoResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após criar publicação.");
    }
    return data;
  } catch (parseError) {
    console.error("API createPublicacao: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (criar publicação).");
  }
};

// Adicionar aqui outras funções relacionadas (update, delete, comment, like) se necessário

// src/services/api.ts

// ... (constante API_URL, funções existentes) ...


// --- Funções da API de Notificações ---

/**
 * Busca as notificações do usuário autenticado.
 * @param token - Token JWT do usuário.
 * @returns Promise resolvendo com a lista de notificações.
 * @throws Lança erro em caso de falha.
 */
export const fetchNotificacoes = async (token: string): Promise<FetchNotificacoesResponse> => {
  const response = await fetch(`${API_URL}/notificacoes`, { // Endpoint correto para buscar notificações
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao buscar notificações: ${response.status}`);
  }

  try {
    // Espera resposta { notificacoes: Notificacao[] }
    const data: FetchNotificacoesResponse = await response.json();
    if (!data || !Array.isArray(data.notificacoes)) {
      throw new Error("Resposta inválida da API ao buscar notificações.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchNotificacoes: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (notificações).");
  }
};

/**
 * Marca uma notificação específica como lida.
 * @param token - Token JWT do usuário.
 * @param notificationId - ID da notificação a ser marcada como lida.
 * @returns Promise resolvendo com a resposta da API.
 * @throws Lança erro em caso de falha.
 */
export const markNotificacaoAsRead = async (token: string, notificationId: string): Promise<NotificacaoActionResponse> => {
  const url = `${API_URL}/notificacoes/${notificationId}/read`; // Endpoint correto para marcar como lida
  const response = await fetch(url, {
    method: 'PATCH', // Método correto para atualização parcial
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      // 'Content-Type': 'application/json', // Desnecessário se não houver body
    },
    // body: JSON.stringify({ lida: true }), // Opcional: Backend pode precisar do status no corpo
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao marcar notificação como lida: ${response.status}`);
  }

  try {
    const data: NotificacaoActionResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após marcar notificação como lida.");
    }
    return data;
  } catch (parseError) {
    console.error("API markNotificacaoAsRead: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (marcar como lida).");
  }
};

/**
 * Exclui uma notificação específica.
 * @param token - Token JWT do usuário.
 * @param notificationId - ID da notificação a ser excluída.
 * @returns Promise resolvendo com a mensagem de sucesso.
 * @throws Lança erro em caso de falha.
 */
export const deleteNotificacao = async (token: string, notificationId: string): Promise<NotificacaoActionResponse> => {
  const url = `${API_URL}/notificacoes/${notificationId}`; // Endpoint correto para excluir notificação
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao excluir notificação: ${response.status}`);
  }

  try {
    // Espera pelo menos uma mensagem de sucesso
    const data: NotificacaoActionResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após excluir notificação.");
    }
    return data;
  } catch (parseError) {
    console.error("API deleteNotificacao: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (excluir notificação).");
  }
};

// src/services/api.ts

// ... (constante API_URL, funções existentes) ...


// --- Funções da API de Negociação ---

/**
 * Inicia um processo de negociação para uma contratação. (Ação do Comprador)
 * @param token - Token JWT do Comprador.
 * @param negotiationData - Dados para iniciar a negociação (contratacaoId, providerId, propostaInicial).
 * @returns Promise resolvendo com a resposta da API (incluindo a negociação criada).
 * @throws Lança erro em caso de falha.
 */
export const iniciarNegociacao = async (token: string, negotiationData: NegociacaoInitiateData): Promise<NegociacaoResponse> => {
  const url = `${API_URL}/negociacao`; // Endpoint POST visto na tela original
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(negotiationData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao iniciar negociação: ${response.status}`);
  }

  try {
    const data: NegociacaoResponse = await response.json();
    // A API deve retornar { message: string, negociacao: Negociacao }
    if (!data.message || !data.negociacao) {
      throw new Error("Resposta inválida da API ao iniciar negociação.");
    }
    return data;
  } catch (parseError) {
    console.error("API iniciarNegociacao: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (iniciar negociação).");
  }
};

/**
 * Envia uma resposta/contraproposta para uma negociação existente. (Ação do Prestador)
 * @param token - Token JWT do Prestador.
 * @param negociacaoId - ID da negociação a ser respondida.
 * @param responseData - Dados da resposta (respostaProvider).
 * @returns Promise resolvendo com a resposta da API (incluindo a negociação atualizada).
 * @throws Lança erro em caso de falha.
 */
export const responderNegociacao = async (token: string, negociacaoId: string, responseData: NegociacaoRespondData): Promise<NegociacaoResponse> => {
  const url = `${API_URL}/negociacao/${negociacaoId}`; // Endpoint PUT/:id visto na tela original
  const body = {
    ...responseData,
    status: 'contraproposta' // Define o status ao responder, como na tela original
  };
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao responder negociação: ${response.status}`);
  }

  try {
    const data: NegociacaoResponse = await response.json();
    if (!data.message || !data.negociacao) {
      throw new Error("Resposta inválida da API ao responder negociação.");
    }
    return data;
  } catch (parseError) {
    console.error("API responderNegociacao: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (responder negociação).");
  }
};

/**
 * Confirma uma negociação (aceita a proposta/contraproposta). (Ação do Comprador)
 * @param token - Token JWT do Comprador.
 * @param negociacaoId - ID da negociação a ser confirmada.
 * @returns Promise resolvendo com a resposta da API (incluindo a negociação atualizada).
 * @throws Lança erro em caso de falha.
 */
export const confirmarNegociacao = async (token: string, negociacaoId: string): Promise<NegociacaoResponse> => {
  const url = `${API_URL}/negociacao/${negociacaoId}/confirmar`; // Endpoint PUT/:id/confirmar visto na tela original
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      // 'Content-Type': 'application/json', // Geralmente não precisa de body para confirmar
    },
    // body: JSON.stringify({ status: 'confirmada' }), // Opcional: se a API esperar um status
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao confirmar negociação: ${response.status}`);
  }

  try {
    const data: NegociacaoResponse = await response.json();
    if (!data.message || !data.negociacao) {
      throw new Error("Resposta inválida da API ao confirmar negociação.");
    }
    return data;
  } catch (parseError) {
    console.error("API confirmarNegociacao: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (confirmar negociação).");
  }
};

// Adicionar aqui outras funções se necessário (ex: buscar negociação por ID, cancelar negociação)

// src/services/api.ts
// ... (imports for Negociacao, NegociacaoResponse, ApiErrorResponse) ...

/** Busca uma negociação existente pelo ID da contratação */
export const fetchNegociacaoByContratacaoId = async (
  token: string,
  contratacaoId: string
): Promise<{ negociacao: Negociacao | null }> => { // Retorna objeto com a negociação ou null
                                                   // Ajuste o endpoint conforme sua API (pode ser /negociacao?contratacaoId=...)
  const url = `${API_URL}/negociacao/contratacao/${contratacaoId}`; // Exemplo de rota
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });
  if (!response.ok) {
    // 404 significa que não há negociação para este contrato ainda
    if (response.status === 404) return { negociacao: null };
    let ed: ApiErrorResponse | null = null; try { ed = await response.json(); } catch (e) {}
    throw new Error(ed?.message || `Erro ao buscar negociação: ${response.status}`);
  }
  try {
    // Assume que retorna { negociacao: Negociacao | null }
    const data: { negociacao: Negociacao | null } = await response.json();
    return data;
  } catch (e) { throw new Error("Erro ao processar resposta (buscar negociação)."); }
};

// Garantir que iniciarNegociacao, responderNegociacao, confirmarNegociacao também estão aqui
// ...

// src/services/api.ts

// ... (constante API_URL, funções existentes) ...


// --- Função da API de Relatórios ---

/**
 * Busca os dados agregados para o relatório de indicadores.
 * Requer autenticação (Admin, Advertiser ou Provider, dependendo da regra do backend).
 * @param token - Token JWT do usuário autenticado.
 * @returns Promise resolvendo com os dados do relatório.
 * @throws Lança erro em caso de falha.
 */
export const fetchRelatorio = async (token: string): Promise<FetchRelatorioResponse> => {
  // Retorna dados simulados já que o endpoint não existe no backend
  console.log('Usando dados simulados para relatório, pois o endpoint não existe no backend');

  // Cria um objeto de relatório simulado
  const mockRelatorio: Relatorio = {
    usuariosPorTipo: [
      { _id: 'comprador', count: 25 },
      { _id: 'prestador', count: 15 },
      { _id: 'anunciante', count: 5 },
      { _id: 'administrador', count: 2 }
    ],
    contratacoesPorStatus: [
      { _id: 'pendente', count: 10 },
      { _id: 'aceita', count: 8 },
      { _id: 'concluida', count: 5 },
      { _id: 'cancelada', count: 2 }
    ],
    avgRating: 4.5,
    totalPublicacoes: 30,
    timestamp: new Date().toISOString()
  };

  try {
    // Simula um pequeno atraso para parecer uma chamada de API real
    await new Promise(resolve => setTimeout(resolve, 500));
    return { relatorio: mockRelatorio };
  } catch (error) {
    console.error("Erro ao simular atraso para relatório:", error);
    throw new Error("Erro ao gerar relatório simulado.");
  }
};

// Adicionar outras funções de relatório se necessário (ex: com filtros de data)
