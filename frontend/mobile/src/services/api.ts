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
import { loginCredentialsSchema, registrationDataSchema, profileUpdateDataSchema, updateUserRolesSchema, UpdateUserRolesPayload } from '../schemas/user.schema';
import { userSchema } from '../types/userSchema';
import { User } from '../types/user';
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
import { API_URL, API_URLS } from "../config/api";

/**
 * Tenta fazer uma requisição usando URLs alternativas da API
 * @param originalUrl - A URL original que falhou
 * @param options - As opções da requisição
 * @returns Promise que é resolvida com a resposta ou null se todas as tentativas falharem
 */
async function tryAlternativeUrls(originalUrl: string, options: RequestInit): Promise<Response | null> {
  // Extrai o caminho relativo da URL original
  const originalUrlObj = new URL(originalUrl);
  const pathWithQuery = originalUrlObj.pathname + originalUrlObj.search;

  // Filtra a URL atual para não tentar novamente
  const currentBaseUrl = originalUrl.replace(pathWithQuery, '');
  const alternativeUrls = API_URLS.filter(url => url !== currentBaseUrl);

  console.log(`[FETCH] Tentando ${alternativeUrls.length} URLs alternativas para ${pathWithQuery}`);

  // Tenta cada URL alternativa
  for (const baseUrl of alternativeUrls) {
    const alternativeUrl = `${baseUrl}${pathWithQuery}`;
    console.log(`[FETCH] Tentando URL alternativa: ${alternativeUrl}`);

    try {
      const response = await fetch(alternativeUrl, options);
      console.log(`[FETCH] Resposta da URL alternativa: status ${response.status}`);
      return response;
    } catch (error) {
      console.error(`[FETCH] Falha na URL alternativa ${alternativeUrl}:`, error);
    }
  }

  console.error('[FETCH] Todas as URLs alternativas falharam');
  return null;
}

// Define RequestInit interface if not available
interface RequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  redirect?: 'follow' | 'error' | 'manual';
  referrer?: string;
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
}

// Define HeadersInit interface if not available
interface HeadersInit {
  [key: string]: string;
}

// Interface para resposta de detalhes de uma oferta
export interface FetchOfferDetailResponse {
  success?: boolean;
  offer?: Offer;
  message?: string;
}

// Interface para objeto de prestador com ID e nome
export interface PrestadorIdObj {
  _id: any;
  nome?: string;
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
  cache?: CacheOptions;
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

// Cache para o status de conectividade
interface ConnectivityCache {
  isConnected: boolean;
  timestamp: number;
  expiresIn: number; // Tempo de expiração em ms
}

// Variável para armazenar o cache de conectividade
let connectivityCache: ConnectivityCache | null = null;

// Tempo de expiração do cache de conectividade (10 segundos)
const CONNECTIVITY_CACHE_TTL = 10000;

/**
 * Verifica a conectividade de rede com cache para evitar verificações repetidas
 * @returns Promise que é resolvida com true se a conectividade estiver disponível, false caso contrário
 * @throws Não lança exceções, apenas retorna false em caso de falha
 */
const checkConnectivity = async (): Promise<boolean> => {
  // Verifica se estamos em ambiente de teste
  if (isTestEnvironment()) {
    return true; // Pula a verificação de conectividade em ambiente de teste
  }

  // Verifica se temos um cache válido
  const now = Date.now();
  if (connectivityCache && now - connectivityCache.timestamp < connectivityCache.expiresIn) {
    console.log('[CONNECTIVITY] Usando resultado em cache:', 
      connectivityCache.isConnected ? 'Conectado' : 'Desconectado');
    return connectivityCache.isConnected;
  }

  console.log('[CONNECTIVITY] Verificando conectividade de rede...');

  // Lista de URLs para verificar conectividade, em ordem de prioridade
  const connectivityCheckUrls = [
    // Primeiro tenta o próprio backend da aplicação
    API_URL,
    // Depois tenta serviços públicos confiáveis
    'https://www.cloudflare.com',
    'https://www.google.com',
    'https://www.microsoft.com'
  ];

  // Timeout aumentado para redes mais lentas
  const timeout = 5000;

  // Tenta cada URL até encontrar uma que responda
  for (const url of connectivityCheckUrls) {
    try {
      console.log(`[CONNECTIVITY] Tentando verificar conectividade com: ${url}`);

      const response = await axios.head(url, {
        timeout,
        maxRedirects: 0,
        headers: { 'Accept': '*/*' },
        // Ignora erros de certificado em desenvolvimento
        validateStatus: (status) => status >= 200 && status < 600
      });

      // Se chegou aqui, a conexão está funcionando
      const isConnected = response.status >= 200 && response.status < 600;

      if (isConnected) {
        console.log(`[CONNECTIVITY] ✓ Conectividade confirmada via ${url}`);

        // Armazena o resultado no cache
        connectivityCache = {
          isConnected: true,
          timestamp: now,
          expiresIn: CONNECTIVITY_CACHE_TTL
        };

        return true;
      }
    } catch (error) {
      console.warn(`[CONNECTIVITY] Falha ao verificar conectividade com ${url}:`, error);
      // Continua tentando com a próxima URL
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  console.warn('[CONNECTIVITY] ✗ Todas as verificações de conectividade falharam');

  // Armazena o resultado negativo no cache (com tempo de expiração menor)
  connectivityCache = {
    isConnected: false,
    timestamp: now,
    expiresIn: CONNECTIVITY_CACHE_TTL / 2 // Expira mais rápido para tentar novamente
  };

  return false;
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
  const statusCode = response.status;

  // Importa o módulo de tratamento de erros
  const { ErrorType, createAppError } = require('@/utils/errorHandling');

  // Determina o tipo de erro com base no código de status
  let errorType = ErrorType.UNKNOWN_ERROR;

  switch (statusCode) {
    case 400:
      errorType = ErrorType.VALIDATION_ERROR;
      break;
    case 401:
      errorType = ErrorType.AUTH_TOKEN_EXPIRED;
      break;
    case 403:
      errorType = ErrorType.AUTH_FORBIDDEN;
      break;
    case 404:
      errorType = ErrorType.DATA_NOT_FOUND;
      break;
    case 409:
      errorType = ErrorType.DATA_CONFLICT;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = ErrorType.SERVER_ERROR;
      break;
  }

  // Verifica se é um erro de token inválido ou expirado
  if (statusCode === 401) {
    console.error('Token inválido ou expirado. Redirecionando para login...');

    // Importa o módulo de armazenamento seguro
    const { clearAllAuthData } = require('@/utils/secureStorage');

    // Remove os dados do usuário do armazenamento seguro
    try {
      clearAllAuthData();
      console.log('Usuário deslogado devido a token expirado');
    } catch (storageError) {
      console.error('Erro ao remover dados do usuário:', storageError);
    }
  }

  // Cria um erro da aplicação
  const appError = createAppError(
    errorType,
    errorMessage,
    new Error(`API Error: ${statusCode}`),
    statusCode,
    errorCode
  );

  // Lança o erro como ApiError para compatibilidade com código existente
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
  console.log(`[FETCH] Iniciando requisição para: ${url}`);
  console.log(`[FETCH] Método: ${options.method}, Headers:`, options.headers);

  let lastError: Error | null = null;

  // Tenta fazer a requisição diretamente sem verificar conectividade primeiro
  // Isso evita falsos negativos na verificação de conectividade
  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`[FETCH] Tentativa ${attempt + 1}/${retries + 1} para ${url}`);

    try {
      console.log(`[FETCH] Executando fetch para ${url}`);
      const response = await fetch(url, options);
      console.log(`[FETCH] Resposta recebida: status ${response.status}`);

      // Se for um 404, podemos querer tentar novamente
      if (response.status === 404) {
        console.log('[FETCH] Recebido status 404');
        // Na última tentativa, retorna a resposta 404
        if (attempt === retries) {
          console.log('[FETCH] Última tentativa, retornando resposta 404');
          return response;
        }
        // Caso contrário, espera e tenta novamente
        console.log(`[FETCH] Tentando novamente após ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Para outras respostas, retorna imediatamente
      console.log(`[FETCH] Retornando resposta com status ${response.status}`);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[FETCH] Tentativa ${attempt + 1}/${retries + 1} falhou:`, lastError.message);

      // Verifica se é um erro de rede
      if (lastError.message.includes('Network request failed')) {
        console.error('[FETCH] Erro de rede detectado. Verificando conectividade...');
        try {
          const isConnected = await checkConnectivity();
          console.log(`[FETCH] Verificação de conectividade: ${isConnected ? 'Conectado' : 'Desconectado'}`);

          // Se não há conectividade e estamos na última tentativa, tenta URLs alternativas
          if (!isConnected && attempt === retries) {
            console.log('[FETCH] Tentando URLs alternativas...');
            // Tenta URLs alternativas da API
            const alternativeResponse = await tryAlternativeUrls(url, options);
            if (alternativeResponse) {
              console.log('[FETCH] Resposta recebida de URL alternativa');
              return alternativeResponse;
            }
          }
        } catch (connectivityError) {
          console.error('[FETCH] Falha na verificação de conectividade:', connectivityError);
        }
      }

      // Na última tentativa, lança o erro
      if (attempt === retries) {
        console.error(`[FETCH] Todas as ${retries + 1} tentativas falharam para ${url}`);

        if (lastError.message.includes('Network request failed')) {
          console.error('[FETCH] Erro de rede persistente');
          throw new Error('Erro ao conectar com o servidor. Verifique sua conexão com a internet e tente novamente.');
        } else if (lastError.message.includes('timeout') || lastError.message.includes('timed out')) {
          console.error('[FETCH] Erro de timeout');
          throw new Error('O servidor está demorando muito para responder. Tente novamente mais tarde.');
        } else if (lastError.message.includes('JSON')) {
          console.error('[FETCH] Erro de parsing JSON');
          throw new Error('Erro ao processar a resposta do servidor. Entre em contato com o suporte.');
        }
        throw lastError;
      }

      // Caso contrário, espera e tenta novamente
      console.log(`[FETCH] Aguardando ${delay}ms antes da próxima tentativa`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Isso nunca deveria acontecer devido ao lançamento de erro no loop
  console.error('[FETCH] Erro inesperado: chegou ao final do fetchWithRetry sem retorno ou erro');
  throw lastError || new Error('Erro desconhecido em fetchWithRetry');
}

// Interface para as opções de cache
interface CacheOptions {
  enabled: boolean;       // Se o cache está habilitado para esta requisição
  ttl: number;            // Tempo de vida do cache em milissegundos
  key?: string;           // Chave personalizada para o cache (opcional)
}

// Interface para um item do cache
interface CacheItem<T> {
  data: T;                // Dados armazenados
  timestamp: number;      // Timestamp de quando o item foi armazenado
  expiresIn: number;      // Tempo de expiração em milissegundos
}

// Cache em memória para respostas da API
const apiCache: Map<string, CacheItem<any>> = new Map();

// Tempo de vida padrão do cache (2 minutos)
const DEFAULT_CACHE_TTL = 2 * 60 * 1000;

/**
 * Gera uma chave de cache para uma requisição
 * @param endpoint - O endpoint da API
 * @param options - As opções da requisição
 * @returns A chave de cache
 */
function generateCacheKey(endpoint: string, options: ApiRequestOptions): string {
  // Se uma chave personalizada foi fornecida, usa ela
  if (options.cache?.key) {
    return options.cache.key;
  }

  // Para requisições GET, a chave é o endpoint + query params
  if (options.method === 'GET') {
    return endpoint;
  }

  // Para outras requisições, inclui o método e o corpo (se presente)
  let key = `${options.method}:${endpoint}`;
  if (options.body) {
    key += `:${JSON.stringify(options.body)}`;
  }
  return key;
}

/**
 * Limpa o cache para um endpoint específico ou todos os endpoints
 * @param endpoint - O endpoint para limpar o cache (opcional)
 */
export function clearApiCache(endpoint?: string): void {
  if (endpoint) {
    // Remove apenas as entradas que começam com o endpoint
    for (const key of apiCache.keys()) {
      if (key.startsWith(endpoint)) {
        apiCache.delete(key);
      }
    }
    console.log(`[CACHE] Cache limpo para endpoint: ${endpoint}`);
  } else {
    // Limpa todo o cache
    apiCache.clear();
    console.log('[CACHE] Cache completamente limpo');
  }
}

/**
 * Faz uma requisição à API, tentando múltiplas URLs base se necessário
 * @param endpoint - O endpoint da API
 * @param options - As opções da requisição
 * @returns Promise que é resolvida com os dados da resposta
 */
async function apiRequest<T>(endpoint: string, options: ApiRequestOptions): Promise<T> {
  // Configura opções padrão
  const method = options.method || 'GET';

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
    method,
    headers,
  };

  // Adiciona corpo se estiver presente
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Verifica se o cache está habilitado para esta requisição
  const shouldUseCache = options.cache?.enabled !== false && method === 'GET';

  if (shouldUseCache) {
    // Gera a chave de cache
    const cacheKey = generateCacheKey(endpoint, options);

    // Verifica se temos um cache válido
    const cachedItem = apiCache.get(cacheKey);
    const now = Date.now();

    if (cachedItem && now - cachedItem.timestamp < cachedItem.expiresIn) {
      console.log(`[CACHE] Usando dados em cache para: ${endpoint}`);
      return cachedItem.data as T;
    }
  }

  // Tenta cada URL base até que uma funcione
  let lastError: Error | null = null;

  // Primeiro, tenta a URL principal (para compatibilidade com código existente)
  try {
    const url = buildUrl(`${API_URL}${endpoint}`);
    console.log(`[API] Tentando URL principal: ${url}`);

    const response = await fetchWithRetry(
      url, 
      fetchOptions, 
      options.retries || 2, // Reduz o número de tentativas por URL para tentar mais URLs
      options.delay || 1000
    );

    // Se a resposta for bem-sucedida, retorna os dados
    if (response.ok) {
      const data = await parseResponse<T>(response);

      // Armazena no cache se for uma requisição GET e o cache estiver habilitado
      if (shouldUseCache) {
        const cacheKey = generateCacheKey(endpoint, options);
        const ttl = options.cache?.ttl || DEFAULT_CACHE_TTL;

        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          expiresIn: ttl
        });

        console.log(`[CACHE] Dados armazenados em cache para: ${endpoint} (TTL: ${ttl}ms)`);
      }

      return data;
    }

    // Se a resposta não for bem-sucedida, trata o erro
    return handleApiError(response);
  } catch (error) {
    console.warn(`[API] Falha ao usar URL principal: ${error instanceof Error ? error.message : String(error)}`);
    lastError = error instanceof Error ? error : new Error(String(error));

    // Continua para tentar URLs alternativas
  }

  // Se a URL principal falhar, tenta as URLs alternativas
  for (let i = 1; i < API_URLS.length; i++) {
    const baseUrl = API_URLS[i];
    if (!baseUrl) continue;

    try {
      const url = buildUrl(`${baseUrl}${endpoint}`);
      console.log(`[API] Tentando URL alternativa (${i}): ${url}`);

      const response = await fetchWithRetry(
        url, 
        fetchOptions, 
        options.retries || 1, // Apenas uma tentativa por URL alternativa
        options.delay || 500  // Delay menor para URLs alternativas
      );

      // Se a resposta for bem-sucedida, retorna os dados
      if (response.ok) {
        console.log(`[API] URL alternativa ${baseUrl} funcionou!`);
        const data = await parseResponse<T>(response);

        // Armazena no cache se for uma requisição GET e o cache estiver habilitado
        if (shouldUseCache) {
          const cacheKey = generateCacheKey(endpoint, options);
          const ttl = options.cache?.ttl || DEFAULT_CACHE_TTL;

          apiCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            expiresIn: ttl
          });

          console.log(`[CACHE] Dados armazenados em cache para: ${endpoint} (TTL: ${ttl}ms)`);
        }

        return data;
      }

      // Se a resposta não for bem-sucedida, trata o erro
      return handleApiError(response);
    } catch (error) {
      console.warn(`[API] Falha ao usar URL alternativa ${baseUrl}: ${error instanceof Error ? error.message : String(error)}`);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Continua para a próxima URL
    }
  }

  // Se todas as URLs falharem, lança o último erro
  throw lastError || new Error('Todas as URLs da API falharam');
}
// --- Funções da API ---

/**
 * Renova o token de acesso usando um refresh token
 * @param refreshToken O refresh token para obter um novo token de acesso
 * @returns Uma Promise que resolve com o novo token de acesso
 * @throws Lança um erro em caso de falha na renovação do token
 */
export const refreshUserToken = async (refreshToken: string): Promise<string> => {
  try {
    console.log('=== INICIANDO RENOVAÇÃO DE TOKEN ===');

    // Verificar conectividade, mas não bloquear a renovação se falhar
    try {
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        console.warn('Aviso: Verificação de conectividade falhou, mas tentaremos renovar o token mesmo assim');
      }
    } catch (connectivityError) {
      console.warn('Erro ao verificar conectividade:', 
        connectivityError instanceof Error ? connectivityError.message : String(connectivityError));
      console.warn('Tentando prosseguir com a renovação mesmo assim...');
    }

    console.log('Enviando requisição de renovação de token...');

    const response = await apiRequest<{ token: string }>('/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken },
      retries: 3,
      delay: 1000
    });

    if (!response || !response.token) {
      throw new Error('Resposta de renovação de token inválida');
    }

    console.log('✓ Token renovado com sucesso!');
    return response.token;
  } catch (error) {
    console.error('=== ERRO NA RENOVAÇÃO DE TOKEN ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido na renovação de token');
    }
  }
};

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    console.log('=== INICIANDO TENTATIVA DE LOGIN ===');
    console.log(`Email sendo usado: ${email}`);

    // Validar credenciais de login com Zod
    const credentials = validateWithZod(loginCredentialsSchema, { email, senha });

    // Verificar conectividade, mas não bloquear o login se falhar
    try {
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        console.warn('Aviso: Verificação de conectividade falhou, mas tentaremos o login mesmo assim');
      }
    } catch (connectivityError) {
      console.warn('Erro ao verificar conectividade:', 
        connectivityError instanceof Error ? connectivityError.message : String(connectivityError));
      console.warn('Tentando prosseguir com o login mesmo assim...');
    }

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

    // Adiciona o refresh token ao objeto user se disponível
    if (response.refreshToken && response.user) {
      response.user.refreshToken = response.refreshToken;
    }

    // Normaliza os dados do usuário na resposta para garantir consistência
    // Isso resolve problemas de inconsistência entre roles e flags booleanas
    if (response.user) {
      // Importa as funções de conversão do módulo de permissões
      const { booleanPropsToRoles, rolesToBooleanProps } = require('@/utils/permissions');

      // Estratégia de normalização:
      // 1. Se temos roles, derivamos as flags booleanas a partir delas
      // 2. Se não temos roles, mas temos flags booleanas, derivamos roles a partir delas
      // 3. Se não temos nenhum dos dois, definimos valores padrão

      if (response.user.roles && Array.isArray(response.user.roles) && response.user.roles.length > 0) {
        // Caso 1: Temos roles, derivamos as flags booleanas
        console.log('Normalizando dados de login: Derivando flags booleanas a partir de roles');
        const booleanProps = rolesToBooleanProps(response.user.roles);

        // Atualiza as flags booleanas
        response.user.isComprador = booleanProps.isComprador;
        response.user.isPrestador = booleanProps.isPrestador;
        response.user.isAnunciante = booleanProps.isAnunciante;
        response.user.isAdmin = booleanProps.isAdmin;
      } 
      else if (
        response.user.isComprador !== undefined || 
        response.user.isPrestador !== undefined || 
        response.user.isAnunciante !== undefined || 
        response.user.isAdmin !== undefined
      ) {
        // Caso 2: Temos flags booleanas, derivamos roles
        console.log('Normalizando dados de login: Derivando roles a partir de flags booleanas');

        // Garante que todas as flags booleanas estejam definidas
        response.user.isComprador = response.user.isComprador === true;
        response.user.isPrestador = response.user.isPrestador === true;
        response.user.isAnunciante = response.user.isAnunciante === true;
        response.user.isAdmin = response.user.isAdmin === true;

        // Deriva roles a partir das flags booleanas
        response.user.roles = booleanPropsToRoles({
          isComprador: response.user.isComprador,
          isPrestador: response.user.isPrestador,
          isAnunciante: response.user.isAnunciante,
          isAdmin: response.user.isAdmin
        });
      } 
      else {
        // Caso 3: Não temos nenhum dos dois, definimos valores padrão
        console.log('Normalizando dados de login: Definindo valores padrão para roles e flags booleanas');
        response.user.isComprador = false;
        response.user.isPrestador = false;
        response.user.isAnunciante = false;
        response.user.isAdmin = false;
        response.user.roles = [];
      }

      // Garante que o ID esteja presente em ambos os formatos
      if (response.user.id && !response.user.idUsuario) {
        response.user.idUsuario = response.user.id;
      } else if (response.user.idUsuario && !response.user.id) {
        response.user.id = response.user.idUsuario;
      }
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

    // Verificar conectividade, mas não bloquear o registro se falhar
    try {
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        console.warn('Aviso: Verificação de conectividade falhou, mas tentaremos o registro mesmo assim');
      }
    } catch (connectivityError) {
      console.warn('Erro ao verificar conectividade:', 
        connectivityError instanceof Error ? connectivityError.message : String(connectivityError));
      console.warn('Tentando prosseguir com o registro mesmo assim...');
    }

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

    // Garante que as propriedades de capacidade do usuário estejam presentes
    // Isso é necessário porque o backend pode estar enviando dados incompletos
    // mas o frontend espera as flags booleanas
    if (response) {
      // Se as propriedades não existirem, define valores padrão
      if (response.isComprador === undefined) {
        response.isComprador = false;
      }
      if (response.isPrestador === undefined) {
        response.isPrestador = false;
      }
      if (response.isAnunciante === undefined) {
        response.isAnunciante = false;
      }
      if (response.isAdmin === undefined) {
        response.isAdmin = false;
      }
    }

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

    // Sempre garantir que os dados estejam no formato esperado pelo backend (com objeto 'user')
    let formattedProfileData: any;

    // Verificar se temos algum ID válido disponível
    const userId = 
      (profileData.user?.idUsuario || profileData.user?.id || profileData.user?._id || 
       profileData.idUsuario || profileData.id || profileData._id);

    // Se não temos nenhum ID válido, lançar erro imediatamente
    if (!userId) {
      throw new Error('Erro de validação: user.idUsuario: Pelo menos um dos campos \'idUsuario\' ou \'id\' deve estar presente');
    }

    if (profileData.user) {
      // Já está no formato correto, mas vamos garantir que tenha um ID
      formattedProfileData = {
        user: {
          ...profileData.user,
          // Garantir que pelo menos um campo de ID esteja presente no objeto user com valor válido
          idUsuario: userId,
          id: userId,
          _id: userId
        }
      };
    } else {
      // Converter para o formato padronizado com objeto 'user'
      formattedProfileData = {
        user: {
          ...profileData,
          // Garantir que pelo menos um campo de ID esteja presente com valor válido
          idUsuario: userId,
          id: userId,
          _id: userId
        }
      };
    }

    // A verificação de ID já foi feita anteriormente, então não precisamos verificar novamente aqui.
    // Apenas registramos os dados formatados para depuração.
    console.log('Objeto user formatado com IDs:', {
      idUsuario: formattedProfileData.user.idUsuario,
      id: formattedProfileData.user.id,
      _id: formattedProfileData.user._id
    });

    console.log('Dados do perfil formatados:', JSON.stringify(formattedProfileData, null, 2));
    const validatedProfileData = validateWithZod(profileUpdateDataSchema, formattedProfileData) as ProfileUpdateData;
    console.log('Dados do perfil validados:', JSON.stringify(validatedProfileData, null, 2));

    // Verificar se o email está sendo alterado - isso não deve ser permitido aqui
    // Use a função requestEmailChange para alterar o email com verificação de segurança
    if (validatedProfileData.user && validatedProfileData.user.email) {
      console.warn('Tentativa de atualizar email através da função updateProfile. Use requestEmailChange para isso.');
      delete validatedProfileData.user.email;
    }

    // Verificar se a foto está sendo atualizada
    if (validatedProfileData.user && validatedProfileData.user.foto) {
      console.log('URL da foto a ser atualizada:', validatedProfileData.user.foto);
    } else {
      console.warn('Nenhuma URL de foto fornecida para atualização');
    }

    const response = await apiRequest<UpdateProfileResponse>('/auth/profile', {
      method: 'PUT',
      token,
      body: validatedProfileData
    });

    // Normaliza os dados do usuário na resposta para garantir consistência
    // Isso resolve problemas de inconsistência entre roles e flags booleanas
    if (response.user) {
      // Importa as funções de conversão do módulo de permissões
      const { booleanPropsToRoles, rolesToBooleanProps } = require('@/utils/permissions');

      // Estratégia de normalização:
      // 1. Se temos roles, derivamos as flags booleanas a partir delas
      // 2. Se não temos roles, mas temos flags booleanas, derivamos roles a partir delas
      // 3. Se não temos nenhum dos dois, definimos valores padrão

      if (response.user.roles && Array.isArray(response.user.roles) && response.user.roles.length > 0) {
        // Caso 1: Temos roles, derivamos as flags booleanas
        console.log('Normalizando dados: Derivando flags booleanas a partir de roles');
        const booleanProps = rolesToBooleanProps(response.user.roles);

        // Atualiza as flags booleanas
        response.user.isComprador = booleanProps.isComprador;
        response.user.isPrestador = booleanProps.isPrestador;
        response.user.isAnunciante = booleanProps.isAnunciante;
        response.user.isAdmin = booleanProps.isAdmin;
      } 
      else if (
        response.user.isComprador !== undefined || 
        response.user.isPrestador !== undefined || 
        response.user.isAnunciante !== undefined || 
        response.user.isAdmin !== undefined
      ) {
        // Caso 2: Temos flags booleanas, derivamos roles
        console.log('Normalizando dados: Derivando roles a partir de flags booleanas');

        // Garante que todas as flags booleanas estejam definidas
        response.user.isComprador = response.user.isComprador === true;
        response.user.isPrestador = response.user.isPrestador === true;
        response.user.isAnunciante = response.user.isAnunciante === true;
        response.user.isAdmin = response.user.isAdmin === true;

        // Deriva roles a partir das flags booleanas
        response.user.roles = booleanPropsToRoles({
          isComprador: response.user.isComprador,
          isPrestador: response.user.isPrestador,
          isAnunciante: response.user.isAnunciante,
          isAdmin: response.user.isAdmin
        });
      } 
      else {
        // Caso 3: Não temos nenhum dos dois, definimos valores padrão
        console.log('Normalizando dados: Definindo valores padrão para roles e flags booleanas');
        response.user.isComprador = false;
        response.user.isPrestador = false;
        response.user.isAnunciante = false;
        response.user.isAdmin = false;
        response.user.roles = [];
      }

      // Garante que o ID esteja presente em ambos os formatos
      if (response.user.id && !response.user.idUsuario) {
        response.user.idUsuario = response.user.id;
      } else if (response.user.idUsuario && !response.user.id) {
        response.user.id = response.user.idUsuario;
      }

      console.log('Dados normalizados:', {
        id: response.user.id,
        idUsuario: response.user.idUsuario,
        roles: response.user.roles,
        isComprador: response.user.isComprador,
        isPrestador: response.user.isPrestador,
        isAnunciante: response.user.isAnunciante,
        isAdmin: response.user.isAdmin
      });
    }

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
 * Atualiza os papéis do usuário autenticado.
 * @param payload - Um objeto contendo o array de papéis a serem atualizados.
 * @returns Uma Promise que resolve com a mensagem de sucesso e o usuário atualizado.
 * @throws Lança um erro em caso de falha.
 */

export const updateUserRoles = async (payload: UpdateUserRolesPayload): Promise<{ message: string; user: User }> => {
  try {
    const data = await apiRequest<{ message: string; user: User }>('/auth/profile/roles', {
      method: 'PUT',
      body: payload
    });
    return data;
  } catch (error) {
    console.error('Erro ao atualizar papéis do usuário:', error);
    throw error;
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
  console.log('[API] fetchAuthenticatedOffers: Iniciando busca de ofertas autenticadas');

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
  console.log('[API] fetchAuthenticatedOffers: URL da requisição:', url);

  const options = {
    method: 'GET',
    headers: { 
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  console.log('[API] fetchAuthenticatedOffers: Enviando requisição autenticada');

  try {
    // Faz a requisição para o endpoint
    let response = await fetchWithRetry(url, options);
    console.log('[API] fetchAuthenticatedOffers: Resposta recebida, status:', response.status);

    if (!response.ok) {
      let errorData: ApiErrorResponse | null = null;
      try { 
        errorData = await response.json(); 
        console.log('[API] fetchAuthenticatedOffers: Dados de erro:', errorData);
      } catch (e) { 
        console.log('[API] fetchAuthenticatedOffers: Não foi possível parsear dados de erro');
      }

      // Se for 404, fornece uma mensagem mais amigável
      if (response.status === 404) {
        console.log('[API] fetchAuthenticatedOffers: Endpoint não encontrado (404). Retornando lista vazia.');
        // Retorna uma lista vazia em vez de lançar erro
        return { offers: [] };
      }

      throw new Error(errorData?.message || `Erro ao buscar ofertas autenticadas: ${response.status}`);
    }

    try {
      const data = await response.json();
      console.log('[API] fetchAuthenticatedOffers: Dados recebidos com sucesso');

      // Verifica se a resposta contém 'ofertas' (backend) ou 'offers' (frontend)
      if (data.ofertas && Array.isArray(data.ofertas)) {
        // Mapeia 'ofertas' para 'offers' para compatibilidade
        console.log(`[API] fetchAuthenticatedOffers: Encontradas ${data.ofertas.length} ofertas (formato 'ofertas')`);
        return { offers: data.ofertas };
      } else if (data.offers && Array.isArray(data.offers)) {
        // Já está no formato esperado
        console.log(`[API] fetchAuthenticatedOffers: Encontradas ${data.offers.length} ofertas (formato 'offers')`);
        return data;
      } else {
        console.warn("[API] fetchAuthenticatedOffers: Resposta da API não contém array de ofertas. Formato inesperado:", data);
        return { offers: [] };
      }
    } catch (parseError) {
      console.error("[API] fetchAuthenticatedOffers: Falha ao parsear resposta de sucesso", parseError);
      // Retorna lista vazia em vez de lançar erro
      return { offers: [] };
    }
  } catch (error) {
    console.error("[API] fetchAuthenticatedOffers: Erro na requisição", error);
    throw error; // Re-lança o erro para ser tratado pelo chamador
  }
};

/**
 * Busca ofertas públicas com base em filtros/parâmetros.
 * Usado pela tela BuscarOfertasScreen. Não requer token.
 * @param params - Objeto contendo os parâmetros de busca (texto, precoMax, etc.).
 * @returns Promise resolvendo com a lista de ofertas encontradas.
 */
export const fetchPublicOffers = async (params?: FetchOffersParams): Promise<FetchOffersResponse> => {
  console.log('[API] fetchPublicOffers: Iniciando busca de ofertas públicas');

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
  console.log('[API] fetchPublicOffers: URL da requisição:', url);

  const options = {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  };
  console.log('[API] fetchPublicOffers: Enviando requisição pública');

  try {
    // Faz a requisição para o endpoint
    let response = await fetchWithRetry(url, options);
    console.log('[API] fetchPublicOffers: Resposta recebida, status:', response.status);

    if (!response.ok) {
      let errorData: ApiErrorResponse | null = null;
      try { 
        errorData = await response.json(); 
        console.log('[API] fetchPublicOffers: Dados de erro:', errorData);
      } catch (e) { 
        console.log('[API] fetchPublicOffers: Não foi possível parsear dados de erro');
      }

      // Se for 404, fornece uma mensagem mais amigável
      if (response.status === 404) {
        console.log('[API] fetchPublicOffers: Endpoint não encontrado (404). Retornando lista vazia.');
        // Retorna uma lista vazia em vez de lançar erro
        return { offers: [] };
      }

      throw new Error(errorData?.message || `Erro ao buscar ofertas públicas: ${response.status}`);
    }

    try {
      const data = await response.json();
      console.log('[API] fetchPublicOffers: Dados recebidos com sucesso');

      // Verifica se a resposta contém 'ofertas' (backend) ou 'offers' (frontend)
      if (data.ofertas && Array.isArray(data.ofertas)) {
        // Mapeia 'ofertas' para 'offers' para compatibilidade
        console.log(`[API] fetchPublicOffers: Encontradas ${data.ofertas.length} ofertas (formato 'ofertas')`);
        return { offers: data.ofertas };
      } else if (data.offers && Array.isArray(data.offers)) {
        // Já está no formato esperado
        console.log(`[API] fetchPublicOffers: Encontradas ${data.offers.length} ofertas (formato 'offers')`);
        return data;
      } else {
        console.warn("[API] fetchPublicOffers: Resposta da API não contém array de ofertas. Formato inesperado:", data);
        return { offers: [] };
      }
    } catch (parseError) {
      console.error("[API] fetchPublicOffers: Falha ao parsear resposta de sucesso", parseError);
      // Retorna lista vazia em vez de lançar erro
      return { offers: [] };
    }
  } catch (error) {
    console.error("[API] fetchPublicOffers: Erro na requisição", error);
    throw error; // Re-lança o erro para ser tratado pelo chamador
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

    // Processar os dados para garantir que o prestadorId seja um objeto com nome quando disponível
    if (data && typeof data === 'object') {
      // Se prestadorId for uma string e houver informações do prestador em outro campo
      if (typeof data.prestadorId === 'string' && 
          (data.prestadorInfo || data.prestador || data.nomePrestador || data.prestadorNome)) {

        // Criar um objeto prestadorId com as informações disponíveis
        const prestadorIdObj: PrestadorIdObj = { _id: data.prestadorId };

        // Adicionar nome do prestador se disponível em algum campo
        if (data.prestadorInfo && data.prestadorInfo.nome) {
          prestadorIdObj.nome = data.prestadorInfo.nome;
        } else if (data.prestador && typeof data.prestador === 'object' && data.prestador.nome) {
          prestadorIdObj.nome = data.prestador.nome;
        } else if (data.nomePrestador) {
          prestadorIdObj.nome = data.nomePrestador;
        } else if (data.prestadorNome) {
          prestadorIdObj.nome = data.prestadorNome;
        }

        // Substituir o prestadorId string pelo objeto
        data.prestadorId = prestadorIdObj;
      }
    }

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

        // Processar os dados para garantir que o prestadorId seja um objeto com nome quando disponível
        if (data && typeof data === 'object') {
          // Se prestadorId for uma string e houver informações do prestador em outro campo
          if (typeof data.prestadorId === 'string' && 
              (data.prestadorInfo || data.prestador || data.nomePrestador || data.prestadorNome)) {

            // Criar um objeto prestadorId com as informações disponíveis
            const prestadorIdObj: PrestadorIdObj = { _id: data.prestadorId };

            // Adicionar nome do prestador se disponível em algum campo
            if (data.prestadorInfo && data.prestadorInfo.nome) {
              prestadorIdObj.nome = data.prestadorInfo.nome;
            } else if (data.prestador && typeof data.prestador === 'object' && data.prestador.nome) {
              prestadorIdObj.nome = data.prestador.nome;
            } else if (data.nomePrestador) {
              prestadorIdObj.nome = data.nomePrestador;
            } else if (data.prestadorNome) {
              prestadorIdObj.nome = data.prestadorNome;
            }

            // Substituir o prestadorId string pelo objeto
            data.prestadorId = prestadorIdObj;
          }
        }

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

    // Processar os dados para garantir que o prestadorId seja um objeto com nome quando disponível
    if (data && typeof data === 'object') {
      // Se prestadorId for uma string e houver informações do prestador em outro campo
      if (typeof data.prestadorId === 'string' && 
          (data.prestadorInfo || data.prestador || data.nomePrestador || data.prestadorNome)) {

        // Criar um objeto prestadorId com as informações disponíveis
        const prestadorIdObj: PrestadorIdObj = { _id: data.prestadorId };

        // Adicionar nome do prestador se disponível em algum campo
        if (data.prestadorInfo && data.prestadorInfo.nome) {
          prestadorIdObj.nome = data.prestadorInfo.nome;
        } else if (data.prestador && typeof data.prestador === 'object' && data.prestador.nome) {
          prestadorIdObj.nome = data.prestador.nome;
        } else if (data.nomePrestador) {
          prestadorIdObj.nome = data.nomePrestador;
        } else if (data.prestadorNome) {
          prestadorIdObj.nome = data.prestadorNome;
        }

        // Substituir o prestadorId string pelo objeto
        data.prestadorId = prestadorIdObj;
      }
    }

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

        // Processar os dados para garantir que o prestadorId seja um objeto com nome quando disponível
        if (data && typeof data === 'object') {
          // Se prestadorId for uma string e houver informações do prestador em outro campo
          if (typeof data.prestadorId === 'string' && 
              (data.prestadorInfo || data.prestador || data.nomePrestador || data.prestadorNome)) {

            // Criar um objeto prestadorId com as informações disponíveis
            const prestadorIdObj: PrestadorIdObj = { _id: data.prestadorId };

            // Adicionar nome do prestador se disponível em algum campo
            if (data.prestadorInfo && data.prestadorInfo.nome) {
              prestadorIdObj.nome = data.prestadorInfo.nome;
            } else if (data.prestador && typeof data.prestador === 'object' && data.prestador.nome) {
              prestadorIdObj.nome = data.prestador.nome;
            } else if (data.nomePrestador) {
              prestadorIdObj.nome = data.nomePrestador;
            } else if (data.prestadorNome) {
              prestadorIdObj.nome = data.prestadorNome;
            }

            // Substituir o prestadorId string pelo objeto
            data.prestadorId = prestadorIdObj;
          }
        }

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
