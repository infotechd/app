import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView, // Usar ScrollView se o conteúdo puder exceder a tela
  RefreshControl, // Para pull-to-refresh
  ListRenderItemInfo
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext'; // Contexto de autenticação
import {
  fetchMyOffers as apiFetchMyOffers,
  fetchReceivedContratacoes as apiFetchReceivedContratacoes
} from '../services/api'; // Funções da API tipadas
import { Offer } from '../types/offer'; // Tipo Offer
import { Contratacao } from '../types/contratacao'; // Tipo Contratacao
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // Tipos de Navegação

// 2. Tipo das Props
type ProviderDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'ProviderDashboard'>;

export default function ProviderDashboardScreen({ navigation }: ProviderDashboardScreenProps) {
  // 3. Obter usuário/token do contexto
  const { user } = useAuth();

  // 4. Tipar Estados
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Contratacao[]>([]); // Renomeado para clareza e tipado
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar Fetching de Dados
  const loadDashboardData = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true); // Loading inicial
    setError(null);

    try {
      // Busca ofertas e contratações em paralelo
      const [offersResponse, bookingsResponse] = await Promise.all([
        apiFetchMyOffers(user.token),
        apiFetchReceivedContratacoes(user.token)
      ]);
      setOffers(offersResponse.offers);
      setBookings(bookingsResponse.contratacoes); // Nome do array na resposta da API
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setError(msg);
      // Não limpar dados antigos em caso de erro no refresh? Opcional.
      // setOffers([]);
      // setBookings([]);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]); // Depende do token

  // Busca inicial
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 6. Refatorar Navegação
  const handleOfferPress = (offer: Offer) => {
    // Navega para a tela de detalhes da oferta, passando o ID
    navigation.navigate('OfferDetail', { offerId: offer._id });
  };

  const handleBookingPress = (booking: Contratacao) => {
    // Navega para a tela de detalhes da contratação, passando o ID
    navigation.navigate('ContratacaoDetalhe', { contratacaoId: booking._id });
  };

  // 7. Tipar Renderização das Listas
  const renderOfferItem = ({ item }: ListRenderItemInfo<Offer>): JSX.Element => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      {/* Usar campos da interface Offer */}
      <Text style={styles.offerTitle}>{item.descricao}</Text>
      <Text style={styles.offerStatus}>Status: {item.status}</Text>
      <Text style={styles.offerPrice}>Preço: R$ {item.preco.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderBookingItem = ({ item }: ListRenderItemInfo<Contratacao>): JSX.Element => (
    <TouchableOpacity style={styles.bookingCard} onPress={() => handleBookingPress(item)}>
      {/* Usar campos da interface Contratacao */}
      {/* Idealmente, a API traria o título da oferta ou nome do comprador */}
      <Text style={styles.bookingTitle}>Contrato ID: {item._id}</Text>
      <Text style={styles.bookingStatus}>Status: {item.status}</Text>
      <Text style={styles.bookingDate}>
        Contratado em: {new Date(item.dataContratacao).toLocaleDateString('pt-BR')}
      </Text>
      {/* Adicionar nome do comprador se a API fornecer */}
      {/* item.compradorNome && <Text>Comprador: {item.compradorNome}</Text> */}
    </TouchableOpacity>
  );

  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal ---

  if (loading && offers.length === 0 && bookings.length === 0) { // Mostra loading apenas na carga inicial
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  // Mostra erro apenas se não houver dados para exibir e não estiver carregando
  if (error && offers.length === 0 && bookings.length === 0 && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity onPress={()=>loadDashboardData()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Usa ScrollView para permitir rolagem se as listas ficarem grandes
  // e para o RefreshControl funcionar corretamente.
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={()=>loadDashboardData(true)} />
      }
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Prestador'}!</Text>
        <Text style={styles.subheader}>Gerencie suas ofertas e contratações</Text>
        {/* Mostra erro discreto se ocorreu durante refresh */}
        {error && (offers.length > 0 || bookings.length > 0) && !loading && (
          <Text style={styles.errorRefreshMessage}>Erro ao atualizar: {error}</Text>
        )}
      </View>

      {/* Lista de Ofertas */}
      <Text style={styles.sectionTitle}>Minhas Ofertas</Text>
      {/* Usar scrollEnabled={false} se dentro de ScrollView para evitar conflito,
           mas FlatList dentro de ScrollView não é ideal para performance com muitos itens.
           Alternativa: usar SectionList ou apenas View/map se as listas forem pequenas.
           Mantendo FlatList por enquanto. */}
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id} // Usar _id
        renderItem={renderOfferItem}
        ListEmptyComponent={() => renderListEmpty("Você ainda não criou nenhuma oferta.")}
        scrollEnabled={false} // Desabilita rolagem própria da FlatList
      />

      {/* Lista de Contratações */}
      <Text style={styles.sectionTitle}>Contratações Recebidas</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id} // Usar _id
        renderItem={renderBookingItem}
        ListEmptyComponent={() => renderListEmpty("Nenhuma contratação recebida no momento.")}
        scrollEnabled={false} // Desabilita rolagem própria da FlatList
      />

      {/* Botões de Ação Rápida */}
      <View style={styles.actionButtonsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('OfertaServico')}
        >
          <Text style={styles.actionButtonText}>Gerenciar Minhas Ofertas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Agenda')}
        >
          <Text style={styles.actionButtonText}>Minha Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CurriculoForm')}
        >
          <Text style={styles.actionButtonText}>Atualizar Currículo</Text>
        </TouchableOpacity>
      </View>

      {/* Adicionar espaço no final para melhor rolagem */}
      <View style={{ height: 40 }} />

    </ScrollView>
  );
}

// Estilos completos para o ProviderDashboardScreen
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
  offerCard: {
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
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  offerStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  offerPrice: {
    fontSize: 14,
    color: '#16a085',
    fontWeight: 'bold',
    marginTop: 4,
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
