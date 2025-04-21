// src/types/contratacao.ts
// Importar Offer e User se precisar incluir detalhes deles aqui
// import { Offer } from './offer';
// import { User } from './user';

/**
 * Define os status possíveis para uma Contratação.
 * Baseado no fluxo comum de contratação e casos de uso (Contratar, Gerenciar Agenda, Concluir).
 */
export type ContratacaoStatus =
  | 'pending_acceptance' // Aguardando aceite do prestador
  | 'accepted' // Prestador aceitou
  | 'rejected' // Prestador recusou
  | 'in_progress' // Serviço em andamento
  | 'completed' // Serviço concluído (aguardando pagamento/avaliação?)
  | 'paid' // Pagamento efetuado
  | 'cancelled_buyer' // Comprador cancelou
  | 'cancelled_provider' // Prestador cancelou
  | 'disputed'; // Em disputa

/**
 * Interface representando um objeto de Contratação (Hiring/Booking).
 * Baseado no Diagrama de Classe, Caso de Uso 5 e telas relacionadas.
 */
export interface Contratacao {
  _id: string; // Identificador único da contratação
  ofertaId: string; // ID da Offer contratada
  compradorId: string; // ID do User (Comprador)
  prestadorId: string; // ID do User (Prestador)
  status: ContratacaoStatus;
  /** Preço final acordado para esta contratação (pode ser igual ao da oferta ou negociado) */
  precoContratado: number;
  dataContratacao: string; // ISO 8601
  dataInicioEstimada?: string | null; // ISO 8601
  dataConclusao?: string | null; // ISO 8601

  // Campos opcionais que podem ser úteis
  // detalhesAcordados?: string; // Notas sobre o serviço
  // pagamentoId?: string; // ID do pagamento relacionado
  // avaliacaoCompradorId?: string; // ID da avaliação feita pelo comprador
  // avaliacaoPrestadorId?: string; // ID da avaliação feita pelo prestador

  // Para exibição facilitada, o backend pode incluir:
  // ofertaTitulo?: string;
  // compradorNome?: string;
  // prestadorNome?: string;
}

/**
 * Interface para os dados necessários ao CRIAR uma nova Contratação.
 * Baseado em ContratacaoScreen.tsx (que só envia ofertaId).
 */
export interface ContratacaoData {
  ofertaId: string;
  // compradorId é inferido pelo backend via token
  // precoContratado pode ser pego da oferta ou definido no backend inicialmente
  // status inicial geralmente é definido no backend (ex: 'pending_acceptance')
}

export interface FetchContratacoesParams {
  status?: ContratacaoStatus[]; // Filtrar por um ou mais status
  page?: number;
  limit?: number;
  sortBy?: 'dataContratacao' | 'status' | 'precoContratado';
  sortOrder?: 'asc' | 'desc';
}