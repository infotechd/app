// src/types/relatorio.ts
// Este arquivo define as interfaces e tipos relacionados aos relatórios do sistema

// Importar tipos relacionados se os IDs corresponderem exatamente (opcional, mas bom para clareza)
import { TipoUsuarioEnum } from './user';
import { ContratacaoStatus } from './contratacao';

/**
 * Representa um item na agregação de usuários por tipo.
 * '_id' geralmente contém o valor do tipo de usuário (string).
 * Esta interface é usada para representar a contagem de usuários agrupados por seu tipo.
 */
export interface UsuariosPorTipoItem {
  _id: TipoUsuarioEnum | string; // O tipo de usuário (ex: 'comprador', 'prestador')
  count: number;        // Quantidade de usuários desse tipo
}

/**
 * Representa um item na agregação de contratações por status.
 * '_id' geralmente contém o valor do status da contratação (string).
 * Esta interface é usada para representar a contagem de contratações agrupadas por seu status.
 */
export interface ContratacoesPorStatusItem {
  _id: ContratacaoStatus | string; // O status da contratação (ex: 'concluído', 'em_andamento')
  count: number;                 // Quantidade de contratações nesse status
}

/**
 * Interface representando a estrutura completa do objeto Relatorio
 * retornado pela API, com base nos dados exibidos em RelatorioScreen.tsx.
 * Esta interface define todos os dados estatísticos que compõem um relatório no sistema.
 */
export interface Relatorio {
  /** Agregação de contagem de usuários por cada tipoUsuario */
  usuariosPorTipo: UsuariosPorTipoItem[];

  /** Agregação de contagem de contratações por cada status */
  contratacoesPorStatus: ContratacoesPorStatusItem[];

  /** Média geral das avaliações (nota) registradas na plataforma */
  avgRating: number;

  /** Contagem total de publicações da comunidade com status 'aprovado' */
  totalPublicacoes: number; // Assume que se refere às publicações aprovadas

  /** Data/Hora em que o relatório foi gerado (formato ISO 8601 string) */
  timestamp: string;

  // Outros campos do Diagrama de Classe (opcional, se a API retornar)
  // tipo?: string; // Tipo do relatório
  // periodo?: string; // Período de tempo que o relatório abrange
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---
// Esta seção define interfaces para as respostas da API relacionadas a relatórios

/** Resposta da API ao buscar os dados do relatório */
export interface FetchRelatorioResponse {
  relatorio: Relatorio; // A API retorna um objeto 'relatorio'
  message?: string; // Mensagem opcional retornada pela API
}
