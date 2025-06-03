// src/types/notificacao.ts

/**
 * Este arquivo define os tipos e interfaces relacionados às notificações no aplicativo móvel.
 * Inclui definições para tipos de notificação, dados de contexto e respostas da API.
 */

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
 * 
 * Esta interface armazena referências a outros objetos do sistema que estão
 * relacionados com a notificação, facilitando a navegação contextual.
 */
export interface NotificacaoContextData {
  contratacaoId?: string;    // ID da contratação relacionada à notificação
  ofertaId?: string;         // ID da oferta relacionada à notificação
  chatId?: string;           // ID da conversa relacionada à notificação
  usuarioId?: string;        // ID de outro usuário relacionado à notificação
  publicacaoId?: string;     // ID da publicação relacionada à notificação
  // Adicione outros IDs relevantes conforme necessário
}

/**
 * Interface representando um objeto de Notificação individual.
 * Baseado nos dados exibidos e nas ações em NotificacaoScreen.tsx.
 * 
 * Esta interface define a estrutura completa de uma notificação no sistema,
 * incluindo seus atributos obrigatórios e opcionais.
 */
export interface Notificacao {
  _id: string;          // Identificador único da notificação no banco de dados
  usuarioId: string;    // ID do usuário que recebeu a notificação
  titulo: string;       // Título breve da notificação
  mensagem: string;     // Corpo/descrição detalhada da notificação
  lida: boolean;        // Status de leitura (true = lida, false = não lida)
  dataNotificacao: string; // Data/Hora de criação no formato ISO 8601 (ex: "2023-05-20T14:30:00Z")

  // Campos opcionais para enriquecer a notificação
  tipo?: NotificacaoType;     // Categoria da notificação (geral, chat, contratacao, etc.)
  link?: string;              // Link interno (deep link) para navegação no app
  contextData?: NotificacaoContextData; // IDs relacionados para fornecer contexto à notificação
}


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---
// Esta seção define interfaces para as respostas da API relacionadas às notificações.
// Estas interfaces ajudam a tipar corretamente os dados recebidos do backend.

/**
 * Resposta da API ao buscar a lista de notificações do usuário.
 * Esta interface define a estrutura da resposta quando o frontend solicita
 * a lista de notificações de um usuário específico.
 */
export interface FetchNotificacoesResponse {
  notificacoes: Notificacao[];  // Array contendo todas as notificações do usuário
  // Pode incluir contagem de não lidas, paginação, etc.
  // unreadCount?: number;      // Número de notificações não lidas
}

/**
 * Resposta genérica da API após uma ação em uma notificação (marcar como lida, excluir).
 * Esta interface define a estrutura da resposta quando o frontend realiza
 * operações como marcar uma notificação como lida ou excluir uma notificação.
 */
export interface NotificacaoActionResponse {
  message: string;              // Mensagem de sucesso ou erro da operação
  notificacao?: Notificacao;    // Opcional: retorna a notificação atualizada após a ação
}
