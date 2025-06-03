// Exemplo: Criando src/types/agenda.ts - Define tipos relacionados à agenda de compromissos
// Importar status de Contratação se for reutilizar
import { ContratacaoStatus } from './contratacao';

/**
 * Status possíveis para um compromisso na agenda.
 * Pode incluir status da Contratação ou ser mais específico.
 * 
 * Esta parte define os estados em que um compromisso pode estar,
 * reutilizando os status de contratação e adicionando estados específicos
 * como agendado e confirmado.
 */
export type CompromissoStatus = ContratacaoStatus | 'scheduled' | 'confirmed'; // Valores em inglês: 'scheduled' (agendado) e 'confirmed' (confirmado) - mantidos em inglês para compatibilidade com API

/** 
 * Representa um compromisso individual na agenda 
 * 
 * Esta interface define a estrutura de dados para um compromisso,
 * contendo informações como identificadores, data e status.
 */
export interface Compromisso {
  _id: string; // ID do compromisso (pode ser o mesmo da Contratação ou diferente)
  contratacaoId: string; // ID da Contratação relacionada
  data: string; // Data/hora do compromisso (formato ISO 8601 - padrão internacional: YYYY-MM-DDTHH:MM:SSZ)
  status: CompromissoStatus;

  // Campos opcionais para exibição (idealmente vindos da API)
  descricaoServico?: string; // Descrição do serviço a ser prestado
  compradorNome?: string; // Nome do comprador/cliente
}

/** 
 * Representa o objeto Agenda completo retornado pela API 
 * 
 * Esta interface define a estrutura de dados para a agenda completa,
 * contendo o ID do prestador e uma lista de compromissos.
 */
export interface Agenda {
  _id: string; // ID da Agenda (geralmente ligado ao prestador)
  prestadorId: string; // ID do prestador de serviços dono desta agenda
  compromissos: Compromisso[]; // Lista de compromissos agendados
}

// --- Tipos para API (definições de interfaces para comunicação com o backend) ---

/** 
 * Resposta da API ao buscar a agenda 
 * 
 * Define o formato da resposta quando o frontend solicita
 * os dados da agenda de um prestador.
 */
export interface FetchAgendaResponse {
  agenda: Agenda | null; // Pode retornar null (valor nulo) se a agenda estiver vazia ou não existir para o prestador
}

/** 
 * Dados enviados para atualizar o status de um compromisso 
 * 
 * Define a estrutura dos dados enviados ao backend quando
 * se deseja atualizar o status de um compromisso.
 */
export interface UpdateCompromissoStatusData {
  status: CompromissoStatus; // O novo status a ser definido para o compromisso
}

/** 
 * Resposta da API após atualizar um compromisso 
 * 
 * Define o formato da resposta quando o backend confirma
 * a atualização de um compromisso na agenda.
 */
export interface UpdateAgendaResponse {
  agenda: Agenda; // A agenda atualizada com as modificações aplicadas
  message?: string; // Mensagem opcional de sucesso ou informação adicional
}
