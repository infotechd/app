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


} from '../types/api';
import {
  Training,
  TrainingCreateData,
  FetchTrainingDetailResponse,
  FetchTrainingsResponse,
  TrainingMutationResponse,
}from '../types/training';

// --- Tipos de Oferta ---
import {
  Offer,
  OfferData,
  FetchOffersParams
} from '../types/offer';

// --- Tipos de Contratacao ---
import {
  Contratacao,
  ContratacaoData
} from '../types/contratacao';

// --- Tipos de Resposta API (de types/api) ---
import {
  FetchOffersResponse, // Adicionar
  OfferMutationResponse, // Adicionar
  ContratacaoResponse, // Adicionar
  FetchContratacoesResponse // Opcional: Adicionar se for implementar fetchContratacoes
  // ... outras respostas ...
} from '../types/api';

import { PaymentData, PaymentResponse} from '../types/pagamento';
import { ReviewData, ReviewResponse} from '../types/avaliacao';

import { CurriculoData, CurriculoResponse, Curriculo} from '../types/curriculo';

import {
  Agenda,
  FetchAgendaResponse,
  UpdateCompromissoStatusData,
  UpdateAgendaResponse,
  CompromissoStatus
} from '../types/agenda';

import { FetchAdsResponse} from '../types/ad';

import {
  Publicacao,         // Importar tipo principal
  PublicacaoData,     // Dados para criar
  FetchPublicacoesResponse, // Resposta da lista
  CreatePublicacaoResponse,  // Resposta da criação
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
// Exemplo: import { Offer } from './api';
// Importa a interface User (idealmente de um arquivo central de tipos, ex: src/types/user.ts)
// Se ainda não criou um arquivo central, pode importar de AuthContext por enquanto,
// ou definir a interface User aqui temporariamente.
// Assumindo que User foi exportada de AuthContext.tsx (não ideal, mas funciona por agora):
// import { User } from '../context/AuthContext';

// --- Definição de Tipos --- (Alternativa se não importar User)
/*
type UserRole = 'comprador' | 'prestador' | 'anunciante' | 'administrador';

interface User {
  idUsuario: string;
  nome: string;
  email: string;
  telefone?: string;
  tipoUsuario: UserRole;
  cpfCnpj?: string;
  endereco?: string;
  foto?: string;
  token: string; // A interface User em AuthContext pode não ter o token, ajuste conforme necessário
}
// --- Fim da Definição Alternativa ---


// Interface para a resposta da API em caso de sucesso no login
interface LoginResponse {
  user: User;    // O objeto do usuário retornado
  token: string; // O token JWT
  message?: string; // Algumas APIs incluem msg de sucesso
}

// Interface para a resposta da API em caso de erro
interface ApiErrorResponse {
  message: string; // Mensagem de erro vinda do backend
  // Pode haver outros campos de erro dependendo da sua API
}

// Interface para os dados enviados no corpo da requisição de registro
export interface RegistrationData {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: UserRole;
  telefone?: string;
  cpfCnpj?: string;
  endereco?: string;
  foto?: string;
}

// Interface para a resposta da API em caso de sucesso no registro
// Baseado no código original que apenas mostra data.message
export interface RegistrationResponse{
  message: string;
  // Se sua API retornar o usuário criado, adicione: User?: User;
}
*/
// --- Constante da API ---
//const API_URL: string = "http://localhost:5000/api";

// --- Função de Login Tipada ---

/**
 * Realiza a chamada de API para autenticar o usuário.
 * @param email - O email do usuário.
 * @param senha - A senha do usuário.
 * @returns Uma Promise que resolve com os dados do usuário e token em caso de sucesso.
 * @throws Lança um erro com a mensagem do backend em caso de falha na autenticação ou erro de rede.
 */
export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    // Log detalhado da tentativa de login
    console.log('=== INICIANDO TENTATIVA DE LOGIN ===');
    console.log(`URL da API: ${API_URL}/auth/login`);
    console.log(`Email sendo usado: ${email}`);
    console.log('Verificando conectividade de rede...');

    // Tenta fazer uma requisição simples para verificar a conectividade
    try {
      await axios.head('https://www.google.com', { timeout: 5000 });
      console.log('✓ Conectividade com internet confirmada');
    } catch (netError) {
      console.error('✗ Falha na verificação de conectividade:', netError);
      // Continua mesmo com falha na verificação
    }

    console.log('Enviando requisição de login...');
    const response = await axios.post(`${API_URL}/auth/login`, 
      { email, senha },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        timeout: 15000, // 15 segundos de timeout
      }
    );

    console.log('✓ Resposta recebida com sucesso:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      // Não loga a resposta completa para não expor dados sensíveis
    });

    // Axios já lança erro para status não 2xx, então se chegou aqui, é sucesso
    const data: LoginResponse = response.data;

    // Validação extra opcional: verificar se data.user e data.token existem
    if (!data.user || !data.token) {
      console.error("API Login: Resposta bem-sucedida, mas dados ausentes.", data);
      throw new Error("Resposta da API inválida após login.");
    }

    console.log('✓ Login realizado com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO DETALHADO NO LOGIN ===');

    // Se for um erro do Axios com resposta
    if (axios.isAxiosError(error)) {
      console.error('Tipo: Erro do Axios');
      console.error('Mensagem:', error.message);
      console.error('Código:', error.code);
      console.error('Config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout
      });

      if (error.response) {
        console.error('Resposta:', {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        });

        const errorData = error.response.data as ApiErrorResponse;
        throw new Error(errorData?.message || `Erro na API: ${error.response.status}`);
      } 
      else if (error.code === 'ECONNABORTED') {
        console.error('Detalhe: Timeout da requisição');
        throw new Error('Tempo limite excedido. Verifique sua conexão.');
      }
      else if (!error.response) {
        console.error('Detalhe: Sem resposta do servidor');
        throw new Error('Erro de rede. Verifique sua conexão com a internet e se o servidor está acessível.');
      }
    }
    // Qualquer outro erro
    else {
      console.error('Tipo: Erro não-Axios');
      console.error('Detalhes:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido no login');
    }
  }
};

// Adicione aqui outras funções da API conforme necessário, seguindo o mesmo padrão de tipagem e error handling.
// Exemplo:
// export const register = async (userData: RegistrationData): Promise<RegistrationResponse> => { ... }
// export const fetchOffers = async (): Promise<Offer[]> => { ... }



// --- Função Register Tipada ---
/**
 * Realiza a chamada de API para registrar um novo usuário.
 * @param userData - Os dados do usuário para registro.
 * @returns Uma Promise que resolve com a mensagem de sucesso.
 * @throws Lança um erro com a mensagem do backend em caso de falha no registro ou erro de rede.
 */
export const register = async (userData: RegistrationData): Promise<RegistrationResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch (parseError) {
      console.error("API Register: Falha ao parsear resposta de erro", parseError);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    throw new Error(errorData?.message || `Erro desconhecido no registro: ${response.status}`);
  }

  try {
    const data: RegistrationResponse = await response.json();
    if (!data.message) {
      console.error("API Register: Resposta bem-sucedida, mas mensagem ausente.", data);
      throw new Error("Resposta da API inválida após registro.");
    }
    return data;
  } catch (parseError) {
    console.error("API Register: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API após registro.");
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
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // Envia o token para autenticação
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore parse error */ }
    throw new Error(errorData?.message || `Erro ao buscar perfil: ${response.status}`);
  }

  try {
    const data: GetProfileResponse = await response.json();
    return data;
  } catch (parseError) {
    console.error("API GetProfile: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (perfil).");
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
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(profileData), // Envia apenas os dados a serem atualizados
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore parse error */ }
    throw new Error(errorData?.message || `Erro ao atualizar perfil: ${response.status}`);
  }

  try {
    const data: UpdateProfileResponse = await response.json();
    if (!data.message) {
      console.error("API UpdateProfile: Resposta bem-sucedida, mas mensagem ausente.", data);
      throw new Error("Resposta da API inválida após atualizar perfil.");
    }
    return data;
  } catch (parseError) {
    console.error("API UpdateProfile: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (atualizar perfil).");
  }
};


/**
 * Exclui a conta do usuário autenticado.
 * @param token - O token JWT do usuário autenticado.
 * @returns Uma Promise que resolve com a mensagem de sucesso.
 * @throws Lança um erro em caso de falha.
 */
export const deleteAccount = async (token: string): Promise<DeleteAccountResponse> => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore parse error */ }
    throw new Error(errorData?.message || `Erro ao excluir conta: ${response.status}`);
  }

  try {
    const data: DeleteAccountResponse = await response.json();
    if (!data.message) {
      console.error("API DeleteAccount: Resposta bem-sucedida, mas mensagem ausente.", data);
      throw new Error("Resposta da API inválida após excluir conta.");
    }
    return data;
  } catch (parseError) {
    console.error("API DeleteAccount: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (excluir conta).");
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
  // Nota: A tela original não parecia ter paginação, buscando todos.
  // Adapte se sua API tiver filtros ou paginação. Ex: /api/treinamento?status=published&page=1
  const response = await fetch(`${API_URL}/treinamento`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao buscar treinamentos: ${response.status}`);
  }

  try {
    // Assume que a API retorna um objeto { trainings: Training[] }
    const data: FetchTrainingsResponse = await response.json();
    // Validação simples
    if (!data || !Array.isArray(data.trainings)) {
      throw new Error("Resposta inválida da API ao buscar treinamentos.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchTrainings: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (treinamentos).");
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
  if (!id) {
    throw new Error("ID do treinamento é obrigatório.");
  }
  const response = await fetch(`${API_URL}/treinamento/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao buscar detalhes do treinamento: ${response.status}`);
  }

  try {
    // Assume que a API retorna um objeto { treinamento: Training }
    const data: FetchTrainingDetailResponse = await response.json();
    if (!data || !data.treinamento) {
      throw new Error("Resposta inválida da API ao buscar detalhes do treinamento.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchTrainingDetail: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (detalhe treinamento).");
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
  const response = await fetch(`${API_URL}/treinamento`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(trainingData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao criar treinamento: ${response.status}`);
  }

  try {
    const data: TrainingMutationResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após criar treinamento.");
    }
    return data;
  } catch (parseError) {
    console.error("API createTraining: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (criar treinamento).");
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
  const url = `${API_URL}/public/ofertas${queryString ? `?${queryString}` : ''}`; // Endpoint visto em BuscarOfertasScreen

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao buscar ofertas públicas: ${response.status}`);
  }

  try {
    const data: FetchOffersResponse = await response.json();
    if (!data || !Array.isArray(data.offers)) {
      throw new Error("Resposta inválida da API ao buscar ofertas públicas.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchPublicOffers: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (ofertas públicas).");
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
  // Usa o endpoint /api/oferta (visto em OfertaServicoScreen) que deve filtrar pelo token no backend
  const url = `${API_URL}/oferta${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao buscar minhas ofertas: ${response.status}`);
  }

  try {
    const data: FetchOffersResponse = await response.json();
    // A tela original esperava data.ofertas, então vamos manter isso
    if (!data || !Array.isArray(data.offers)) {
      // Se a API retornar diretamente o array, ajuste: setOfertas(data) e o tipo de retorno
      throw new Error("Resposta inválida da API ao buscar minhas ofertas.");
    }
    return data; // Retorna { offers: Offer[] }
  } catch (parseError) {
    console.error("API fetchMyOffers: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (minhas ofertas).");
  }
};

/**
 * Cria uma nova oferta de serviço. Requer token do Prestador.
 * @param token - Token JWT do Prestador.
 * @param offerData - Dados da oferta a ser criada.
 * @returns Promise resolvendo com a mensagem e/ou oferta criada.
 */
export const createOffer = async (token: string, offerData: OfferData): Promise<OfferMutationResponse> => {
  const response = await fetch(`${API_URL}/oferta`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(offerData),
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) { /* Ignore */ }
    throw new Error(errorData?.message || `Erro ao criar oferta: ${response.status}`);
  }

  try {
    const data: OfferMutationResponse = await response.json();
    if (!data.message) {
      throw new Error("Resposta inválida da API após criar oferta.");
    }
    return data;
  } catch (parseError) {
    console.error("API createOffer: Falha ao parsear resposta de sucesso", parseError);
    throw new Error("Erro ao processar resposta da API (criar oferta).");
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
  const response = await fetch(`${API_URL}/oferta/${offerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(offerUpdateData),
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
  const response = await fetch(`${API_URL}/oferta/${offerId}`, {
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
  const response = await fetch(`${API_URL}/contratacao`, {
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
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao buscar agenda: ${response.status}`);
  }
  try {
    // API retorna { agenda: Agenda | null }
    const data: FetchAgendaResponse = await response.json();
    return data;
  } catch (parseError) {
    console.error("API fetchAgenda: Falha ao parsear resposta", parseError);
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
  // Endpoint inferido do código original
  const url = `${API_URL}/agenda/${agendaId}/compromisso/${compromissoId}`;
  const response = await fetch(url, {
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
    try { errorData = await response.json(); } catch (e) {}
    throw new Error(errorData?.message || `Erro ao atualizar status: ${response.status}`);
  }
  try {
    // API retorna { agenda: Agenda, message?: string }
    const data: UpdateAgendaResponse = await response.json();
    if (!data || !data.agenda) {
      throw new Error("Resposta inválida da API após atualizar status.");
    }
    return data;
  } catch (parseError) {
    console.error("API updateCompromissoStatus: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (atualizar status).");
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

  // Endpoint pode ser /api/contratacao (backend filtra por token) ou um dedicado /api/contratacao/received
  // Assumindo /api/contratacao e filtro no backend
  const url = `${API_URL}/contratacao`; // ${queryString ? `?${queryString}` : ''}`;

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

  // Endpoint provavelmente é o mesmo /api/contratacao
  // O backend diferencia pelo tipo de usuário no token
  const url = `${API_URL}/contratacao`; // ${queryString ? `?${queryString}` : ''}`;

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
  const response = await fetch(`${API_URL}/notificacao`, { // Endpoint visto na tela original
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
  const url = `${API_URL}/notificacao/${notificationId}/lida`; // Endpoint visto na tela original
  const response = await fetch(url, {
    method: 'PUT', // Método para atualizar
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
  const url = `${API_URL}/notificacao/${notificationId}`; // Endpoint visto na tela original
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
  const url = `${API_URL}/relatorio`; // Endpoint visto na tela original

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
    throw new Error(errorData?.message || `Erro ao buscar relatório: ${response.status}`);
  }

  try {
    // Espera resposta no formato { relatorio: Relatorio }
    const data: FetchRelatorioResponse = await response.json();
    if (!data || !data.relatorio) { // Verifica se o objeto 'relatorio' existe
      throw new Error("Resposta inválida da API ao buscar relatório.");
    }
    return data;
  } catch (parseError) {
    console.error("API fetchRelatorio: Falha ao parsear resposta", parseError);
    throw new Error("Erro ao processar resposta da API (relatório).");
  }
};

// Adicionar outras funções de relatório se necessário (ex: com filtros de data)
