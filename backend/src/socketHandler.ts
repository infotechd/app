// src/socketHandler.ts (Backend - Convertido para TypeScript)

import { Server, Socket } from 'socket.io';

// Define a interface para os dados recebidos no evento 'sendMessage'
interface SendMessageData {
  roomId: string;
  message: string;
}

// Define a interface para os dados emitidos no evento 'receiveMessage'
interface ReceiveMessageData {
  sender: string; // ID do usuário remetente
  message: string;
  timestamp: Date;
}

// NOTA: Assume-se que a interface do Socket foi estendida em server.ts
// para incluir a propriedade 'user' (via declaration merging),
// contendo o payload decodificado do JWT.
// Exemplo da declaração que deveria estar em server.ts ou um arquivo .d.ts global:
/*
import { JwtPayload } from 'jsonwebtoken';
declare module 'socket.io' {
  interface Socket {
    user?: DecodedUserToken; // Onde DecodedUserToken é sua interface/tipo para o payload JWT
  }
}
interface DecodedUserToken extends JwtPayload {
  userId: string;
  role?: string;
}
*/

// Função que inicializa os listeners de eventos do Socket.IO
function initializeSocketIO(io: Server): void {

  // Listener para novas conexões de socket (já autenticadas pelo middleware em server.ts)
  io.on('connection', (socket: Socket) => {

    // Verifica se o usuário foi anexado corretamente pelo middleware (importante!)
    if (!socket.user || !socket.user.userId) {
      console.error('ERRO: Usuário não autenticado conectado via Socket. Desconectando.');
      socket.disconnect(true); // Força a desconexão se o user não estiver presente
      return;
    }

    const connectedUserId = socket.user.userId; // Guarda o ID para clareza
    console.log(`Usuário conectado via Socket: ${connectedUserId}`);

    // Listener para evento 'joinRoom' (entrar em uma sala)
    socket.on('joinRoom', (roomId: string) => {
      // TODO: Adicionar validação para o roomId (formato, permissão de acesso, etc.)
      if (typeof roomId === 'string' && roomId.trim().length > 0) {
        socket.join(roomId);
        console.log(`Usuário ${connectedUserId} entrou na sala: ${roomId}`);
        // Pode emitir uma notificação para a sala informando que o usuário entrou (opcional)
        // socket.to(roomId).emit('userJoined', { userId: connectedUserId });
      } else {
        console.warn(`Usuário ${connectedUserId} tentou entrar em sala inválida:`, roomId);
        // Pode emitir um erro de volta para o socket
        socket.emit('error', { message: 'ID de sala inválido.' });
      }
    });

    // Listener para evento 'sendMessage' (enviar mensagem para uma sala)
    socket.on('sendMessage', (data: SendMessageData) => {
      // Validação básica dos dados recebidos
      if (!data || typeof data.roomId !== 'string' || typeof data.message !== 'string' || data.message.trim().length === 0) {
        console.warn(`Usuário ${connectedUserId} enviou dados inválidos para sendMessage:`, data);
        return socket.emit('error', { message: 'Dados inválidos para sendMessage (roomId e message são obrigatórios).' });
      }

      // TODO: Verificar se o usuário (socket.user.userId) tem permissão para enviar mensagens nesta roomId

      // TODO: Sanitizar data.message para prevenir XSS, se for renderizado como HTML no frontend

      const messageData: ReceiveMessageData = {
        sender: connectedUserId,
        message: data.message.trim(), // Usa trim para remover espaços extras
        timestamp: new Date(),
      };

      // Envia a mensagem para todos os sockets na sala especificada
      io.to(data.roomId).emit('receiveMessage', messageData);

      // TODO: Persistir a mensagem no banco de dados (talvez um modelo 'MensagemChat')
      // Exemplo: await MensagemChat.create({ salaId: data.roomId, autorId: connectedUserId, conteudo: messageData.message, timestamp: messageData.timestamp });
      console.log(`Mensagem de ${connectedUserId} para sala ${data.roomId}: ${messageData.message}`);
    });

    // Listener para evento 'disconnect' (quando o cliente se desconecta)
    socket.on('disconnect', (reason: string) => {
      console.log(`Usuário desconectado via Socket: ${connectedUserId}. Motivo: ${reason}`);
      // TODO: Lógica adicional de desconexão, se necessário
      // Ex: Notificar outros usuários na sala, atualizar status de presença, etc.
      // io.to(algumaSala).emit('userLeft', { userId: connectedUserId });
    });

    // Adicionar outros listeners de eventos do socket aqui
    /* Exemplo:
    socket.on('typing', (data: { roomId: string }) => {
        if (data && typeof data.roomId === 'string') {
           socket.to(data.roomId).emit('typing', { userId: connectedUserId });
        }
    });
    */
  });
}

// Exporta a função usando export default (padrão ES Modules)
export default initializeSocketIO;