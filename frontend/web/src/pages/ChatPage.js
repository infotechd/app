import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

/**
 * ChatPage – Página de Chat Integrado para Web.
 * Permite comunicação em tempo real entre Buyer e Service Provider.
 * O token JWT é recuperado (por exemplo, do localStorage) e o roomId é definido (geralmente pela lógica de negócios).
 */
export default function ChatPage() {
  // Recupera o token JWT do localStorage.
  const token = localStorage.getItem('token');

  // Em uma aplicação real, se o token não existir, redirecione para a tela de login ou exiba uma mensagem.
  useEffect(() => {
    if (!token) {
      console.warn("Token não encontrado. Usuário não autenticado.");
      // Exemplo: redirecionar ou exibir alerta (não implementado aqui)
    }
  }, [token]);

  // Define um roomId; em um cenário real, isso deve ser determinado pela lógica de negócio (ex.: combinação dos IDs dos usuários).
  const roomId = "room_exemplo";

  // Estados para gerenciar o socket, a mensagem corrente e a lista de mensagens.
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Conecta ao servidor Socket.IO, enviando o token para autenticação
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    setSocket(newSocket);

    // Quando a conexão for estabelecida, o socket se junta à sala especificada
    newSocket.on('connect', () => {
      console.log("Conexão estabelecida com o socket.");
      newSocket.emit('joinRoom', roomId);
    });

    // Trata erros de conexão e exibe no console
    newSocket.on('connect_error', (err) => {
      console.error("Erro na conexão com o socket:", err);
    });

    // Escuta o evento de recebimento de mensagem e atualiza o estado de mensagens
    newSocket.on('receiveMessage', (msgData) => {
      setMessages((prev) => [...prev, msgData]);
    });

    // Limpeza: desconecta o socket ao desmontar o componente
    return () => newSocket.disconnect();
  }, [token, roomId]);

  /**
   * handleSendMessage – Envia uma mensagem para a sala atual.
   * Verifica se a mensagem não é vazia e utiliza o socket para enviar a mensagem.
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (socket && trimmedMessage) {
      socket.emit('sendMessage', { roomId, message: trimmedMessage });
      setMessage('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Chat Integrado</h2>
      {/* Área para exibição das mensagens */}
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#eee', borderRadius: '5px' }}
          >
            <p>{msg.message}</p>
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      {/* Formulário para enviar uma nova mensagem */}
      <form onSubmit={handleSendMessage} style={{ marginTop: '10px' }}>
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '80%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
