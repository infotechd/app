// src/types/publicacao.ts

// Importar User se for incluir dados do autor diretamente
import { User } from './user';

/**
 * Define os tipos possíveis de publicação na comunidade.
 * Baseado em CommunityScreen.tsx.
 */
export type PublicacaoType = 'post' | 'evento';

/**
 * Define os status possíveis de uma publicação, considerando moderação.
 * Inferido da necessidade de buscar posts 'aprovados' e do fluxo comum de moderação.
 */
export type PublicacaoStatus = 'pending_approval' | 'approved' | 'rejected' | 'hidden_by_user' | 'hidden_by_admin';

/**
 * Interface opcional para detalhes específicos de um evento.
 * Usado se o tipo da Publicacao for 'evento'. Baseado no Caso de Uso 8.
 */
export interface EventoDetails {
  /** Data/Hora do evento (formato ISO 8601 string) */
  dataEvento: string;
  /** Local do evento (opcional) */
  local?: string;
  /** Tema/Tópico do evento (opcional) */
  tema?: string;
}

/**
 * Interface representando uma Publicação na comunidade (Post ou Evento).
 * Baseado no Diagrama de Classe, Caso de Uso 8 e CommunityScreen.tsx.
 */
export interface Publicacao {
  _id: string; // Identificador único
  conteudo: string; // Conteúdo textual do post/evento
  tipo: PublicacaoType; // 'post' ou 'evento'
  status: PublicacaoStatus; // Status da publicação (moderação)
  dataPostagem: string; // Data de criação (ISO 8601 string)
  autorId: string; // ID do usuário que criou

  /** Opcional: Backend pode popular info básica do autor para facilitar exibição */
  autor?: Pick<User, 'idUsuario' | 'nome' | 'foto'>; // Exemplo

  /** Opcional: Detalhes específicos se for um evento */
  detalhesEvento?: EventoDetails;

  // Outros campos possíveis:
  // imagemUrl?: string;
  // videoUrl?: string;
  // likes?: string[]; // Array de User IDs que curtiram
  // comentariosCount?: number;
}

/**
 * Interface para os dados necessários ao CRIAR uma nova Publicação.
 * Baseado nos inputs de CommunityScreen.tsx.
 */
export interface PublicacaoData {
  conteudo: string;
  tipo: PublicacaoType;
  /** Detalhes do evento (obrigatório se tipo='evento', opcional senão?) */
  detalhesEvento?: EventoDetails;
  // autorId é inferido pelo backend via token
  // status inicial é definido pelo backend (ex: 'pending_approval')
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---

/** Resposta da API ao buscar a lista de publicações */
export interface FetchPublicacoesResponse {
  publicacoes: Publicacao[];
  // paginacao...
}

/** Resposta da API após criar uma publicação */
export interface CreatePublicacaoResponse {
  message: string;
  publicacao?: Publicacao; // Opcional: API pode retornar o objeto criado
}