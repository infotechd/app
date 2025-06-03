// src/types/publicacao.ts
// Arquivo que define os tipos relacionados a publicações na comunidade

// Importar User se for incluir dados do autor diretamente
import { User } from './user';

/**
 * Define os tipos possíveis de publicação na comunidade.
 * Baseado em CommunityScreen.tsx.
 * 
 * 'post': Publicação de texto simples
 * 'evento': Publicação que representa um evento com data e local
 */
export type PublicacaoType = 'post' | 'evento';

/**
 * Define os status possíveis de uma publicação, considerando moderação.
 * Inferido da necessidade de buscar posts 'aprovados' e do fluxo comum de moderação.
 * 
 * 'pending_approval': Aguardando aprovação do moderador
 * 'approved': Publicação aprovada e visível para todos
 * 'rejected': Publicação rejeitada pelo moderador
 * 'hidden_by_user': Publicação ocultada pelo próprio autor
 * 'hidden_by_admin': Publicação ocultada por um administrador
 */
export type PublicacaoStatus = 'pending_approval' | 'approved' | 'rejected' | 'hidden_by_user' | 'hidden_by_admin';

/**
 * Interface opcional para detalhes específicos de um evento.
 * Usado se o tipo da Publicacao for 'evento'. Baseado no Caso de Uso 8.
 * Contém informações adicionais necessárias para eventos como data, local e tema.
 */
export interface EventoDetails {
  /** Data/Hora do evento (formato ISO 8601 string) */
  dataEvento: string;
  /** Local do evento (opcional) - Pode ser endereço físico ou virtual */
  local?: string;
  /** Tema/Tópico do evento (opcional) - Assunto principal do evento */
  tema?: string;
}

/**
 * Interface representando uma Publicação na comunidade (Post ou Evento).
 * Baseado no Diagrama de Classe, Caso de Uso 8 e CommunityScreen.tsx.
 * Esta é a estrutura principal que define como as publicações são armazenadas e exibidas.
 */
export interface Publicacao {
  _id: string; // Identificador único da publicação no banco de dados
  conteudo: string; // Conteúdo textual do post/evento - o texto principal da publicação
  tipo: PublicacaoType; // 'post' ou 'evento' - define o tipo de publicação
  status: PublicacaoStatus; // Status da publicação (moderação) - controla visibilidade
  dataPostagem: string; // Data de criação (ISO 8601 string) - quando foi publicado
  autorId: string; // ID do usuário que criou a publicação

  /** 
   * Opcional: Backend pode popular info básica do autor para facilitar exibição 
   * Contém dados básicos do autor para mostrar junto com a publicação
   */
  autor?: Pick<User, 'idUsuario' | 'nome' | 'foto'>; // Exemplo de dados do autor

  /** 
   * Opcional: Detalhes específicos se for um evento 
   * Presente apenas quando tipo='evento'
   */
  detalhesEvento?: EventoDetails;

  // Outros campos possíveis que podem ser implementados no futuro:
  // imagemUrl?: string; - URL para imagem anexada à publicação
  // videoUrl?: string; - URL para vídeo anexado à publicação
  // likes?: string[]; // Array de User IDs que curtiram a publicação
  // comentariosCount?: number; - Contador de comentários na publicação
}

/**
 * Interface para os dados necessários ao CRIAR uma nova Publicação.
 * Baseado nos inputs de CommunityScreen.tsx.
 * Define o conjunto mínimo de dados que o usuário precisa fornecer para criar uma publicação.
 */
export interface PublicacaoData {
  conteudo: string; // Texto principal da publicação
  tipo: PublicacaoType; // Tipo da publicação (post ou evento)
  /** 
   * Detalhes do evento (obrigatório se tipo='evento', opcional senão?) 
   * Contém informações específicas para eventos
   */
  detalhesEvento?: EventoDetails;
  // autorId é inferido pelo backend via token de autenticação
  // status inicial é definido pelo backend (ex: 'pending_approval')
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---

/** 
 * Resposta da API ao buscar a lista de publicações 
 * Estrutura retornada quando o frontend solicita publicações do backend
 */
export interface FetchPublicacoesResponse {
  publicacoes: Publicacao[]; // Array com as publicações retornadas
  // paginacao... - Futuramente pode incluir dados de paginação
}

/** 
 * Resposta da API após criar uma publicação 
 * Estrutura retornada quando uma nova publicação é criada com sucesso
 */
export interface CreatePublicacaoResponse {
  message: string; // Mensagem de sucesso ou erro
  publicacao?: Publicacao; // Opcional: API pode retornar o objeto criado com seus dados completos
}
