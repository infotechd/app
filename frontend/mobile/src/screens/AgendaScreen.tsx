import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  RefreshControl // Para Pull-to-refresh
} from 'react-native';

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import {
  fetchAgenda as apiFetchAgenda,
  updateCompromissoStatus as apiUpdateCompromissoStatus
} from '../services/api';
import { Agenda, Compromisso, CompromissoStatus } from "@/types/agenda"; // Tipos de Agenda
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props
type AgendaScreenProps = NativeStackScreenProps<RootStackParamList, 'Agenda'>;

/**
 * Tela que exibe a agenda do prestador e permite atualizar o status dos compromissos.
 */
export default function AgendaScreen({}: AgendaScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Guarda o ID do compromisso sendo atualizado para mostrar loading específico
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // 5. Refatorar fetchAgenda
  const loadAgenda = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false); // Apenas para carga inicial
      return;
    }
    if (!isRefreshing) setLoading(true); // Mostra loading inicial
    setError(null);
    try {
      const response = await apiFetchAgenda(user.token);
      setAgenda(response.agenda); // API retorna { agenda: Agenda | null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao carregar agenda';
      setError(msg);
      Alert.alert('Erro ao Carregar Agenda', msg);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  // Carregar agenda ao montar
  useEffect(() => {
    void loadAgenda();
  }, [loadAgenda]);

  // 6. Refatorar updateStatus
  const handleUpdateStatus = useCallback(async (compromissoId: string, newStatus: CompromissoStatus) => {
    // Verifica se temos a agenda e o ID dela para a URL da API
    if (!agenda?._id || !user?.token) {
      Alert.alert('Erro', 'Não foi possível atualizar o status. Dados da agenda ou autenticação ausentes.');
      return;
    }

    setUpdatingStatusId(compromissoId); // Marca este item como "atualizando"
    setError(null);

    try {
      const response = await apiUpdateCompromissoStatus(
        user.token,
        agenda._id, // ID da agenda pai
        compromissoId,
        { status: newStatus } // Corpo da requisição
      );
      setAgenda(response.agenda); // Atualiza a agenda inteira com a resposta da API
      Alert.alert('Sucesso', response.message || 'Status atualizado!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status';
      setError(`Erro ao atualizar ${compromissoId}: ${msg}`);
      Alert.alert('Erro ao Atualizar Status', msg);
    } finally {
      setUpdatingStatusId(null); // Limpa o ID em atualização
    }
  }, [agenda, user?.token]);


  // 7. Tipar renderItem e keyExtractor
  const renderItem = ({ item }: ListRenderItemInfo<Compromisso>): React.ReactElement => {
    const isUpdating = updatingStatusId === item._id;
    const canComplete = item.status !== 'completed' && item.status !== 'paid' && item.status !== 'cancelled_buyer' && item.status !== 'cancelled_provider'; // Lógica simples, ajuste conforme necessário

    return (
      <View style={styles.itemContainer}>
        {/* TODO: Exibir mais detalhes úteis (nome comprador, serviço) */}
        <Text style={styles.itemDate}>
          Data: {item.data ? new Date(item.data).toLocaleString('pt-BR') : 'Não definida'}
        </Text>
        <Text>Status: {item.status}</Text>
        {/* Exibe ActivityIndicator ou Botão */}
        {isUpdating ? (
          <ActivityIndicator size="small" color="#0000ff" style={styles.itemLoader} />
        ) : (
          canComplete && // Só mostra o botão se fizer sentido completar
          <Button
            title="Marcar Concluído"
            // Passa o status 'completed' para a função
            onPress={() => handleUpdateStatus(item._id, 'completed')}
            disabled={isUpdating} // Desabilita enquanto atualiza este item
          />
        )}
      </View>
    );
  };

  const keyExtractor = (item: Compromisso): string => item._id;

  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhum compromisso na sua agenda.</Text>
    </View>
  );

  // Componente para estado de erro
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>Erro ao carregar agenda: {error}</Text>
      <Button title="Tentar Novamente" onPress={()=>void loadAgenda()} />
    </View>
  );

  // 8. Renderização Principal
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando agenda...</Text>
      </View>
    );
  }

  if (error && !agenda) { // Se deu erro e não tem agenda para mostrar
    return renderError();
  }


  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Minha Agenda</Text>
      {/* Mostra erro na parte superior se ocorreu erro mas temos dados antigos */}
      {error && <Text style={styles.errorTextSmall}>{error}</Text>}
      <FlatList
        data={agenda?.compromissos || []} // Usa dados da agenda ou array vazio
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyList}
        refreshControl={ // Adiciona pull-to-refresh
          <RefreshControl refreshing={loading} onRefresh={()=>void loadAgenda(true)} />
        }
      />
    </View>
  );
}

// 9. Estilos
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 10, // Ajuste padding
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20, // Ajustado
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 10,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginHorizontal: 10, // Adiciona margem lateral
    marginBottom: 10,    // Espaço entre itens
    borderRadius: 5,
  },
  itemDate: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemLoader: {
    marginTop: 10,
    alignSelf: 'flex-start', // Alinha à esquerda
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTextSmall: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    marginHorizontal: 15,
  },
});
