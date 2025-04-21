// src/types/relatorio.ts

// Importar tipos relacionados se os IDs corresponderem exatamente (opcional, mas bom para clareza)
import { UserRole } from './user';
import { ContratacaoStatus } from './contratacao';

/**
 * Representa um item na agregação de usuários por tipo.
 * '_id' geralmente contém o valor do tipo de usuário (string).
 */
export interface UsuariosPorTipoItem {
  _id: UserRole | string; // O tipo de usuário (ex: 'comprador', 'prestador')
  count: number;        // Quantidade de usuários desse tipo
}

/**
 * Representa um item na agregação de contratações por status.
 * '_id' geralmente contém o valor do status da contratação (string).
 */
export interface ContratacoesPorStatusItem {
  _id: ContratacaoStatus | string; // O status da contratação (ex: 'completed', 'in_progress')
  count: number;                 // Quantidade de contratações nesse status
}

/**
 * Interface representando a estrutura completa do objeto Relatorio
 * retornado pela API, com base nos dados exibidos em RelatorioScreen.tsx.
 */
export interface Relatorio {
  /** Agregação de contagem de usuários por cada tipoUsuario */
  usuariosPorTipo: UsuariosPorTipoItem[];

  /** Agregação de contagem de contratações por cada status */
  contratacoesPorStatus: ContratacoesPorStatusItem[];

  /** Média geral das avaliações (nota) registradas na plataforma */
  avgRating: number;

  /** Contagem total de publicações da comunidade com status 'approved' */
  totalPublicacoes: number; // Assume que se refere às publicações aprovadas

  /** Data/Hora em que o relatório foi gerado (formato ISO 8601 string) */
  timestamp: string;

  // Outros campos do Diagrama de Classe (opcional, se a API retornar)
  // tipo?: string;
  // periodo?: string;
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---

/** Resposta da API ao buscar os dados do relatório */
export interface FetchRelatorioResponse {
  relatorio: Relatorio; // A API retorna um objeto 'relatorio'
  message?: string;
}