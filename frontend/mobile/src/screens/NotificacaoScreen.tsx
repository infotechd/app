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
  ListRenderItemInfo
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import {
  fetchNotificacoes as apiFetchNotificacoes,
  markNotificacaoAsRead as apiMarkRead,
  deleteNotificacao as apiDeleteNotificacao
} from '../services/api';
import { Notificacao } from '../types/notificacao';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props
type NotificacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Notificacao'>;

/**
 * NotificacaoScreen – Tela para exibir e gerenciar notificações (Mobile)
 */
export default function NotificacaoScreen({ navigation }: NotificacaoScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Guarda o ID da notificação que está sofrendo uma ação (lida/excluir)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 6. Refatorar handleMarkAsRead
  const handleMarkAsRead = async (id: string) => {
    if (!user?.token || actionLoadingId) return; // Impede múltiplas ações
    setActionLoadingId(id); // Define qual item está carregando
    try {
      await apiMarkRead(user.token, id);
      // Atualiza a lista localmente ou busca novamente
      // Buscar novamente é mais simples, mas pode ser menos performático
      loadNotifications(true); // Recarrega silenciosamente
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

  // 7. Refatorar handleDelete
  const handleDelete = async (id: string) => {
    if (!user?.token || actionLoadingId) return;
    // Confirmação antes de excluir
    Alert.alert("Confirmar Exclusão", "Deseja realmente excluir esta notificação?", [
      { text: "Cancelar", style: "cancel"},
      { text: "Excluir", style: "destructive", onPress: async () => {
          setActionLoadingId(id);
          try {
            await apiDeleteNotificacao(user.token, id);
            // Atualiza a lista localmente ou busca novamente
            loadNotifications(true); // Recarrega silenciosamente
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


  // 8. Tipar renderItem
  const renderItem = ({ item }: ListRenderItemInfo<Notificacao>): JSX.Element => {
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

  const keyExtractor = (item: Notificacao): string => item._id;

  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhuma notificação.</Text>
    </View>
  );

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

// 9. Estilos
const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  screenTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 5,
    borderLeftWidth: 5, // Borda lateral para indicar status
  },
  itemUnread: { borderColor: '#3498db' /* Azul */ },
  itemRead: { borderColor: '#bdc3c7' /* Cinza */, opacity: 0.8 }, // Estilo para lida
  itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  itemMessage: { fontSize: 14, color: '#444', marginBottom: 8 },
  itemDate: { fontSize: 12, color: '#777', marginBottom: 4 },
  readStatus: { fontSize: 12, color: 'green', fontWeight: 'bold'},
  unreadStatus: { fontSize: 12, color: 'red', fontWeight: 'bold' },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Alinha botões à direita
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: { marginLeft: 20 }, // Espaço entre botões
  actionTextRead: { color: '#3498db', fontWeight: 'bold' },
  actionTextDelete: { color: '#e74c3c', fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', margin: 10 },
});