// src/types/chat.ts
/**
 * Definição de tipos para mensagens de chat na aplicação.
 * Este arquivo contém a interface que define a estrutura de uma mensagem de chat.
 */

export interface ChatMessage {
  _id?: string; // ID da mensagem vindo do DB (opcional no envio)
  roomId: string; // ID da sala de chat onde a mensagem foi enviada
  senderId: string; // ID do remetente
  senderName?: string; // Nome (opcional, pode vir do backend)
  message: string; // Conteúdo da mensagem
  timestamp: string | number; // ISO String ou Timestamp number para registrar quando a mensagem foi enviada
}
