// src/types/api.ts
// Este arquivo contém definições de tipos e interfaces para comunicação com a API do sistema

// Importa os tipos de usuário do arquivo vizinho
import { User, UserRole, TipoUsuarioEnum } from './user';
import { Offer } from './offer'; // Importa o tipo Offer (Oferta)
import { Contratacao} from './contratacao'; // Importa o tipo Contratacao

// --- Tipos Relacionados à Autenticação ---
// Esta seção define interfaces relacionadas ao processo de autenticação de usuários

/** Dados enviados no corpo da requisição de login */
// (Não estritamente necessário como interface separada, mas pode ser útil)
// export interface LoginCredentials {
//   email: string;
//   senha: string;
// }

/** 
 * Resposta esperada da API de login em caso de sucesso 
 * 
 * Nota: Embora o backend envie o token separadamente do objeto user,
 * no frontend o token é adicionado ao objeto user antes da validação
 * para facilitar o uso no AuthContext.
 * 
 * Esta interface define a estrutura de dados retornada após um login bem-sucedido
 */
export interface LoginResponse {
  user: User & { token: string }; // O objeto do usuário retornado com o token incluído
  token?: string;                 // O token JWT (opcional aqui porque será movido para dentro do user)
  message?: string;               // Mensagem opcional de sucesso
}

/** 
 * Dados enviados no corpo da requisição de registro 
 * Esta interface define todos os campos necessários para registrar um novo usuário no sistema
 */
export interface RegistrationData {
  nome: string;                   // Nome completo do usuário
  email: string;                  // Email do usuário (usado para login)
  senha: string;                  // Senha do usuário
  telefone?: string;              // Número de telefone (opcional)
  cpfCnpj: string;                // CPF ou CNPJ do usuário
  tipoUsuario?: TipoUsuarioEnum;  // Mantido para compatibilidade, mas agora é opcional
  isComprador?: boolean;          // Flag de capacidade para comprador
  isPrestador?: boolean;          // Flag de capacidade para prestador
  isAnunciante?: boolean;         // Flag de capacidade para anunciante
  isAdmin?: boolean;              // Flag para administrador (normalmente false para registros de usuários)
  endereco?: string;              // Endereço do usuário (opcional)
  foto?: string;                  // URL ou base64 da foto do usuário (opcional)
  dataNascimento?: string | Date; // Data de nascimento do usuário
  genero?: 'Feminino' | 'Masculino' | 'Prefiro não dizer'; // Gênero do usuário
}

/** 
 * Resposta esperada da API de registro em caso de sucesso 
 * Contém uma mensagem de confirmação e opcionalmente pode retornar o usuário criado
 */
export interface RegistrationResponse {
  message: string;                // Mensagem de sucesso ou informação
  // user?: User;                 // Descomente se a API retornar o usuário criado
}

// --- Tipos Gerais de API ---
// Esta seção define interfaces comuns utilizadas em várias partes da API

/** 
 * Estrutura comum para respostas de erro da API 
 * Utilizada para padronizar o formato de erros retornados pelo backend
 */
export interface ApiErrorResponse {
  message: string;     // Mensagem de erro vinda do backend
  // statusCode?: number; // Opcional: código de status interno da API
  errorCode?: string;  // Código de erro específico para tratamento mais robusto
}

// --- Tipos de Perfil de Usuário ---
// Esta seção contém interfaces relacionadas ao gerenciamento de perfil de usuário

/** 
 * Dados que podem ser enviados para atualizar o perfil 
 * Esta interface define todos os campos que podem ser atualizados no perfil do usuário
 */
export interface ProfileUpdateData {
  idUsuario?: string;              // Identificador único do usuário
  id?: string;                     // Identificador alternativo que pode vir da API
  nome?: string;                   // Nome do usuário
  email?: string;                  // Email do usuário (Nota: É seguro permitir atualização de email? Depende das regras do backend)
  telefone?: string;               // Número de telefone do usuário
  cpfCnpj?: string;                // CPF ou CNPJ do usuário
  endereco?: string;               // Endereço do usuário
  foto?: string;                   // URL ou base64 da foto do usuário
  dataNascimento?: string | Date;  // Data de nascimento do usuário
  genero?: 'Feminino' | 'Masculino' | 'Prefiro não dizer'; // Gênero do usuário

  // Capacidades do usuário - definem as funções que o usuário pode exercer no sistema
  isComprador?: boolean;           // Flag de capacidade para comprador
  isPrestador?: boolean;           // Flag de capacidade para prestador
  isAnunciante?: boolean;          // Flag de capacidade para anunciante
  isAdmin?: boolean;               // Flag para administrador
  // Adicione outros campos atualizáveis conforme necessário
}

/** 
 * Resposta esperada da API ao buscar o perfil (GET /profile) 
 * Frequentemente retorna o objeto User (talvez sem o token)
 * Assumimos que retorna o objeto User completo para consistência com AuthContext
 */
export type GetProfileResponse = User;

/** 
 * Resposta esperada da API ao atualizar o perfil (PUT /profile) 
 * Contém uma mensagem de confirmação e opcionalmente o usuário atualizado
 */
export interface UpdateProfileResponse {
  message: string;                 // Mensagem de sucesso ou informação
  user?: User;                     // A API pode retornar o usuário atualizado
  token?: string;                  // Token JWT atualizado (caso alguma informação crítica tenha sido alterada)
}

/** 
 * Resposta esperada da API ao excluir a conta (DELETE /profile) 
 * Contém apenas uma mensagem de confirmação da exclusão
 */
export interface DeleteAccountResponse {
  message: string;                 // Mensagem de confirmação da exclusão
}

// --- Tipos de API para Ofertas ---
// Esta seção contém interfaces relacionadas ao gerenciamento de ofertas de serviços

/** 
 * Resposta da API ao buscar lista de ofertas 
 * Contém um array de ofertas e metadados para paginação
 */
export interface FetchOffersResponse {
  offers: Offer[];                 // Array de ofertas retornadas pela API
  total?: number;                  // Número total de ofertas (para paginação)
  page?: number;                   // Página atual (para paginação)
  // ... outros metadados de paginação e filtros
}

/** 
 * Resposta da API ao criar/atualizar uma oferta 
 * Contém informações sobre o sucesso da operação e a oferta criada/atualizada
 */
export interface OfferMutationResponse {
  message: string;                 // Mensagem de sucesso ou informação
  success: boolean;                // Indicador de sucesso da operação
  offer?: Offer;                   // Pode retornar a oferta criada/atualizada
}

// --- Tipos de API para Contratação ---
// Esta seção contém interfaces relacionadas ao processo de contratação de serviços

/** 
 * Resposta da API ao criar uma contratação 
 * Contém informações sobre o sucesso da operação e a contratação criada
 */
export interface ContratacaoResponse {
  message: string;                 // Mensagem de sucesso ou informação
  contratacao?: Contratacao;       // Pode retornar a contratação criada
}

/** 
 * Resposta da API ao buscar lista de contratações 
 * Utilizada principalmente em dashboards e históricos de contratações
 */
export interface FetchContratacoesResponse {
  contratacoes: Contratacao[];     // Array de contratações retornadas pela API
  total?: number;                  // Número total de contratações (para paginação)
  page?: number;                   // Página atual (para paginação)
  // ... outros metadados de paginação e filtros
}

/** 
 * Parâmetros para filtrar busca de contratações (opcional)
 * Esta interface pode ser utilizada para enviar filtros na busca de contratações
 */
/*
import { ContratacaoStatus } from '../types/contratacao';
export interface FetchContratacoesParams {
    status?: ContratacaoStatus[];  // Filtro por status da contratação
    page?: number;                 // Página desejada
    limit?: number;                // Limite de itens por página
    // outros filtros...
}
*/
