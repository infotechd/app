import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  ListRenderItemInfo,
  SectionList, // Adicionar SectionList para resolver o problema de nesting
  SectionListRenderItemInfo
} from 'react-native';

// 1. Importações
// Este componente importa os módulos necessários do React e React Native para construir a interface do usuário
// e gerenciar o estado da tela do painel do anunciante.
import { useAuth } from "@/context/AuthContext";
import {
  fetchMyAds as apiFetchMyAds,
  fetchMyTrainings as apiFetchMyTrainings // Assumindo que esta função existe na API
} from '../services/api';
import { Ad } from "@/types/ad"; // Tipo Anúncio
import { Training } from "@/types/training"; // Tipo Treinamento
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props
// Define o tipo das propriedades que este componente recebe, utilizando o sistema de navegação
// do React Navigation para garantir tipagem correta dos parâmetros de rota.
type AdvertiserDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'AdvertiserDashboard'>;

export default function AdvertiserDashboardScreen({ navigation }: AdvertiserDashboardScreenProps) {
  // 3. Obter usuário/token
  // Utiliza o hook useAuth para acessar as informações do usuário autenticado,
  // incluindo o token necessário para as requisições à API.
  const { user } = useAuth();

  // 4. Tipar Estados
  // Define os estados do componente com tipagem adequada para garantir
  // consistência dos dados e melhor suporte de IDE.
  const [ads, setAds] = useState<Ad[]>([]); // Estado para armazenar a lista de anúncios
  const [trainings, setTrainings] = useState<Training[]>([]); // Estado para armazenar a lista de treinamentos
  const [loading, setLoading] = useState<boolean>(true); // Estado para controlar indicadores de carregamento
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro

  // 5. Busca de Dados
  // Função responsável por carregar os dados do dashboard (anúncios e treinamentos)
  // utilizando o token do usuário. Implementa tratamento de erros e estados de carregamento.
  const loadDashboardData = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true);
    setError(null);

    try {
      // Faz requisições paralelas para buscar anúncios e treinamentos simultaneamente
      const [adsResponse, trainingsResponse] = await Promise.all([
        apiFetchMyAds(user.token),
        apiFetchMyTrainings(user.token)
      ]);
      setAds(adsResponse.ads);
      setTrainings(trainingsResponse.trainings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setError(msg);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  // Hook useEffect para carregar os dados quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    void fetchData();
  }, [loadDashboardData]);

  // 6. Funções de Navegação
  // Estas funções são responsáveis por navegar para as telas de detalhes
  // quando o usuário toca em um anúncio ou treinamento.
  const handleAdPress = (ad: Ad) => {
    navigation.navigate('AdDetail', { adId: ad._id });
  };

  const handleTrainingPress = (training: Training) => {
    navigation.navigate('TreinamentoDetail', { treinamentoId: training._id });
  };

  // 7. Funções de Renderização
  // Estas funções são responsáveis por renderizar os itens da lista de anúncios e treinamentos,
  // definindo a aparência e comportamento de cada item.

  // Renderiza um item de anúncio na lista
  const renderAdItem = ({ item }: ListRenderItemInfo<Ad>): React.ReactElement => (
    <TouchableOpacity style={styles.adCard} onPress={() => handleAdPress(item)}>
      <Text style={styles.adTitle}>{item.title}</Text>
      <Text style={styles.adDescription} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.adStats}>
        Status: {item.status} | Visualizações: {item.views ?? 0} | Cliques: {item.clicks ?? 0}
      </Text>
    </TouchableOpacity>
  );

  // Renderiza um item de treinamento na lista
  const renderTrainingItem = ({ item }: ListRenderItemInfo<Training>): React.ReactElement => (
    <TouchableOpacity style={styles.trainingCard} onPress={() => handleTrainingPress(item)}>
      <Text style={styles.trainingTitle}>{item.titulo}</Text>
      <Text style={styles.trainingDescription} numberOfLines={2}>{item.descricao}</Text>
      <Text style={styles.trainingStats}>
        Formato: {item.formato} | Preço: {item.preco === 0 ? 'Gratuito' : `R$${item.preco.toFixed(2)}`} | Status: {item.status}
      </Text>
    </TouchableOpacity>
  );

  // Renderiza uma mensagem quando a lista está vazia
  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal ---
  // Esta seção controla o que será renderizado na tela com base nos estados atuais
  // (carregando, erro, ou dados carregados com sucesso)

  // Mostra indicador de carregamento quando está buscando dados pela primeira vez
  if (loading && ads.length === 0 && trainings.length === 0) {
    return <LoadingIndicator />;
  }

  // Mostra mensagem de erro e botão para tentar novamente quando ocorre um erro
  if (error && ads.length === 0 && trainings.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
        {/* Botão para tentar carregar os dados novamente */}
        <TouchableOpacity 
          onPress={async () => {
            try {
              await loadDashboardData();
            } catch (error) {
              console.error('Erro ao carregar dados do dashboard:', error);
            }
          }} 
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usando SectionList para evitar o erro de VirtualizedLists aninhadas
  // A SectionList permite organizar os dados em seções distintas e evita problemas
  // de performance com listas aninhadas

  // Preparar as seções para o SectionList
  // Define um tipo de união para todos os possíveis tipos de itens nas seções
  type SectionItem = string | Ad | Training;

  // Define o tipo para as seções
  type Section = {
    title: string;
    data: readonly SectionItem[];
    renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => React.ReactElement;
  };

  // Configuração das seções para o SectionList
  // Cada seção tem um título, dados e uma função de renderização específica
  const sections: readonly Section[] = [
    {
      title: "Header", // Cabeçalho da tela
      data: ["header"] as const,
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => (
        <View style={styles.header}>
          <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Anunciante'}!</Text>
          <Text style={styles.subheader}>Gerencie seus anúncios e treinamentos</Text>
          {error && (ads.length > 0 || trainings.length > 0) && !loading && (
            <Text style={styles.errorRefreshMessage}>Erro ao atualizar: {error}</Text>
          )}
        </View>
      )
    },
    {
      title: "Meus Anúncios", // Seção de anúncios do usuário
      data: (ads.length > 0 ? ads : ["empty_ads"]) as readonly SectionItem[],
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => {
        const item = info.item;
        if (item === "empty_ads") {
          return renderListEmpty("Você ainda não criou nenhum anúncio.");
        }
        return renderAdItem({item: item as Ad} as ListRenderItemInfo<Ad>);
      }
    },
    {
      title: "Meus Treinamentos", // Seção de treinamentos do usuário
      data: (trainings.length > 0 ? trainings : ["empty_trainings"]) as readonly SectionItem[],
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => {
        const item = info.item;
        if (item === "empty_trainings") {
          return renderListEmpty("Você ainda não criou nenhum treinamento.");
        }
        return renderTrainingItem({item: item as Training} as ListRenderItemInfo<Training>);
      }
    },
    {
      title: "Ações Rápidas", // Seção com botões de ações rápidas
      data: ["actions"] as const,
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TreinamentoCreate')}
          >
            <Text style={styles.actionButtonText}>Criar Novo Treinamento</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Relatorio')}
          >
            <Text style={styles.actionButtonText}>Ver Relatórios</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Community')}
          >
            <Text style={styles.actionButtonText}>Acessar Comunidade</Text>
          </TouchableOpacity>
        </View>
      )
    }
  ];

  // Renderização do componente SectionList que organiza todo o conteúdo da tela
  return (
    <SectionList<SectionItem, Section>
      style={styles.container}
      sections={sections} // Configuração das seções definidas anteriormente
      keyExtractor={(item, index) => {
        // Gera chaves únicas para cada item da lista
        if (typeof item === 'string') return item + index;
        return item._id || index.toString();
      }}
      renderSectionHeader={({section}) => (
        // Renderiza os títulos das seções (exceto para o Header)
        section.title !== "Header" ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null
      )}
      renderItem={(info) => info.section.renderItem(info)} // Renderiza os itens usando a função específica de cada seção
      refreshControl={
        // Adiciona controle de atualização (pull-to-refresh)
        <RefreshControl 
          refreshing={loading} 
          onRefresh={async () => {
            try {
              await loadDashboardData(true);
            } catch (error) {
              console.error('Erro ao atualizar dados do dashboard:', error);
            }
          }} 
        />
      }
      ListFooterComponent={() => <View style={{ height: 40 }} />} // Adiciona espaço no final da lista
      stickySectionHeadersEnabled={false} // Desativa cabeçalhos fixos durante a rolagem
    />
  );
}

// Estilos completos para o AdvertiserDashboardScreen
// Define a aparência visual de todos os elementos da interface
const styles = StyleSheet.create({
  // Estilo do container principal
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9' 
  },
  // Estilo do cabeçalho da tela
  header: { 
    marginBottom: 16, 
    paddingTop: 16, 
    paddingHorizontal: 16 
  },
  // Estilo da mensagem de boas-vindas
  welcomeMessage: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  // Estilo do subtítulo do cabeçalho
  subheader: { 
    fontSize: 14, 
    color: '#666',
    marginTop: 4 
  },
  // Estilo do container de carregamento
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f9f9f9' 
  },
  // Estilo do container de erro
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f9f9f9' 
  },
  // Estilo da mensagem de erro
  errorMessage: { 
    fontSize: 16, 
    color: '#e74c3c', 
    textAlign: 'center',
    marginBottom: 16 
  },
  // Estilo da mensagem de erro durante atualização
  errorRefreshMessage: { 
    fontSize: 14, 
    color: '#e74c3c', 
    textAlign: 'center', 
    marginTop: 10
  },
  // Estilo do botão de tentar novamente
  retryButton: { 
    marginTop: 16, 
    padding: 10, 
    backgroundColor: '#007BFF', 
    borderRadius: 5 
  },
  // Estilo do texto do botão de tentar novamente
  retryButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  // Estilo do título de cada seção
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginTop: 16, 
    marginBottom: 8, 
    paddingHorizontal: 16 
  },
  // Estilo do card de anúncio
  adCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    marginBottom: 12, 
    marginHorizontal: 16, 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2, 
    elevation: 2 
  },
  // Estilo do título do anúncio
  adTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  // Estilo da descrição do anúncio
  adDescription: { 
    fontSize: 14, 
    color: '#666', 
    marginVertical: 4 
  },
  // Estilo das estatísticas do anúncio
  adStats: { 
    fontSize: 12, 
    color: '#007BFF', 
    fontWeight: 'bold', 
    marginTop: 5 
  },
  // Estilo do card de treinamento
  trainingCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    marginBottom: 12, 
    marginHorizontal: 16, 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2, 
    elevation: 2 
  },
  // Estilo do título do treinamento
  trainingTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  // Estilo da descrição do treinamento
  trainingDescription: { 
    fontSize: 14, 
    color: '#666', 
    marginVertical: 4 
  },
  // Estilo das estatísticas do treinamento
  trainingStats: { 
    fontSize: 12, 
    color: '#007BFF', 
    fontWeight: 'bold', 
    marginTop: 5 
  },
  // Estilo da mensagem exibida quando uma lista está vazia
  emptyMessage: { 
    textAlign: 'center', 
    color: '#666', 
    marginTop: 20, 
    marginBottom: 20, 
    paddingHorizontal: 16 
  },
  // Estilo do container dos botões de ação
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  // Estilo dos botões de ação
  actionButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  // Estilo do texto dos botões de ação
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Componente de indicador de carregamento
// Exibe um spinner de carregamento e uma mensagem para o usuário
const LoadingIndicator = () => <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007BFF" /><Text>Carregando...</Text></View>;
// const TentarNovamente = ({ erro, aoTentarNovamente }) => ( /* ... */ );

// --- Exemplo de Placeholder para Telas de Detalhe ---
/*
// src/screens/AdDetailScreenPlaceholder.tsx
// Este é um exemplo de como seria uma tela de detalhes de anúncio simplificada
import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdDetail'>;

export default function AdDetailScreenPlaceholder({ route }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Tela de Detalhes do Anúncio (Placeholder)</Text>
      <Text>ID do Anúncio: {route.params.adId}</Text>
    </View>
  );
}
*/
