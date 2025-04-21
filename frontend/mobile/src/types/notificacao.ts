// src/types/notificacao.ts

/**
 * Define categorias possíveis para uma notificação.
 * Isso pode ajudar a exibir ícones diferentes ou agrupar notificações.
 * (Estes são exemplos, ajuste conforme os tipos de notificação do seu app)
 */
export type NotificacaoType =
  | 'geral'
  | 'chat'
  | 'contratacao'
  | 'oferta'
  | 'pagamento'
  | 'avaliacao'
  | 'comunidade'
  | 'sistema';

/**
 * Interface opcional para conter IDs ou dados relacionados à notificação,
 * permitindo navegação ou ações contextuais.
 */
export interface NotificacaoContextData {
  contratacaoId?: string;
  ofertaId?: string;
  chatId?: string;
  usuarioId?: string; // ID de outro usuário relacionado
  publicacaoId?: string;
  // Adicione outros IDs relevantes
}

/**
 * Interface representando um objeto de Notificação individual.
 * Baseado nos dados exibidos e nas ações em NotificacaoScreen.tsx.
 */
export interface Notificacao {
  _id: string;          // Identificador único da notificação
  usuarioId: string;    // ID do usuário que recebeu a notificação
  titulo: string;       // Título breve
  mensagem: string;     // Corpo/descrição da notificação
  lida: boolean;        // Status de leitura (true/false)
  dataNotificacao: string; // Data/Hora de criação (ISO 8601 string)

  // Campos opcionais para enriquecer a notificação
  tipo?: NotificacaoType;     // Categoria da notificação
  link?: string;            // Link interno (deep link) para o app
  contextData?: NotificacaoContextData; // IDs relacionados para contexto
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---

/** Resposta da API ao buscar a lista de notificações do usuário */
export interface FetchNotificacoesResponse {
  notificacoes: Notificacao[];
  // Pode incluir contagem de não lidas, paginação, etc.
  // unreadCount?: number;
}

/** Resposta genérica da API após uma ação em uma notificação (marcar como lida, excluir) */
export interface NotificacaoActionResponse {
  message: string;
  notificacao?: Notificacao; // Opcional: pode retornar a notificação atualizada
}