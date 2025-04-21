// src/types/chat.ts
export interface ChatMessage {
  _id?: string; // ID da mensagem vindo do DB (opcional no envio)
  roomId: string;
  senderId: string; // ID do remetente
  senderName?: string; // Nome (opcional, pode vir do backend)
  message: string;
  timestamp: string | number; // ISO String ou Timestamp number
}