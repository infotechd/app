import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  SectionList // Adicionar SectionList para resolver o problema de nesting
} from 'react-native';

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublicOffers as apiFetchPublicOffers,
  fetchMyHiredContratacoes as apiFetchMyHiredContratacoes
} from '../services/api';
import { Offer, FetchOffersParams } from "@/types/offer";
import { Contratacao } from "@/types/contratacao";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props
type BuyerDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'BuyerDashboard'>;

export default function BuyerDashboardScreen({ navigation }: BuyerDashboardScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados
  const [offers, setOffers] = useState<Offer[]>([]); // Ofertas disponíveis
  const [hiredContracts, setHiredContracts] = useState<Contratacao[]>([]); // Contratações feitas
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar Fetching de Dados
  const loadDashboardData = useCallback(async (isRefreshing = false) => {
    if (!user?.token) { // Precisa do 'token' para buscar contratações
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true);
    setError(null);

    try {
      // Parâmetros para buscar apenas ofertas prontas
      const offerParams: FetchOffersParams = { status: 'ready', limit: 10 }; // Exemplo: Limitar a 10
      // Parâmetros para buscar contratações (ex: não canceladas) - opcional
      // const contractParams: FetchContratacoesParams = { status: ['accepted', 'in_progress', 'completed', 'paid'] };

      const [offersResponse, contractsResponse] = await Promise.all([
        apiFetchPublicOffers(offerParams), // Busca ofertas públicas prontas
        apiFetchMyHiredContratacoes(user.token /*, contractParams */) // Busca minhas contratações
      ]);
      setOffers(offersResponse.offers);
      setHiredContracts(contractsResponse.contratacoes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setError(msg);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
    };

    // Handle the promise properly to avoid "Promise returned from fetchData is ignored" warning
    fetchData().catch(err => {
      console.error("Error in fetchData:", err);
    });
  }, [loadDashboardData]);

  // 6. Refatorar Navegação
  const handleOfferPress = (offer: Offer) => {
    navigation.navigate('OfferDetail', { offerId: offer._id });
  };

  const handleContractPress = (contract: Contratacao) => {
    navigation.navigate('ContratacaoDetalhe', { contratacaoId: contract._id });
  };

  // 7. Tipar Renderização das Listas
  const renderOfferItem = ({ item }: ListRenderItemInfo<Offer>): React.ReactElement => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      <Text style={styles.offerTitle} numberOfLines={1}>{item.descricao}</Text>
      <Text style={styles.offerPrice}>R$ {item.preco.toFixed(2)}</Text>
      {/* Adicionar nome do prestador se disponível */}
      {/* <Text>Por: {item.prestadorNome || 'Não informado'}</Text> */}
    </TouchableOpacity>
  );

  const renderHiredContractItem = ({ item }: ListRenderItemInfo<Contratacao>): React.ReactElement => (
    <TouchableOpacity style={styles.bookingCard} onPress={() => handleContractPress(item)}>
      {/* Idealmente, a API traria o título da oferta original */}
      <Text style={styles.bookingTitle}>Contrato: {item._id}</Text>
      <Text style={styles.bookingStatus}>Status: {item.status}</Text>
      {/* Adicionar nome do prestador se disponível */}
      {/* <Text>Prestador: {item.prestadorNome || 'Não informado'}</Text> */}
      <Text style={styles.bookingDate}>
        Contratado em: {new Date(item.dataContratacao).toLocaleDateString('pt-BR')}
      </Text>
    </TouchableOpacity>
  );

  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal ---
  if (loading && offers.length === 0 && hiredContracts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  if (error && offers.length === 0 && hiredContracts.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity onPress={()=>loadDashboardData()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usando SectionList para evitar o erro de VirtualizedLists aninhadas

  // Componente para renderizar a lista horizontal de ofertas
  const OffersHorizontalList = () => (
    <FlatList
      data={offers}
      keyExtractor={(item) => item._id}
      renderItem={renderOfferItem}
      ListEmptyComponent={() => renderListEmpty("Nenhuma oferta disponível no momento.")}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.horizontalList}
      nestedScrollEnabled={true} // Importante para listas aninhadas
    />
  );

  // Define um tipo de união para todos os possíveis tipos de itens nas seções
  type SectionItem = string | Contratacao | "empty_contracts";

  // Define o tipo para as seções
  type Section = {
    title: string;
    data: readonly SectionItem[];
    renderItem: (info: {item: SectionItem}) => React.ReactElement;
  };

  // Preparar as seções para o SectionList
  const sections: readonly Section[] = [
    {
      title: "Header",
      data: ["header"] as readonly SectionItem[],
      renderItem: ({item}: {item: SectionItem}) => (
        <View style={styles.header}>
          <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Comprador'}!</Text>
          <Text style={styles.subheader}>Explore ofertas e gerencie suas contratações</Text>
          {error && (offers.length > 0 || hiredContracts.length > 0) && !loading && (
            <Text style={styles.errorRefreshMessage}>Erro ao atualizar: {error}</Text>
          )}
        </View>
      )
    },
    {
      title: "Ofertas Disponíveis",
      data: ["offers"] as readonly SectionItem[],
      renderItem: ({item}: {item: SectionItem}) => <OffersHorizontalList />
    },
    {
      title: "Minhas Contratações",
      data: (hiredContracts.length > 0 ? hiredContracts : ["empty_contracts"]) as readonly SectionItem[],
      renderItem: ({item}: {item: SectionItem}) => {
        if (item === "empty_contracts") {
          return renderListEmpty("Você ainda não contratou nenhum serviço.");
        }
        return renderHiredContractItem({item} as ListRenderItemInfo<Contratacao>);
      }
    },
    {
      title: "Ações Rápidas",
      data: ["actions"] as readonly SectionItem[],
      renderItem: ({item}: {item: SectionItem}) => (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('BuscarOfertas')}
          >
            <Text style={styles.actionButtonText}>Buscar Novos Serviços</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TreinamentoList')}
          >
            <Text style={styles.actionButtonText}>Ver Treinamentos Disponíveis</Text>
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
        return item && typeof item === 'object' && '_id' in item ? item._id : index.toString();
      }}
      renderSectionHeader={({section}) => (
        section.title !== "Header" ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null
      )}
      renderItem={({section, item}) => section.renderItem({item})}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => loadDashboardData(true)} />
      }
      ListFooterComponent={() => <View style={{ height: 40 }} />}
      stickySectionHeadersEnabled={false}
    />
  );
}

// Estilos completos para o BuyerDashboardScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  welcomeMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  errorMessage: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorRefreshMessage: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  horizontalList: {
    marginBottom: 20,
  },
  offerCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    marginLeft: 16,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  offerTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#333' 
  },
  offerPrice: { 
    fontSize: 14, 
    color: '#007BFF', 
    fontWeight: 'bold', 
    marginTop: 4 
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingStatus: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
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
