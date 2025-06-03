/**
 * NotificacaoScreen.tsx
 * 
 * Este arquivo contém o componente de tela para exibir e gerenciar notificações no aplicativo móvel.
 * O componente permite aos usuários visualizar suas notificações, marcá-las como lidas e excluí-las.
 * 
 * Estrutura do arquivo:
 * 1. Importações - Importa os componentes e hooks necessários do React e React Native
 * 2. Tipos - Define os tipos de props e outros tipos necessários
 * 3. Componente principal - Implementa a lógica e renderização da tela
 * 4. Funções auxiliares - Funções para carregar, marcar como lida e excluir notificações
 * 5. Renderização - Lógica para renderizar os itens da lista e a tela principal
 * 6. Estilos - Define os estilos CSS para os componentes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  ListRenderItem
} from 'react-native';

// Importação de tipos do React

/**
 * Seção de Importações
 * 
 * Aqui importamos os componentes, hooks e tipos necessários para o funcionamento da tela.
 * - useAuth: Hook para acessar o contexto de autenticação
 * - API functions: Funções para interagir com o backend
 * - Tipos: Definições de tipos para TypeScript
 */
// 1. Imports
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotificacoes as apiFetchNotificacoes,
  markNotificacaoAsRead as apiMarkRead,
  deleteNotificacao as apiDeleteNotificacao
} from '../services/api';
import { Notificacao } from "@/types/notificacao";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

/**
 * Seção de Tipos
 * 
 * Define os tipos utilizados no componente para garantir type safety.
 * NotificacaoScreenProps: Define o tipo das props recebidas pelo componente.
 */
// 2. Tipo das Props
type NotificacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Notificacao'>;

/**
 * NotificacaoScreen – Tela para exibir e gerenciar notificações (Mobile)
 * 
 * Este componente é responsável por:
 * - Exibir a lista de notificações do usuário
 * - Permitir marcar notificações como lidas
 * - Permitir excluir notificações
 * - Atualizar a lista de notificações (pull-to-refresh)
 * 
 * O componente utiliza estados para gerenciar:
 * - Lista de notificações
 * - Estado de carregamento
 * - Erros
 * - Ações em andamento (marcar como lida/excluir)
 */
export default function NotificacaoScreen({ }: NotificacaoScreenProps) {
  /**
   * Autenticação
   * 
   * Obtém o usuário autenticado e seu token de acesso do contexto de autenticação.
   * Este token será usado para fazer requisições autenticadas à API.
   */
  // 3. Obter usuário/token
  const { user } = useAuth();

  /**
   * Estados do Componente
   * 
   * Gerencia os estados necessários para o funcionamento do componente:
   * - notifications: Lista de notificações do usuário
   * - loading: Indica se está carregando dados
   * - error: Armazena mensagens de erro, se houver
   * - actionLoadingId: Controla qual notificação está sendo processada
   */
  // 4. Tipar Estados
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Guarda o ID da notificação que está sofrendo uma ação (lida/excluir)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  /**
   * Função para Carregar Notificações
   * 
   * Esta função é responsável por buscar as notificações do usuário na API.
   * Parâmetros:
   * - isRefreshing: Indica se é uma atualização manual (pull-to-refresh)
   * 
   * Comportamento:
   * 1. Verifica se o usuário está autenticado
   * 2. Atualiza o estado de carregamento
   * 3. Faz a requisição à API
   * 4. Atualiza o estado com as notificações recebidas ou com o erro
   */
  // 5. Refatorar fetchNotificacoes
  const loadNotifications = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária para ver notificações.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const response = await apiFetchNotificacoes(user.token);
      setNotifications(response.notificacoes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar notificações';
      setError(msg);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  /**
   * Efeito de Carregamento Inicial
   * 
   * Este useEffect é executado quando o componente é montado ou quando
   * a função loadNotifications muda (devido a mudanças no token).
   * 
   * Ele carrega as notificações do usuário automaticamente ao entrar na tela.
   */
  useEffect(() => {
    const fetchData = async () => {
      await loadNotifications();
    };

    // Trata a Promise adequadamente para evitar o aviso
    void fetchData();
  }, [loadNotifications]);

  /**
   * Função para Marcar Notificação como Lida
   * 
   * Esta função é chamada quando o usuário clica no botão "Marcar como lida".
   * Parâmetros:
   * - id: ID da notificação a ser marcada como lida
   * 
   * Comportamento:
   * 1. Verifica se o usuário está autenticado e se não há outra ação em andamento
   * 2. Atualiza o estado para indicar que esta notificação está sendo processada
   * 3. Faz a requisição à API para marcar a notificação como lida
   * 4. Atualiza a lista de notificações
   * 5. Trata erros, se houver
   */
  // 6. Refatorar handleMarkAsRead
  const handleMarkAsRead = async (id: string) => {
    if (!user?.token || actionLoadingId) return; // Impede múltiplas ações
    setActionLoadingId(id); // Define qual item está carregando
    try {
      await apiMarkRead(user.token, id);
      // Atualiza a lista localmente ou busca novamente
      // Buscar novamente é mais simples, mas pode ser menos performático
      await loadNotifications(true); // Recarrega silenciosamente
      // Ou: Atualização otimista (mais complexo)
      /*
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, lida: true } : n))
      );
      */
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível marcar como lida.');
    } finally {
      setActionLoadingId(null); // Libera o loading
    }
  };

  /**
   * Função para Excluir Notificação
   * 
   * Esta função é chamada quando o usuário clica no botão "Excluir".
   * Parâmetros:
   * - id: ID da notificação a ser excluída
   * 
   * Comportamento:
   * 1. Verifica se o usuário está autenticado e se não há outra ação em andamento
   * 2. Exibe um diálogo de confirmação
   * 3. Se confirmado, atualiza o estado para indicar que esta notificação está sendo processada
   * 4. Faz a requisição à API para excluir a notificação
   * 5. Atualiza a lista de notificações
   * 6. Trata erros, se houver
   */
  // 7. Refatorar handleDelete
  const handleDelete = async (id: string) => {
    if (!user?.token || actionLoadingId) return;
    // Confirmação antes de excluir
    Alert.alert("Confirmar Exclusão", "Deseja realmente excluir esta notificação?", [
      { text: "Cancelar", style: "cancel"},
      { text: "Excluir", style: "destructive", onPress: async () => {
          setActionLoadingId(id);
          try {
            // Garantir que token é uma string
            const token = user.token;
            if (!token) {
              throw new Error("Token de autenticação não disponível");
            }
            await apiDeleteNotificacao(token, id);
            // Atualiza a lista localmente ou busca novamente
            await loadNotifications(true); // Recarrega silenciosamente
            // Ou: Atualização otimista
            // setNotifications(prev => prev.filter(n => n._id !== id));
          } catch (err) {
            Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível excluir.');
          } finally {
            setActionLoadingId(null);
          }
        }}
    ])
  };


  /**
   * Função de Renderização de Item
   * 
   * Esta função é responsável por renderizar cada item da lista de notificações.
   * Parâmetros:
   * - item: A notificação a ser renderizada
   * 
   * Comportamento:
   * 1. Verifica se esta notificação está sendo processada
   * 2. Renderiza o título, mensagem e data da notificação
   * 3. Exibe o status (lida/não lida)
   * 4. Renderiza os botões de ação (marcar como lida/excluir)
   * 5. Mostra um indicador de carregamento durante ações
   */
  // 8. Tipar renderItem
  const renderItem: ListRenderItem<Notificacao> = ({ item }) => {
    const isActionLoading = actionLoadingId === item._id; // Verifica se este item está carregando

    return (
      <View style={[styles.itemContainer, item.lida ? styles.itemRead : styles.itemUnread]}>
        <Text style={styles.itemTitle}>{item.titulo}</Text>
        <Text style={styles.itemMessage}>{item.mensagem}</Text>
        <Text style={styles.itemDate}>
          {new Date(item.dataNotificacao).toLocaleString('pt-BR')}
        </Text>
        <Text style={item.lida ? styles.readStatus : styles.unreadStatus}>
          {item.lida ? 'Lida' : 'Não lida'}
        </Text>
        {/* Ações */}
        <View style={styles.actionsContainer}>
          {isActionLoading ? (
            <ActivityIndicator size="small" color="#888" />
          ) : (
            <>
              {!item.lida && ( // Só mostra "Marcar como lida" se não estiver lida
                <TouchableOpacity
                  onPress={() => handleMarkAsRead(item._id)}
                  style={styles.actionButton}
                  disabled={isActionLoading}
                >
                  <Text style={styles.actionTextRead}>Marcar como lida</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleDelete(item._id)}
                style={styles.actionButton}
                disabled={isActionLoading}
              >
                <Text style={styles.actionTextDelete}>Excluir</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  /**
   * Função keyExtractor
   * 
   * Esta função extrai uma chave única para cada item da lista.
   * É necessária para que o React possa identificar cada item de forma única.
   * Retorna o ID da notificação como chave.
   */
  const keyExtractor = (item: Notificacao): string => item._id;

  /**
   * Componente para Lista Vazia
   * 
   * Este componente é renderizado quando não há notificações para exibir.
   * Mostra uma mensagem informativa ao usuário.
   */
  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhuma notificação.</Text>
    </View>
  );

  /**
   * Renderização Principal
   * 
   * Esta seção contém a lógica de renderização principal do componente.
   * - Se estiver carregando e não houver notificações, mostra um indicador de carregamento
   * - Caso contrário, renderiza o título da tela, mensagens de erro (se houver) e a lista de notificações
   * - A lista suporta pull-to-refresh para atualização manual
   */
  // Renderização principal
  if (loading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Notificações</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={()=>loadNotifications(true)} />
        }
      />
    </View>
  );
}

/**
 * Estilos do Componente
 * 
 * Define os estilos CSS para todos os elementos visuais do componente.
 * Inclui estilos para:
 * - Container da tela
 * - Título da tela
 * - Containers centralizados
 * - Itens de notificação (lidas e não lidas)
 * - Textos (título, mensagem, data, status)
 * - Botões de ação
 * - Mensagens de erro
 */
// 9. Estilos
const styles = StyleSheet.create({
  // Container principal da tela com fundo cinza claro
  screenContainer: { flex: 1, backgroundColor: '#f0f0f0' },

  // Estilo do título da tela (cabeçalho)
  screenTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },

  // Container centralizado usado para loading e mensagens de lista vazia
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  // Container de cada item de notificação
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    borderLeftWidth: 5, // Borda lateral para indicar status
  },

  // Estilo específico para notificações não lidas (borda azul)
  itemUnread: { borderColor: '#3498db' /* Azul */ },

  // Estilo específico para notificações lidas (borda cinza e mais transparente)
  itemRead: { borderColor: '#bdc3c7' /* Cinza */, opacity: 0.8 }, // Estilo para lida

  // Estilo do título da notificação
  itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },

  // Estilo do corpo da mensagem
  itemMessage: { fontSize: 14, color: '#444', marginBottom: 8 },

  // Estilo da data da notificação
  itemDate: { fontSize: 12, color: '#777', marginBottom: 4 },

  // Estilo do texto de status "Lida" (verde)
  readStatus: { fontSize: 12, color: 'green', fontWeight: 'bold'},

  // Estilo do texto de status "Não lida" (vermelho)
  unreadStatus: { fontSize: 12, color: 'red', fontWeight: 'bold' },

  // Container para os botões de ação
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinha botões à direita
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  // Estilo para os botões de ação
  actionButton: { marginLeft: 20 }, // Espaço entre botões

  // Estilo do texto do botão "Marcar como lida" (azul)
  actionTextRead: { color: '#3498db', fontWeight: 'bold' },

  // Estilo do texto do botão "Excluir" (vermelho)
  actionTextDelete: { color: '#e74c3c', fontWeight: 'bold' },

  // Estilo para mensagens de erro
  errorText: { color: 'red', textAlign: 'center', margin: 10 },
});
