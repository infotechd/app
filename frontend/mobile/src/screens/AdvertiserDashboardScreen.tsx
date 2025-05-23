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

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import {
  fetchMyAds as apiFetchMyAds,
  fetchMyTrainings as apiFetchMyTrainings // Assumindo que esta função existe
} from '../services/api';
import { Ad } from "@/types/ad"; // Tipo Anúncio
import { Training } from "@/types/training"; // Tipo Treinamento
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props
type AdvertiserDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'AdvertiserDashboard'>;

export default function AdvertiserDashboardScreen({ navigation }: AdvertiserDashboardScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados
  const [ads, setAds] = useState<Ad[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar Fetching
  const loadDashboardData = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true);
    setError(null);

    try {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    void fetchData();
  }, [loadDashboardData]);

  // 6. Refatorar Navegação
  const handleAdPress = (ad: Ad) => {
    navigation.navigate('AdDetail', { adId: ad._id });
  };

  const handleTrainingPress = (training: Training) => {
    navigation.navigate('TreinamentoDetail', { treinamentoId: training._id });
  };

  // 7. Tipar Renderização
  const renderAdItem = ({ item }: ListRenderItemInfo<Ad>): React.ReactElement => (
    <TouchableOpacity style={styles.adCard} onPress={() => handleAdPress(item)}>
      <Text style={styles.adTitle}>{item.title}</Text>
      <Text style={styles.adDescription} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.adStats}>
        Status: {item.status} | Views: {item.views ?? 0} | Clicks: {item.clicks ?? 0}
      </Text>
    </TouchableOpacity>
  );

  const renderTrainingItem = ({ item }: ListRenderItemInfo<Training>): React.ReactElement => (
    <TouchableOpacity style={styles.trainingCard} onPress={() => handleTrainingPress(item)}>
      <Text style={styles.trainingTitle}>{item.titulo}</Text>
      <Text style={styles.trainingDescription} numberOfLines={2}>{item.descricao}</Text>
      <Text style={styles.trainingStats}>
        Formato: {item.formato} | Preço: {item.preco === 0 ? 'Gratuito' : `R$${item.preco.toFixed(2)}`} | Status: {item.status}
      </Text>
    </TouchableOpacity>
  );

  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal ---
  if (loading && ads.length === 0 && trainings.length === 0) {
    //return ( /* ... Indicador de Loading ... */ );
    return <LoadingIndicator />;

  }
  if (error && ads.length === 0 && trainings.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
        {/* Usar a função loadDashboardData para o botão Tentar Novamente */}
        <TouchableOpacity 
          onPress={async () => {
            try {
              await loadDashboardData();
            } catch (error) {
              console.error('Error loading dashboard data:', error);
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

  // Preparar as seções para o SectionList
  // Define um tipo de união para todos os possíveis tipos de itens nas seções
  type SectionItem = string | Ad | Training;

  // Define o tipo para as seções
  type Section = {
    title: string;
    data: readonly SectionItem[];
    renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => React.ReactElement;
  };

  const sections: readonly Section[] = [
    {
      title: "Header",
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
      title: "Meus Anúncios",
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
      title: "Meus Treinamentos",
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
      title: "Ações Rápidas",
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

  return (
    <SectionList<SectionItem, Section>
      style={styles.container}
      sections={sections}
      keyExtractor={(item, index) => {
        if (typeof item === 'string') return item + index;
        return item._id || index.toString();
      }}
      renderSectionHeader={({section}) => (
        section.title !== "Header" ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null
      )}
      renderItem={(info) => info.section.renderItem(info)}
      refreshControl={
        <RefreshControl 
          refreshing={loading} 
          onRefresh={async () => {
            try {
              await loadDashboardData(true);
            } catch (error) {
              console.error('Error refreshing dashboard data:', error);
            }
          }} 
        />
      }
      ListFooterComponent={() => <View style={{ height: 40 }} />}
      stickySectionHeadersEnabled={false}
    />
  );
}

// Estilos completos para o AdvertiserDashboardScreen
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9' 
  },
  header: { 
    marginBottom: 16, 
    paddingTop: 16, 
    paddingHorizontal: 16 
  },
  welcomeMessage: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  subheader: { 
    fontSize: 14, 
    color: '#666',
    marginTop: 4 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f9f9f9' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#f9f9f9' 
  },
  errorMessage: { 
    fontSize: 16, 
    color: '#e74c3c', 
    textAlign: 'center',
    marginBottom: 16 
  },
  errorRefreshMessage: { 
    fontSize: 14, 
    color: '#e74c3c', 
    textAlign: 'center', 
    marginTop: 10
  },
  retryButton: { 
    marginTop: 16, 
    padding: 10, 
    backgroundColor: '#007BFF', 
    borderRadius: 5 
  },
  retryButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginTop: 16, 
    marginBottom: 8, 
    paddingHorizontal: 16 
  },
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
  adTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  adDescription: { 
    fontSize: 14, 
    color: '#666', 
    marginVertical: 4 
  },
  adStats: { 
    fontSize: 12, 
    color: '#007BFF', 
    fontWeight: 'bold', 
    marginTop: 5 
  },
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
  trainingTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  trainingDescription: { 
    fontSize: 14, 
    color: '#666', 
    marginVertical: 4 
  },
  trainingStats: { 
    fontSize: 12, 
    color: '#007BFF', 
    fontWeight: 'bold', 
    marginTop: 5 
  },
  emptyMessage: { 
    textAlign: 'center', 
    color: '#666', 
    marginTop: 20, 
    marginBottom: 20, 
    paddingHorizontal: 16 
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Placeholder para Loading/Error (simplificado, pode usar os estilos)
const LoadingIndicator = () => <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#007BFF" /><Text>Carregando...</Text></View>;
// const ErrorRetry = ({ error, onRetry }) => ( /* ... */ );

// --- Exemplo de Placeholder para Telas de Detalhe ---
/*
// src/screens/AdDetailScreenPlaceholder.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdDetail'>;

export default function AdDetailScreenPlaceholder({ route }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Ad Detail Screen Placeholder</Text>
      <Text>Ad ID: {route.params.adId}</Text>
    </View>
  );
}
*/
