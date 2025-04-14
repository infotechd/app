import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Importa o contexto de autenticação
import axios from 'axios'; // Para requisições HTTP

const BuyerDashboardScreen = ({ navigation }) => {
  const { user } = useAuth(); // Obtém o usuário logado do contexto
  const [offers, setOffers] = useState([]); // Estado para armazenar as ofertas de serviço
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
  const [error, setError] = useState(null); // Estado para lidar com erros

  // Função para buscar ofertas de serviço
  const fetchOffers = async () => {
    try {
      const response = await axios.get('https://api.example.com/offers', {
        params: {
          status: 'ready', // Filtra apenas ofertas prontas para contratação
        },
      });
      setOffers(response.data); // Atualiza o estado com as ofertas recebidas
      setLoading(false); // Finaliza o carregamento
    } catch (err) {
      setError('Erro ao carregar ofertas. Por favor, tente novamente.');
      setLoading(false); // Finaliza o carregamento em caso de erro
    }
  };

  // Efeito para buscar ofertas quando a tela é carregada
  useEffect(() => {
    fetchOffers();
  }, []);

  // Função para navegar para os detalhes de uma oferta
  const handleOfferPress = (offer) => {
    navigation.navigate('OfferDetails', { offer }); // Navega para a tela de detalhes da oferta
  };

  // Renderização da lista de ofertas
  const renderOfferItem = ({ item }) => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      <Text style={styles.offerTitle}>{item.title}</Text>
      <Text style={styles.offerDescription}>{item.description}</Text>
      <Text style={styles.offerPrice}>Preço: R${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Comprador'}!</Text>
        <Text style={styles.subheader}>Explore ofertas de serviços disponíveis</Text>
      </View>

      {/* Carregamento */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text>Carregando ofertas...</Text>
        </View>
      )}

      {/* Erro */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={fetchOffers} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Ofertas */}
      {!loading && !error && (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOfferItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyMessage}>Nenhuma oferta disponível no momento.</Text>
          }
        />
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
  offerPrice: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});

export default BuyerDashboardScreen;