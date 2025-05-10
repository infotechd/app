// src/types/offer.ts

// Importar User se precisar referenciar o objeto completo do prestador
// import { User } from './user';

/**
 * Define os status possíveis para uma Oferta de Serviço.
 * Baseado em OfertaServicoScreen.tsx ('draft', 'ready') e fluxo comum.
 */
export type OfferStatus = 'draft' | 'ready' | 'inactive' | 'archived';

/**
 * Interface para horário disponível com hora de início e fim
 */
export interface IHorarioDisponivel {
  inicio: string; // Formato HH:MM
  fim: string; // Formato HH:MM
}

/**
 * Interface para recorrência semanal (dias da semana e horários)
 */
export interface IRecorrenciaSemanal {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horarios: IHorarioDisponivel[];
}

/**
 * Interface para o objeto de Disponibilidade estruturado
 * conforme esperado pelo backend
 */
export interface IDisponibilidade {
  recorrenciaSemanal?: IRecorrenciaSemanal[]; // Array opcional de dias/horários
  duracaoMediaMinutos?: number; // Duração média do serviço em minutos
  observacoes?: string; // Observações adicionais
}

/**
 * Interface representando um objeto de Oferta de Serviço completo.
 * Baseado no Diagrama de Classe, Casos de Uso 3/4, e telas relacionadas.
 */
export interface Offer {
  _id: string; // Identificador único da oferta
  descricao: string;
  preco: number;
  status: OfferStatus;
  /** Detalhes sobre a disponibilidade estruturados */
  disponibilidade: IDisponibilidade | string; // Aceita ambos formatos para compatibilidade
  /** ID do PrestadorServico (User) que criou a oferta */
  prestadorId: string;

  // Campos opcionais que o backend pode fornecer ou que são úteis
  dataCriacao?: string; // ISO 8601
  dataAtualizacao?: string; // ISO 8601
  // Para exibição facilitada na busca, o backend pode incluir:
  // prestadorInfo?: Pick<User, 'idUsuario' | 'nome' | 'foto'>; // Info básica do prestador
  // avaliacaoMediaPrestador?: number;
  // numeroContratacoesPrestador?: number;
}

/**
 * Interface para os dados necessários ao CRIAR ou ATUALIZAR uma Oferta de Serviço.
 * Baseado nos inputs de OfertaServicoScreen.tsx.
 */
export interface OfferData {
  descricao: string;
  preco: number;
  status: OfferStatus;
  disponibilidade: IDisponibilidade; // Agora espera um objeto estruturado
  // prestadorId é inferido pelo backend via token
}

/**
 * Parâmetros de busca/filtragem para a API de listagem de ofertas.
 * Baseado em BuscarOfertasScreen.tsx.
 */
export interface FetchOffersParams {
  textoPesquisa?: string;
  precoMax?: number;
  precoMin?: number;
  categorias?: string[]; // Exemplo, se houver categorias
  status?: OfferStatus; // Ex: buscar apenas 'ready'
  prestadorId?: string; // Para buscar ofertas de um prestador específico
  sortBy?: 'preco' | 'dataCriacao' | 'avaliacao'; // Exemplo
  sortOrder?: 'asc' | 'desc'; // Exemplo
  page?: number; // Para paginação
  limit?: number; // Para paginação
}
