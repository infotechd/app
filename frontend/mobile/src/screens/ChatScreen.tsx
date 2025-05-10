import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ListRenderItemInfo,
  Alert
} from 'react-native';

// 1. Imports
//import io from 'socket.io-client';
import { io, Socket } from 'socket.io-client';
//import { type Socket } from 'socket.io-client';


import { useAuth } from "@/context/AuthContext";
import { ChatMessage } from "@/types/chat"; // Importa tipo da mensagem (ajuste o caminho)
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";


// 2. Tipo das Props
type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// ENDEREÇO DO SEU BACKEND SOCKET.IO
const SOCKET_SERVER_URL = 'http://localhost:5000';

/**
 * ChatScreen – Tela de Chat Integrado em Tempo Real
 */
export default function ChatScreen({ route }: ChatScreenProps) {
  // 3. Extrair roomId e obter usuário/token
  const { roomId } = route.params;
  const { user } = useAuth();

  // 4. Tipar Estados
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // 5. Lógica do 'Socket'.IO com Tipagem
  useEffect(() => {
    if (!user?.token) {
      setConnectionError("Autenticação necessária.");
      console.error("ChatScreen: Token não encontrado.");
      return;
    }
    if (!roomId) {
      setConnectionError("ID da sala não fornecido.");
      console.error("ChatScreen: RoomId não encontrado.");
      return;
    }

    console.log(`Tentando conectar ao chat room: ${roomId}`);
    const newSocket: Socket = io(SOCKET_SERVER_URL, {
      auth: { token: user.token },
      // Query pode ser usada para passar roomId se o backend preferir
      // query: { roomId }
      reconnectionAttempts: 5, // Tenta reconectar algumas vezes
      timeout: 10000, // Timeout de conexão
    });
    setSocket(newSocket);
    setConnectionError(null);

    newSocket.on('connect', () => {
      console.log('Socket conectado:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      newSocket.emit('joinRoom', roomId); // Entra na sala após conectar
      // Opcional: Buscar histórico aqui
      // newSocket.emit('getHistory', roomId, (history: ChatMessage[]) => setMessages(history || []));
    });

    newSocket.on('connect_error', (err: Error) => {
      console.error('Socket erro de conexão:', err);
      setIsConnected(false);
      setConnectionError(`Falha ao conectar: ${err.message}`);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Socket desconectado:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Tentar reconectar se o servidor desconectar
        // newSocket.connect(); // Cuidado com loops infinitos
        setConnectionError("Desconectado pelo servidor.");
      } else {
        setConnectionError("Desconectado do chat.");
      }
    });

    // Listener para receber mensagens - tipar msgData
    newSocket.on('receiveMessage', (msgData: ChatMessage) => {
      // Validar msgData minimamente
      if (msgData && msgData.message && msgData.senderId && msgData.roomId === roomId) {
        setMessages((prevMessages) => [...prevMessages, msgData]);
      } else {
        console.warn("Mensagem recebida inválida ou para outra sala:", msgData);
      }
    });

    // Listener para erros específicos do chat (ex: sala não encontrada)
    newSocket.on('chatError', (errorMessage: string) => {
      console.error('Chat Error:', errorMessage);
      Alert.alert("Erro no Chat", errorMessage);
      // Talvez desconectar ou tratar de outra forma
    });

    // Limpeza
    return () => {
      console.log('Desconectando socket...');
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('receiveMessage');
      newSocket.off('chatError');
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?.token, roomId]); // Dependências

  // Scroll to end
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); // Pequeno delay
    }
  }, [messages]);

  // 6. Tipar handleSendMessage
  const handleSendMessage = () => {
    if (socket && isConnected && message.trim() && user) {
      const messageData: Partial<ChatMessage> = { // Envia apenas o necessário
        roomId: roomId,
        message: message.trim(),
      };
      // Tipar o evento e os dados emitidos
      socket.emit('sendMessage', messageData);
      setMessage('');
    } else if (!isConnected) {
      Alert.alert("Erro", "Não conectado ao chat para enviar mensagem.");
    }
  };

  // 7. Tipar renderItem e keyExtractor
  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>): React.ReactElement => {
    const isMyMessage = item.senderId === user?.idUsuario;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        {!isMyMessage && item.senderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.timestamp}>
          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
        </Text>
      </View>
    );
  };

  const keyExtractor = (item: ChatMessage, index: number): string => item._id || `msg-${index}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajuste offset do header se necessário
    >
      {/* Status da Conexão */}
      <View style={[
        styles.connectionStatus,
        isConnected ? styles.connected : styles.disconnected
      ]}>
        <Text style={styles.statusText}>
          {isConnected ? 'Conectado' : (connectionError || 'Desconectado')}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          value={message}
          onChangeText={setMessage}
          editable={isConnected}
          multiline
        />
        <Button
          title="Enviar"
          onPress={handleSendMessage}
          disabled={!isConnected || !message.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// 8. Estilos (similares aos da conversão anterior)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  connectionStatus: { paddingVertical: 4, alignItems: 'center' },
  connected: { backgroundColor: '#d4edda' }, // Verde claro
  disconnected: { backgroundColor: '#f8d7da' }, // Vermelho claro
  statusText: { fontSize: 12, fontWeight: 'bold' },
  errorText: { color: '#721c24' }, // herdado de statusText se dentro do View
  messageList: { flex: 1, paddingHorizontal: 10 },
  messageBubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, marginVertical: 4, maxWidth: '80%' },
  myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end', borderBottomRightRadius: 5 },
  otherMessage: { backgroundColor: '#eee', alignSelf: 'flex-start', borderBottomLeftRadius: 5 },
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#3498db', marginBottom: 2 },
  messageText: { fontSize: 15 },
  timestamp: { fontSize: 10, color: '#777', alignSelf: 'flex-end', marginTop: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#ccc', backgroundColor: '#f9f9f9' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: 10, backgroundColor: '#fff', maxHeight: 100 },
});
