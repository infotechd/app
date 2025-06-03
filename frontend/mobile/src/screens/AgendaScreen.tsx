/**
 * AgendaScreen.tsx
 * 
 * Este componente implementa a tela de agenda do prestador de serviços.
 * Permite visualizar todos os compromissos agendados e atualizar seus status.
 * Inclui funcionalidades como pull-to-refresh e indicadores de carregamento.
 */
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
  RefreshControl // Para Pull-to-refresh (atualizar puxando para baixo)
} from 'react-native';

// 1. Imports - Importações necessárias para o funcionamento do componente
import { useAuth } from "@/context/AuthContext"; // Hook para acessar o contexto de autenticação
import {
  fetchAgenda as apiFetchAgenda, // Função para buscar dados da agenda na API
  updateCompromissoStatus as apiUpdateCompromissoStatus // Função para atualizar o status de um compromisso na API
} from '../services/api';
import { Agenda, Compromisso, CompromissoStatus } from "@/types/agenda"; // Tipos de dados relacionados à Agenda
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipo para as props de navegação
import { RootStackParamList } from "@/navigation/types"; // Tipo que define os parâmetros das rotas

// 2. Tipo das Props - Definição do tipo de propriedades que o componente recebe
type AgendaScreenProps = NativeStackScreenProps<RootStackParamList, 'Agenda'>;

/**
 * Tela que exibe a agenda do prestador e permite atualizar o status dos compromissos.
 */
export default function AgendaScreen({}: AgendaScreenProps) {
  // 3. Obter usuário/token - Acessa o contexto de autenticação para obter dados do usuário logado
  const { user } = useAuth();

  // 4. Tipar Estados - Definição dos estados com tipagem adequada
  const [agenda, setAgenda] = useState<Agenda | null>(null); // Armazena os dados da agenda carregados da API
  const [loading, setLoading] = useState<boolean>(true); // Controla o estado de carregamento inicial
  const [error, setError] = useState<string | null>(null); // Armazena mensagens de erro, se houver
  // Guarda o ID do compromisso sendo atualizado para mostrar loading específico
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null); // Controla qual compromisso está sendo atualizado

  // 5. Função para carregar dados da agenda - Busca os dados da agenda na API
  const loadAgenda = useCallback(async (isRefreshing = false) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false); // Apenas para carga inicial
      return;
    }
    // Ativa o indicador de carregamento apenas se não for uma atualização por pull-to-refresh
    if (!isRefreshing) setLoading(true); // Mostra loading inicial
    setError(null); // Limpa erros anteriores
    try {
      // Faz a requisição à API para buscar os dados da agenda
      const response = await apiFetchAgenda(user.token);
      setAgenda(response.agenda); // API retorna { agenda: Agenda | null }
    } catch (err) {
      // Tratamento de erros
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao carregar agenda';
      setError(msg);
      Alert.alert('Erro ao Carregar Agenda', msg);
    } finally {
      // Desativa o indicador de carregamento
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]); // Dependência: token do usuário

  // Efeito para carregar a agenda quando o componente é montado
  useEffect(() => {
    void loadAgenda(); // Carrega a agenda ao inicializar o componente
  }, [loadAgenda]); // Dependência: função loadAgenda

  // 6. Função para atualizar o status de um compromisso - Envia a atualização para a API
  const handleUpdateStatus = useCallback(async (compromissoId: string, newStatus: CompromissoStatus) => {
    // Verifica se temos a agenda e o ID dela para a URL da API
    if (!agenda?._id || !user?.token) {
      Alert.alert('Erro', 'Não foi possível atualizar o status. Dados da agenda ou autenticação ausentes.');
      return;
    }

    setUpdatingStatusId(compromissoId); // Marca este item como "atualizando" para mostrar o indicador de carregamento
    setError(null); // Limpa erros anteriores

    try {
      // Faz a requisição à API para atualizar o status do compromisso
      const response = await apiUpdateCompromissoStatus(
        user.token, // Token de autenticação
        agenda._id, // ID da agenda pai
        compromissoId, // ID do compromisso específico
        { status: newStatus } // Corpo da requisição com o novo status
      );
      setAgenda(response.agenda); // Atualiza a agenda inteira com a resposta da API
      Alert.alert('Sucesso', response.message || 'Status atualizado!'); // Notifica o usuário sobre o sucesso
    } catch (err) {
      // Tratamento de erros
      const msg = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status';
      setError(`Erro ao atualizar ${compromissoId}: ${msg}`);
      Alert.alert('Erro ao Atualizar Status', msg);
    } finally {
      setUpdatingStatusId(null); // Limpa o ID em atualização quando a operação termina
    }
  }, [agenda, user?.token]); // Dependências: agenda e token do usuário


  // 7. Funções de renderização para a FlatList - Define como cada item será exibido
  // Renderiza um item individual da lista de compromissos
  const renderItem = ({ item }: ListRenderItemInfo<Compromisso>): React.ReactElement => {
    const isUpdating = updatingStatusId === item._id; // Verifica se este item está sendo atualizado
    const canComplete = item.status !== 'completed' && item.status !== 'paid' && item.status !== 'cancelled_buyer' && item.status !== 'cancelled_provider'; // Lógica para determinar se o compromisso pode ser marcado como concluído

    return (
      <View style={styles.itemContainer}>
        {/* TODO: Exibir mais detalhes úteis (nome comprador, serviço) */}
        <Text style={styles.itemDate}>
          Data: {item.data ? new Date(item.data).toLocaleString('pt-BR') : 'Não definida'}
        </Text>
        <Text>Status: {item.status}</Text>
        {/* Exibe indicador de carregamento ou botão de ação */}
        {isUpdating ? (
          <ActivityIndicator size="small" color="#0000ff" style={styles.itemLoader} />
        ) : (
          canComplete && // Só mostra o botão se o status permitir marcar como concluído
          <Button
            title="Marcar Concluído"
            // Chama a função de atualização com o status 'completed'
            onPress={() => handleUpdateStatus(item._id, 'completed')}
            disabled={isUpdating} // Desabilita o botão durante atualizações
          />
        )}
      </View>
    );
  };

  // Função para extrair a chave única de cada item da lista
  const keyExtractor = (item: Compromisso): string => item._id;

  // Componente para exibir quando a lista está vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhum compromisso na sua agenda.</Text>
    </View>
  );

  // Componente para exibir quando ocorre um erro ao carregar a agenda
  const renderError = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>Erro ao carregar agenda: {error}</Text>
      <Button title="Tentar Novamente" onPress={()=>void loadAgenda()} />
    </View>
  );

  // 8. Renderização Principal - Lógica condicional para exibir diferentes estados da tela
  // Exibe tela de carregamento quando os dados estão sendo buscados inicialmente
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando agenda...</Text>
      </View>
    );
  }

  // Exibe tela de erro quando ocorreu um problema e não há dados para mostrar
  if (error && !agenda) { // Se deu erro e não tem agenda para mostrar
    return renderError();
  }

  // Renderização padrão da tela com a lista de compromissos
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.title}>Minha Agenda</Text>
      {/* Mostra mensagem de erro na parte superior se ocorreu erro mas temos dados antigos */}
      {error && <Text style={styles.errorTextSmall}>{error}</Text>}
      <FlatList
        data={agenda?.compromissos || []} // Usa os compromissos da agenda ou array vazio se não houver dados
        keyExtractor={keyExtractor} // Função para extrair a chave única de cada item
        renderItem={renderItem} // Função para renderizar cada item da lista
        ListEmptyComponent={renderEmptyList} // Componente a ser exibido quando a lista está vazia
        refreshControl={ // Adiciona funcionalidade de pull-to-refresh (puxar para atualizar)
          <RefreshControl refreshing={loading} onRefresh={()=>void loadAgenda(true)} />
        }
      />
    </View>
  );
}

// 9. Estilos - Definição dos estilos utilizados no componente
const styles = StyleSheet.create({
  // Estilo do container principal da tela
  screenContainer: {
    flex: 1, // Ocupa todo o espaço disponível
    paddingTop: 10, // Espaçamento superior
  },
  // Estilo para centralizar conteúdo (usado em telas de carregamento e erro)
  centerContainer: {
    flex: 1, // Ocupa todo o espaço disponível
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
    padding: 20, // Espaçamento interno
  },
  // Estilo do título principal da tela
  title: {
    fontSize: 20, // Tamanho da fonte
    fontWeight: 'bold', // Negrito
    marginBottom: 15, // Margem inferior
    marginTop: 10, // Margem superior
    textAlign: 'center', // Alinhamento centralizado
  },
  // Estilo do container de cada item da lista de compromissos
  itemContainer: {
    padding: 15, // Espaçamento interno
    borderBottomWidth: 1, // Borda inferior
    borderColor: '#eee', // Cor da borda (cinza claro)
    backgroundColor: '#fff', // Cor de fundo (branco)
    marginHorizontal: 10, // Margem horizontal
    marginBottom: 10, // Margem inferior (espaço entre itens)
    borderRadius: 5, // Cantos arredondados
  },
  // Estilo para a data do compromisso
  itemDate: {
    fontWeight: 'bold', // Negrito
    marginBottom: 5, // Margem inferior
  },
  // Estilo para o indicador de carregamento dentro de um item
  itemLoader: {
    marginTop: 10, // Margem superior
    alignSelf: 'flex-start', // Alinhamento à esquerda
  },
  // Estilo para mensagens de erro (versão grande)
  errorText: {
    color: 'red', // Cor vermelha
    fontSize: 16, // Tamanho da fonte
    textAlign: 'center', // Alinhamento centralizado
    marginBottom: 10, // Margem inferior
  },
  // Estilo para mensagens de erro (versão pequena)
  errorTextSmall: {
    color: 'red', // Cor vermelha
    fontSize: 14, // Tamanho da fonte menor
    textAlign: 'center', // Alinhamento centralizado
    marginBottom: 10, // Margem inferior
    marginHorizontal: 15, // Margem horizontal
  },
});
