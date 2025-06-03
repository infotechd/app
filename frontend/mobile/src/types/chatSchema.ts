import { z } from 'zod';

/**
 * Esquema Zod para ChatMessage (Mensagem de Chat)
 * 
 * Descrição: Define a estrutura de dados para mensagens de chat no sistema.
 * Este esquema utiliza a biblioteca Zod para validar que as mensagens
 * contenham todos os campos necessários no formato correto.
 */
export const chatMessageSchema = z.object({
  _id: z.string().optional(), // Identificador único da mensagem (opcional)
  roomId: z.string(), // Identificador da sala de chat
  senderId: z.string(), // Identificador do usuário que enviou a mensagem
  senderName: z.string().optional(), // Nome do remetente (opcional)
  message: z.string().min(1, { message: "Mensagem não pode estar vazia" }), // Conteúdo da mensagem
  timestamp: z.union([
    z.string(), // Formato de string para timestamp
    z.number() // Formato numérico para timestamp (unix timestamp)
  ]), // Momento em que a mensagem foi enviada
});

// Inferência de tipo a partir do esquema
export type ChatMessage = z.infer<typeof chatMessageSchema>;
