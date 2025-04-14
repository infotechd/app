import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Importa o contexto de autenticação
import axios from 'axios'; // Para requisições HTTP

const ProviderDashboardScreen = ({ navigation }) => {
  const { user } = useAuth(); // Obtém o usuário logado do contexto
  const [offers, setOffers] = useState([]); // Estado para armazenar as ofertas criadas pelo provider
  const [bookings, setBookings] = useState([]); // Estado para armazenar as contratações recebidas
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
  const [error, setError] = useState(null); // Estado para lidar com erros

  // Função para buscar ofertas criadas pelo provider
  const fetchOffers = async () => {
    try {
      const response = await axios.get('https://api.example.com/provider/offers', {
        params: {
          userId: user.id, // Filtra ofertas do usuário logado
        },
      });
      setOffers(response.data);
    } catch (err) {
      setError('Erro ao carregar ofertas. Por favor, tente novamente.');
    }
  };

  // Função para buscar contratações recebidas pelo provider
  const fetchBookings = async () => {
    try {
      const response = await axios.get('https://api.example.com/provider/bookings', {
        params: {
          userId: user.id, // Filtra contratações do usuário logado
        },
      });
      setBookings(response.data);
      setLoading(false); // Finaliza o carregamento
    } catch (err) {
      setError('Erro ao carregar contratações. Por favor, tente novamente.');
      setLoading(false); // Finaliza o carregamento em caso de erro
    }
  };

  // Efeito para buscar dados quando a tela é carregada
  useEffect(() => {
    fetchOffers();
    fetchBookings();
  }, []);

  // Função para navegar para os detalhes de uma oferta
  const handleOfferPress = (offer) => {
    navigation.navigate('OfferDetails', { offer }); // Navega para a tela de detalhes da oferta
  };

  // Função para navegar para os detalhes de uma contratação
  const handleBookingPress = (booking) => {
    navigation.navigate('BookingDetails', { booking }); // Navega para a tela de detalhes da contratação
  };

  // Renderização das ofertas criadas pelo provider
  const renderOfferItem = ({ item }) => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      <Text style={styles.offerTitle}>{item.title}</Text>
      <Text style={styles.offerDescription}>{item.description}</Text>
      <Text style={styles.offerStatus}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  // Renderização das contratações recebidas pelo provider
  const renderBookingItem = ({ item }) => (
    <TouchableOpacity style={styles.bookingCard} onPress={() => handleBookingPress(item)}>
      <Text style={styles.bookingTitle}>Serviço: {item.serviceName}</Text>
      <Text style={styles.bookingStatus}>Status: {item.status}</Text>
      <Text style={styles.bookingDate}>Data: {item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Prestador'}!</Text>
        <Text style={styles.subheader}>Gerencie suas ofertas e contratações</Text>
      </View>

      {/* Carregamento */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>Carregando dados...</Text>
        </View>
      )}

      {/* Erro */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={() => fetchBookings()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Ofertas */}
      {!loading && !error && (
        <>
          <Text style={styles.sectionTitle}>Minhas Ofertas</Text>
          <FlatList
            data={offers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOfferItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyMessage}>Você ainda não criou nenhuma oferta.</Text>
            }
          />

          {/* Lista de Contratações */}
          <Text style={styles.sectionTitle}>Contratações Recebidas</Text>
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookingItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyMessage}>Nenhuma contratação disponível no momento.</Text>
            }
          />
        </>
      )}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  welcomeMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subheader: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
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
  },
  listContainer: {
    flexGrow: 1,
  },
  offerCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#007BFF',
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingStatus: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default ProviderDashboardScreen;