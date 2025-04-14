import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Importa o contexto de autenticação
import axios from 'axios'; // Para requisições HTTP

const AdvertiserDashboardScreen = ({ navigation }) => {
  const { user } = useAuth(); // Obtém o usuário logado do contexto
  const [ads, setAds] = useState([]); // Estado para armazenar os anúncios criados pelo advertiser
  const [trainings, setTrainings] = useState([]); // Estado para armazenar os treinamentos criados pelo advertiser
  const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
  const [error, setError] = useState(null); // Estado para lidar com erros

  // Função para buscar anúncios criados pelo advertiser
  const fetchAds = async () => {
    try {
      const response = await axios.get('https://api.example.com/advertiser/ads', {
        params: {
          userId: user.id, // Filtra anúncios do usuário logado
        },
      });
      setAds(response.data);
    } catch (err) {
      setError('Erro ao carregar anúncios. Por favor, tente novamente.');
    }
  };

  // Função para buscar treinamentos criados pelo advertiser
  const fetchTrainings = async () => {
    try {
      const response = await axios.get('https://api.example.com/advertiser/trainings', {
        params: {
          userId: user.id, // Filtra treinamentos do usuário logado
        },
      });
      setTrainings(response.data);
      setLoading(false); // Finaliza o carregamento
    } catch (err) {
      setError('Erro ao carregar treinamentos. Por favor, tente novamente.');
      setLoading(false); // Finaliza o carregamento em caso de erro
    }
  };

  // Efeito para buscar dados quando a tela é carregada
  useEffect(() => {
    fetchAds();
    fetchTrainings();
  }, []);

  // Função para navegar para os detalhes de um anúncio
  const handleAdPress = (ad) => {
    navigation.navigate('AdDetails', { ad }); // Navega para a tela de detalhes do anúncio
  };

  // Função para navegar para os detalhes de um treinamento
  const handleTrainingPress = (training) => {
    navigation.navigate('TrainingDetails', { training }); // Navega para a tela de detalhes do treinamento
  };

  // Renderização dos anúncios criados pelo advertiser
  const renderAdItem = ({ item }) => (
    <TouchableOpacity style={styles.adCard} onPress={() => handleAdPress(item)}>
      <Text style={styles.adTitle}>{item.title}</Text>
      <Text style={styles.adDescription}>{item.description}</Text>
      <Text style={styles.adStats}>
        Visualizações: {item.views} | Cliques: {item.clicks}
      </Text>
    </TouchableOpacity>
  );

  // Renderização dos treinamentos criados pelo advertiser
  const renderTrainingItem = ({ item }) => (
    <TouchableOpacity style={styles.trainingCard} onPress={() => handleTrainingPress(item)}>
      <Text style={styles.trainingTitle}>{item.title}</Text>
      <Text style={styles.trainingDescription}>{item.description}</Text>
      <Text style={styles.trainingStats}>
        Formato: {item.format} | Preço: R${item.price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Anunciante'}!</Text>
        <Text style={styles.subheader}>Gerencie seus anúncios e treinamentos</Text>
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
          <TouchableOpacity onPress={() => fetchAds()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Anúncios */}
      {!loading && !error && (
        <>
          <Text style={styles.sectionTitle}>Meus Anúncios</Text>
          <FlatList
            data={ads}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAdItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyMessage}>Você ainda não criou nenhum anúncio.</Text>
            }
          />

          {/* Lista de Treinamentos */}
          <Text style={styles.sectionTitle}>Meus Treinamentos</Text>
          <FlatList
            data={trainings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTrainingItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyMessage}>Você ainda não criou nenhum treinamento.</Text>
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
  adCard: {
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
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  adStats: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  trainingCard: {
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
  trainingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  trainingDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  trainingStats: {
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

export default AdvertiserDashboardScreen;