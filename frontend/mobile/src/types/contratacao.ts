// src/types/contratacao.ts
/**
 * Este arquivo define os tipos e interfaces relacionados às contratações de serviços na plataforma.
 * Contém as estruturas de dados necessárias para gerenciar todo o ciclo de vida de uma contratação.
 */

// Importar Offer e User se precisar incluir detalhes deles aqui
// import { Offer } from './offer';
// import { User } from './user';

/**
 * Define os status possíveis para uma Contratação.
 * Baseado no fluxo comum de contratação e casos de uso (Contratar, Gerenciar Agenda, Concluir).
 * 
 * Esta parte do código define os diferentes estados que uma contratação pode ter durante seu ciclo de vida.
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
 * Interface representando um objeto de Contratação (Contratação/Reserva).
 * Baseado no Diagrama de Classe, Caso de Uso 5 e telas relacionadas.
 * 
 * Esta parte do código define a estrutura de dados para uma contratação de serviço,
 * contendo todas as informações necessárias para gerenciar o ciclo de vida de um serviço contratado.
 */
export interface Contratacao {
  _id: string; // Identificador único da contratação
  ofertaId: string; // ID da Oferta contratada
  compradorId: string; // ID do Usuário (Comprador)
  prestadorId: string; // ID do Usuário (Prestador)
  status: ContratacaoStatus;
  /** Preço final acordado para esta contratação (pode ser igual ao da oferta ou negociado) */
  precoContratado: number;
  dataContratacao: string; // Formato ISO 8601
  dataInicioEstimada?: string | null; // Formato ISO 8601
  dataConclusao?: string | null; // Formato ISO 8601

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
 * 
 * Esta parte do código define os dados mínimos necessários para criar uma nova contratação no sistema.
 * A maioria dos campos é preenchida automaticamente pelo backend.
 */
export interface ContratacaoData {
  ofertaId: string;
  // compradorId é inferido pelo backend via token
  // precoContratado pode ser pego da oferta ou definido no backend inicialmente
  // status inicial geralmente é definido no backend (ex: 'pending_acceptance')
}

/**
 * Interface para os parâmetros de busca de contratações.
 * 
 * Esta parte do código define os parâmetros que podem ser usados para filtrar, 
 * paginar e ordenar as contratações ao buscar no sistema.
 */
export interface FetchContratacoesParams {
  status?: ContratacaoStatus[]; // Filtrar por um ou mais status
  page?: number; // Número da página para paginação
  limit?: number; // Limite de itens por página
  sortBy?: 'dataContratacao' | 'status' | 'precoContratado'; // Campo para ordenação
  sortOrder?: 'asc' | 'desc'; // Ordem de classificação (ascendente ou descendente)
}
