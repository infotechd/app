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
  ListRenderItemInfo
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import {
  fetchPublicOffers as apiFetchPublicOffers,
  fetchMyHiredContratacoes as apiFetchMyHiredContratacoes
} from '../services/api';
import { Offer, FetchOffersParams } from '../types/offer';
import { Contratacao } from '../types/contratacao';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

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
    if (!user?.token) { // Precisa do token para buscar contratações
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
    loadDashboardData();
  }, [loadDashboardData]);

  // 6. Refatorar Navegação
  const handleOfferPress = (offer: Offer) => {
    navigation.navigate('OfferDetail', { offerId: offer._id });
  };

  const handleContractPress = (contract: Contratacao) => {
    navigation.navigate('ContratacaoDetalhe', { contratacaoId: contract._id });
  };

  // 7. Tipar Renderização das Listas
  const renderOfferItem = ({ item }: ListRenderItemInfo<Offer>): JSX.Element => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      <Text style={styles.offerTitle} numberOfLines={1}>{item.descricao}</Text>
      <Text style={styles.offerPrice}>R$ {item.preco.toFixed(2)}</Text>
      {/* Adicionar nome do prestador se disponível */}
      {/* <Text>Por: {item.prestadorNome || 'Não informado'}</Text> */}
    </TouchableOpacity>
  );

  const renderHiredContractItem = ({ item }: ListRenderItemInfo<Contratacao>): JSX.Element => (
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={()=>loadDashboardData(true)} />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Comprador'}!</Text>
        <Text style={styles.subheader}>Explore ofertas e gerencie suas contratações</Text>
        {error && (offers.length > 0 || hiredContracts.length > 0) && !loading && (
          <Text style={styles.errorRefreshMessage}>Erro ao atualizar: {error}</Text>
        )}
      </View>

      {/* Lista de Ofertas Disponíveis */}
      <Text style={styles.sectionTitle}>Ofertas Disponíveis</Text>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        renderItem={renderOfferItem}
        ListEmptyComponent={() => renderListEmpty("Nenhuma oferta disponível no momento.")}
        horizontal={true} // Exemplo: mostrar ofertas em linha horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalList}
      />

      {/* Lista de Minhas Contratações */}
      <Text style={styles.sectionTitle}>Minhas Contratações</Text>
      {/* FlatList normal para contratações */}
      <FlatList
        data={hiredContracts}
        keyExtractor={(item) => item._id}
        renderItem={renderHiredContractItem}
        ListEmptyComponent={() => renderListEmpty("Você ainda não contratou nenhum serviço.")}
        scrollEnabled={false} // Dentro de ScrollView
      />

      <View style={{ height: 40 }} />

    </ScrollView>
  );
}

// Estilos (similares aos do ProviderDashboard, ajustar conforme necessário)
const styles = StyleSheet.create({
  container: { /* ... */ },
  header: { /* ... */ },
  welcomeMessage: { /* ... */ },
  subheader: { /* ... */ },
  loadingContainer: { /* ... */ },
  errorContainer: { /* ... */ },
  errorMessage: { /* ... */ },
  errorRefreshMessage: { /* ... */ },
  retryButton: { /* ... */ },
  retryButtonText: { /* ... */ },
  sectionTitle: { /* ... */ },
  horizontalList: { // Estilo para lista horizontal
    marginBottom: 10,
  },
  offerCard: { // Ajustar para lista horizontal se necessário
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 10, // Espaço entre itens horizontais
    marginLeft: 16, // Espaço inicial
    minWidth: 180, // Largura mínima
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  offerTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  offerPrice: { fontSize: 14, color: '#007BFF', fontWeight: 'bold', marginTop: 4 },
  bookingCard: { /* ... */ }, // Reutiliza estilo de card
  bookingTitle: { /* ... */ },
  bookingStatus: { /* ... */ },
  bookingDate: { /* ... */ },
  emptyMessage: { /* ... */ },
});