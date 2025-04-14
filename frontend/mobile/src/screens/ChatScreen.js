import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import io from 'socket.io-client';

/**
 * ChatScreen – Tela de Chat Integrado
 * Permite a comunicação em tempo real entre Buyer e Service Provider.
 * Utiliza Socket.IO para enviar e receber mensagens.
 *
 * Requisitos:
 * - O token JWT é passado via route.params para autenticação.
 * - roomId é definido para identificar a sala de chat (ex.: combinação dos IDs dos participantes).
 */
export default function ChatScreen({ route }) {
  // Obtém token e roomId passados como parâmetros via navegação
  const { token, roomId } = route.params;
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Conecta ao servidor Socket.IO e passa o token para autenticação
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    setSocket(newSocket);

    // Após a conexão, junta o usuário à sala específica (roomId)
    newSocket.on('connect', () => {
      newSocket.emit('joinRoom', roomId);
    });

    // Escuta mensagens recebidas
    newSocket.on('receiveMessage', (msgData) => {
      setMessages((prev) => [...prev, msgData]);
    });

    // Desconecta o socket ao desmontar o componente
    return () => newSocket.disconnect();
  }, [token, roomId]);

  // Função para enviar uma mensagem
  const handleSendMessage = () => {
    if (socket && message.trim()) {
      socket.emit('sendMessage', { roomId, message });
      setMessage('');
    }
  };

  // Renderiza cada mensagem
  const renderItem = ({ item }) => (
    <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#eee', borderRadius: 5 }}>
      <Text>{item.message}</Text>
      <Text style={{ fontSize: 10, color: '#666' }}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, padding: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        style={{ flex: 1 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 }}
          placeholder="Digite sua mensagem..."
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Enviar" onPress={handleSendMessage} />
      </View>
    </KeyboardAvoidingView>
  );
}
