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

// 1. Importações - Componentes e bibliotecas necessárias para o chat
//import io from 'socket.io-client';
import { io, Socket } from 'socket.io-client'; // Biblioteca para comunicação em tempo real
//import { type Socket } from 'socket.io-client';


import { useAuth } from "@/context/AuthContext"; // Contexto de autenticação para obter dados do usuário
import { ChatMessage } from "@/types/chat"; // Importa tipo da mensagem para tipagem forte
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipagem para navegação
import { RootStackParamList } from "@/navigation/types"; // Tipos de parâmetros para navegação


// 2. Tipo das Props - Define o tipo das propriedades recebidas pela tela de chat
type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// ENDEREÇO DO SEU BACKEND SOCKET.IO - URL do servidor que gerencia as conexões de chat
const SOCKET_SERVER_URL = 'http://localhost:5000';

/**
 * ChatScreen – Tela de Chat Integrado em Tempo Real
 * Componente responsável por exibir e gerenciar a interface de chat,
 * incluindo conexão com servidor, envio e recebimento de mensagens.
 */
export default function ChatScreen({ route }: ChatScreenProps) {
  // 3. Extrair roomId e obter usuário/token - Obtém o ID da sala de chat e informações do usuário
  const { roomId } = route.params;
  const { user } = useAuth();

  // 4. Estados com Tipagem - Gerencia os estados do componente com tipagem forte
  const [socket, setSocket] = useState<Socket | null>(null); // Instância do socket para comunicação
  const [message, setMessage] = useState<string>(''); // Mensagem atual sendo digitada
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Lista de mensagens do chat
  const [isConnected, setIsConnected] = useState<boolean>(false); // Estado de conexão com o servidor
  const [connectionError, setConnectionError] = useState<string | null>(null); // Mensagem de erro de conexão

  const flatListRef = useRef<FlatList<ChatMessage>>(null); // Referência para controlar o scroll da lista

  // 5. Lógica do Socket.IO com Tipagem - Gerencia a conexão com o servidor de chat
  useEffect(() => {
    // Verificações de segurança antes de tentar conectar
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
    // Cria uma nova instância de socket com configurações de autenticação
    const newSocket: Socket = io(SOCKET_SERVER_URL, {
      auth: { token: user.token },
      // Query pode ser usada para passar roomId se o backend preferir
      // query: { roomId }
      reconnectionAttempts: 5, // Tenta reconectar algumas vezes
      timeout: 10000, // Tempo limite de conexão
    });
    setSocket(newSocket);
    setConnectionError(null);

    // Evento disparado quando a conexão é estabelecida com sucesso
    newSocket.on('connect', () => {
      console.log('Socket conectado:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      newSocket.emit('joinRoom', roomId); // Entra na sala após conectar
      // Opcional: Buscar histórico aqui
      // newSocket.emit('getHistory', roomId, (history: ChatMessage[]) => setMessages(history || []));
    });

    // Evento disparado quando ocorre um erro na conexão
    newSocket.on('connect_error', (err: Error) => {
      console.error('Socket erro de conexão:', err);
      setIsConnected(false);
      setConnectionError(`Falha ao conectar: ${err.message}`);
    });

    // Evento disparado quando a conexão é encerrada
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

    // Listener para receber mensagens - recebe e processa mensagens de outros usuários
    newSocket.on('receiveMessage', (msgData: ChatMessage) => {
      // Validar msgData minimamente para garantir integridade
      if (msgData && msgData.message && msgData.senderId && msgData.roomId === roomId) {
        setMessages((prevMessages) => [...prevMessages, msgData]);
      } else {
        console.warn("Mensagem recebida inválida ou para outra sala:", msgData);
      }
    });

    // Listener para erros específicos do chat (ex: sala não encontrada)
    newSocket.on('chatError', (errorMessage: string) => {
      console.error('Erro de Chat:', errorMessage);
      Alert.alert("Erro no Chat", errorMessage);
      // Talvez desconectar ou tratar de outra forma
    });

    // Função de limpeza - remove listeners e desconecta o socket quando o componente é desmontado
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
  }, [user?.token, roomId]); // Dependências - recria a conexão se o token ou roomId mudar

  // Rolagem automática para o final da lista quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100); // Pequeno delay para garantir renderização
    }
  }, [messages]);

  // 6. Função de envio de mensagem com tipagem
  const handleSendMessage = () => {
    if (socket && isConnected && message.trim() && user) {
      // Cria objeto com dados da mensagem a ser enviada
      const messageData: Partial<ChatMessage> = { // Envia apenas o necessário
        roomId: roomId,
        message: message.trim(),
      };
      // Emite evento de envio de mensagem para o servidor
      socket.emit('sendMessage', messageData);
      setMessage(''); // Limpa o campo de mensagem após envio
    } else if (!isConnected) {
      Alert.alert("Erro", "Não conectado ao chat para enviar mensagem.");
    }
  };

  // 7. Funções de renderização da lista de mensagens com tipagem
  // Renderiza cada item da lista de mensagens
  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>): React.ReactElement => {
    const isMyMessage = item.senderId === user?.idUsuario; // Verifica se a mensagem é do usuário atual
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

  // Gera chaves únicas para cada item da lista
  const keyExtractor = (item: ChatMessage, index: number): string => item._id || `msg-${index}`;

  // Renderização do componente principal
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajuste offset do header se necessário
    >
      {/* Indicador de Status da Conexão */}
      <View style={[
        styles.connectionStatus,
        isConnected ? styles.connected : styles.disconnected
      ]}>
        <Text style={styles.statusText}>
          {isConnected ? 'Conectado' : (connectionError || 'Desconectado')}
        </Text>
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.messageList}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* Área de Entrada de Mensagem */}
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

// 8. Estilos - Definição dos estilos visuais dos componentes
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Container principal que ocupa toda a tela
  connectionStatus: { paddingVertical: 4, alignItems: 'center' }, // Barra de status de conexão
  connected: { backgroundColor: '#d4edda' }, // Verde claro - indica conexão ativa
  disconnected: { backgroundColor: '#f8d7da' }, // Vermelho claro - indica desconexão
  statusText: { fontSize: 12, fontWeight: 'bold' }, // Texto de status
  errorText: { color: '#721c24' }, // Cor de texto de erro - herdado de statusText se dentro do View
  messageList: { flex: 1, paddingHorizontal: 10 }, // Lista de mensagens
  messageBubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 15, marginVertical: 4, maxWidth: '80%' }, // Bolha de mensagem
  myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end', borderBottomRightRadius: 5 }, // Estilo para mensagens enviadas pelo usuário
  otherMessage: { backgroundColor: '#eee', alignSelf: 'flex-start', borderBottomLeftRadius: 5 }, // Estilo para mensagens recebidas
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#3498db', marginBottom: 2 }, // Nome do remetente
  messageText: { fontSize: 15 }, // Texto da mensagem
  timestamp: { fontSize: 10, color: '#777', alignSelf: 'flex-end', marginTop: 2 }, // Horário da mensagem
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#ccc', backgroundColor: '#f9f9f9' }, // Container do campo de entrada
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: 10, backgroundColor: '#fff', maxHeight: 100 }, // Campo de texto para digitar mensagens
});
