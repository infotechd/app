// Exemplo: Criando src/types/agenda.ts
// Importar status de Contratacao se for reutilizar
import { ContratacaoStatus } from './contratacao';

/**
 * Status possíveis para um compromisso na agenda.
 * Pode incluir status da Contratacao ou ser mais específico.
 */
export type CompromissoStatus = ContratacaoStatus | 'scheduled' | 'confirmed'; // Exemplo

/** Representa um compromisso individual na agenda */
export interface Compromisso {
  _id: string; // ID do compromisso (pode ser o mesmo da Contratacao ou diferente)
  contratacaoId: string; // ID da Contratacao relacionada
  data: string; // Data/hora do compromisso (ISO 8601)
  status: CompromissoStatus;

  // Campos opcionais para exibição (idealmente vindos da API)
  descricaoServico?: string;
  compradorNome?: string;
}

/** Representa o objeto Agenda completo retornado pela API */
export interface Agenda {
  _id: string; // ID da Agenda (geralmente ligado ao prestador)
  prestadorId: string;
  compromissos: Compromisso[];
}

// --- Tipos para API (podem ir em src/types/api.ts) ---

/** Resposta da API ao buscar a agenda */
export interface FetchAgendaResponse {
  agenda: Agenda | null; // Pode retornar null se vazia
}

/** Dados enviados para atualizar o status de um compromisso */
export interface UpdateCompromissoStatusData {
  status: CompromissoStatus; // O novo status a ser definido
}

/** Resposta da API após atualizar um compromisso (geralmente retorna a agenda atualizada) */
export interface UpdateAgendaResponse {
  agenda: Agenda;
  message?: string;
}