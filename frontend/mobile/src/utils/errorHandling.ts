import { Alert } from 'react-native';
import { clearAllAuthData } from './secureStorage';

/**
 * Tipos de erros da aplicação
 */
export enum ErrorType {
  // Erros de autenticação
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  
  // Erros de validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Erros de rede
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  // Erros de dados
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  
  // Erro genérico
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface para erros da aplicação
 */
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
  errorCode?: string;
}

/**
 * Cria um erro da aplicação
 * @param type Tipo do erro
 * @param message Mensagem de erro
 * @param originalError Erro original
 * @param statusCode Código de status HTTP
 * @param errorCode Código de erro específico da API
 * @returns Objeto de erro da aplicação
 */
export function createAppError(
  type: ErrorType,
  message: string,
  originalError?: any,
  statusCode?: number,
  errorCode?: string
): AppError {
  return {
    type,
    message,
    originalError,
    statusCode,
    errorCode
  };
}

/**
 * Mapeia um erro HTTP para um erro da aplicação
 * @param error Erro original
 * @param statusCode Código de status HTTP
 * @param errorData Dados de erro da API
 * @returns Erro da aplicação
 */
export function mapHttpErrorToAppError(error: any, statusCode?: number, errorData?: any): AppError {
  // Mensagem padrão
  let message = 'Ocorreu um erro inesperado.';
  let type = ErrorType.UNKNOWN_ERROR;
  let errorCode = errorData?.errorCode;
  
  // Mapeia o código de status para um tipo de erro
  if (statusCode) {
    switch (statusCode) {
      case 400:
        type = ErrorType.VALIDATION_ERROR;
        message = errorData?.message || 'Dados inválidos. Verifique as informações e tente novamente.';
        break;
      case 401:
        type = ErrorType.AUTH_TOKEN_EXPIRED;
        message = errorData?.message || 'Sua sessão expirou. Por favor, faça login novamente.';
        break;
      case 403:
        type = ErrorType.AUTH_FORBIDDEN;
        message = errorData?.message || 'Você não tem permissão para acessar este recurso.';
        break;
      case 404:
        type = ErrorType.DATA_NOT_FOUND;
        message = errorData?.message || 'O recurso solicitado não foi encontrado.';
        break;
      case 409:
        type = ErrorType.DATA_CONFLICT;
        message = errorData?.message || 'Conflito de dados. O recurso já existe ou não pode ser modificado.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER_ERROR;
        message = 'Erro no servidor. Por favor, tente novamente mais tarde.';
        break;
      default:
        // Mantém o tipo e mensagem padrão
        break;
    }
  } else if (error.message && typeof error.message === 'string') {
    // Tenta identificar o tipo de erro pela mensagem
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('conexão') || errorMessage.includes('internet')) {
      type = ErrorType.NETWORK_ERROR;
      message = 'Erro de conexão. Verifique sua internet e tente novamente.';
    } else if (errorMessage.includes('token') || errorMessage.includes('expirou') || errorMessage.includes('sessão')) {
      type = ErrorType.AUTH_TOKEN_EXPIRED;
      message = 'Sua sessão expirou. Por favor, faça login novamente.';
    }
  }
  
  return createAppError(type, message, error, statusCode, errorCode);
}

/**
 * Trata um erro da aplicação
 * @param error Erro a ser tratado
 * @param showAlert Se deve mostrar um alerta para o usuário
 * @param onAuthError Callback para erros de autenticação
 * @returns O erro da aplicação tratado
 */
export function handleAppError(
  error: any,
  showAlert = true,
  onAuthError?: () => void
): AppError {
  console.error('=== ERRO DA APLICAÇÃO ===');
  
  // Converte para AppError se ainda não for
  let appError: AppError;
  
  if (error.type && Object.values(ErrorType).includes(error.type)) {
    // Já é um AppError
    appError = error as AppError;
  } else if (error.response) {
    // Erro de API com resposta
    const statusCode = error.response.status;
    const errorData = error.response.data;
    appError = mapHttpErrorToAppError(error, statusCode, errorData);
  } else {
    // Outro tipo de erro
    appError = mapHttpErrorToAppError(error);
  }
  
  // Loga detalhes do erro
  console.error(`Tipo: ${appError.type}`);
  console.error(`Mensagem: ${appError.message}`);
  if (appError.statusCode) console.error(`Status: ${appError.statusCode}`);
  if (appError.errorCode) console.error(`Código: ${appError.errorCode}`);
  if (appError.originalError) console.error('Erro original:', appError.originalError);
  
  // Trata erros de autenticação
  if (
    appError.type === ErrorType.AUTH_TOKEN_EXPIRED ||
    appError.type === ErrorType.AUTH_UNAUTHORIZED
  ) {
    // Limpa dados de autenticação
    clearAllAuthData().catch(e => 
      console.error('Erro ao limpar dados de autenticação:', e)
    );
    
    // Chama o callback de erro de autenticação
    if (onAuthError) {
      onAuthError();
    }
  }
  
  // Mostra alerta para o usuário
  if (showAlert) {
    let title = 'Erro';
    
    // Personaliza o título com base no tipo de erro
    switch (appError.type) {
      case ErrorType.AUTH_TOKEN_EXPIRED:
      case ErrorType.AUTH_UNAUTHORIZED:
        title = 'Sessão Expirada';
        break;
      case ErrorType.NETWORK_ERROR:
        title = 'Erro de Conexão';
        break;
      case ErrorType.VALIDATION_ERROR:
        title = 'Dados Inválidos';
        break;
      case ErrorType.SERVER_ERROR:
        title = 'Erro no Servidor';
        break;
    }
    
    Alert.alert(title, appError.message);
  }
  
  return appError;
}

/**
 * Trata um erro específico de validação
 * @param error Erro de validação
 * @param showAlert Se deve mostrar um alerta para o usuário
 * @returns O erro de validação tratado
 */
export function handleValidationError(error: any, showAlert = true): AppError {
  // Extrai mensagens de erro de validação
  let validationMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
  
  if (error.errors && Array.isArray(error.errors)) {
    // Formato de erro do Zod
    validationMessage = error.errors.map((e: any) => e.message).join('\n');
  } else if (error.message) {
    validationMessage = error.message;
  }
  
  const appError = createAppError(
    ErrorType.VALIDATION_ERROR,
    validationMessage,
    error,
    400
  );
  
  console.error('=== ERRO DE VALIDAÇÃO ===');
  console.error(`Mensagem: ${appError.message}`);
  console.error('Detalhes:', error);
  
  if (showAlert) {
    Alert.alert('Dados Inválidos', validationMessage);
  }
  
  return appError;
}