import { z } from 'zod';

/**
 * Zod schema for ChatMessage
 */
export const chatMessageSchema = z.object({
  _id: z.string().optional(),
  roomId: z.string(),
  senderId: z.string(),
  senderName: z.string().optional(),
  message: z.string().min(1, { message: "Mensagem não pode estar vazia" }),
  timestamp: z.union([
    z.string(),
    z.number()
  ]),
});

// Type inference from the schema
export type ChatMessage = z.infer<typeof chatMessageSchema>;