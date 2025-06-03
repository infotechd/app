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
  SectionList // Adicionar SectionList para resolver o problema de nesting (aninhamento)
} from 'react-native';

/**
 * Este arquivo implementa a tela de dashboard do comprador, que exibe ofertas disponíveis,
 * contratações feitas pelo usuário e ações rápidas que podem ser realizadas.
 */

// 1. Imports - Importações de bibliotecas e componentes necessários
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublicOffers as apiFetchPublicOffers,
  fetchMyHiredContratacoes as apiFetchMyHiredContratacoes
} from '../services/api';
import { Offer, FetchOffersParams } from "@/types/offer";
import { Contratacao } from "@/types/contratacao";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props - Definição do tipo de propriedades que o componente recebe
type BuyerDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'BuyerDashboard'>;

export default function BuyerDashboardScreen({ navigation }: BuyerDashboardScreenProps) {
  // 3. Obter usuário/token - Obtém informações do usuário autenticado
  const { user } = useAuth();

  // 4. Tipar Estados - Definição dos estados com tipagem para gerenciar os dados da tela
  const [offers, setOffers] = useState<Offer[]>([]); // Ofertas disponíveis
  const [hiredContracts, setHiredContracts] = useState<Contratacao[]>([]); // Contratações feitas
  const [loading, setLoading] = useState<boolean>(true); // Estado de carregamento
  const [error, setError] = useState<string | null>(null); // Estado de erro

  // 5. Refatorar Fetching de Dados - Função para carregar dados do dashboard
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
      const offerParams: FetchOffersParams = { status: 'ready', limite: 10 }; // Exemplo: Limitar a 10
      // Parâmetros para buscar contratações (ex: não canceladas) - opcional
      // const contractParams: FetchContratacoesParams = { status: ['accepted', 'in_progress', 'completed', 'paid'] };

      // Executa ambas as requisições em paralelo para melhor performance
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

  // Hook de efeito para carregar os dados quando o componente é montado
  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
    };

    // Trata a promessa adequadamente para evitar o aviso "Promise returned from fetchData is ignored"
    // (Promessa retornada de fetchData é ignorada)
    fetchData().catch(err => {
      console.error("Erro em fetchData:", err);
    });
  }, [loadDashboardData]);

  // 6. Refatorar Navegação - Funções para lidar com a navegação entre telas
  /**
   * Função que lida com o clique em uma oferta, navegando para a tela de detalhes
   * @param offer Objeto contendo os dados da oferta selecionada
   */
  const handleOfferPress = (offer: Offer) => {
    navigation.navigate('OfferDetail', { offerId: offer._id });
  };

  /**
   * Função que lida com o clique em uma contratação, navegando para a tela de detalhes
   * @param contract Objeto contendo os dados da contratação selecionada
   */
  const handleContractPress = (contract: Contratacao) => {
    navigation.navigate('ContratacaoDetalhe', { contratacaoId: contract._id });
  };

  // 7. Tipar Renderização das Listas - Componentes para renderizar os itens das listas
  /**
   * Renderiza um item de oferta na lista horizontal
   * @param item Dados da oferta a ser renderizada
   * @returns Componente React representando o item da oferta
   */
  const renderOfferItem = ({ item }: ListRenderItemInfo<Offer>): React.ReactElement => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      <Text style={styles.offerTitle} numberOfLines={1}>{item.descricao}</Text>
      <Text style={styles.offerPrice}>R$ {item.preco.toFixed(2)}</Text>
      {/* Adicionar nome do prestador se disponível */}
      {/* <Text>Por: {item.prestadorNome || 'Não informado'}</Text> */}
    </TouchableOpacity>
  );

  /**
   * Renderiza um item de contratação na lista vertical
   * @param item Dados da contratação a ser renderizada
   * @returns Componente React representando o item da contratação
   */
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

  /**
   * Renderiza uma mensagem quando a lista está vazia
   * @param message Mensagem a ser exibida
   * @returns Componente Text com a mensagem formatada
   */
  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal --- Lógica condicional para exibir diferentes estados da tela
  // Exibe indicador de carregamento quando está carregando e não há dados
  if (loading && offers.length === 0 && hiredContracts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  // Exibe mensagem de erro quando ocorre um erro e não há dados
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

  // Usando SectionList para evitar o erro de VirtualizedLists aninhadas (listas virtualizadas dentro de outras listas)

  /**
   * Componente para renderizar a lista horizontal de ofertas
   * Utiliza FlatList para exibir as ofertas em um formato de rolagem horizontal
   */
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
  /**
   * Tipo que representa os possíveis itens que podem ser renderizados nas seções
   * Pode ser uma string (para cabeçalhos e ações), um objeto Contratacao ou uma string específica para indicar lista vazia
   */
  type SectionItem = string | Contratacao | "empty_contracts";

  /**
   * Define o tipo para as seções da SectionList
   * Cada seção tem um título, dados e uma função para renderizar os itens
   */
  type Section = {
    title: string;
    data: readonly SectionItem[];
    renderItem: (info: {item: SectionItem}) => React.ReactElement;
  };

  /**
   * Preparar as seções para o SectionList
   * Cada seção representa uma parte diferente da tela:
   * 1. Cabeçalho com boas-vindas
   * 2. Lista horizontal de ofertas disponíveis
   * 3. Lista vertical de contratações do usuário
   * 4. Botões de ações rápidas
   */
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

  /**
   * Renderização principal do componente
   * Utiliza SectionList para organizar o conteúdo em seções distintas
   */
  return (
    <SectionList<SectionItem, Section>
      style={styles.container}
      sections={sections}
      keyExtractor={(item, index) => {
        // Gera chaves únicas para cada item baseado em seu tipo
        if (typeof item === 'string') return item + index;
        return item && typeof item === 'object' && '_id' in item ? item._id : index.toString();
      }}
      renderSectionHeader={({section}) => (
        // Renderiza os títulos das seções, exceto para o cabeçalho
        section.title !== "Header" ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null
      )}
      renderItem={({section, item}) => section.renderItem({item})}
      refreshControl={
        // Adiciona funcionalidade de pull-to-refresh (puxar para atualizar)
        <RefreshControl refreshing={loading} onRefresh={() => loadDashboardData(true)} />
      }
      ListFooterComponent={() => <View style={{ height: 40 }} />} // Espaço no final da lista
      stickySectionHeadersEnabled={false} // Desativa cabeçalhos fixos ao rolar
    />
  );
}

/**
 * Estilos completos para o BuyerDashboardScreen
 * Organiza a aparência visual de todos os componentes da tela
 */
const styles = StyleSheet.create({
  // Estilo do container principal
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Cor de fundo clara
  },
  // Estilo do cabeçalho com mensagem de boas-vindas
  header: {
    marginBottom: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  // Estilo da mensagem de boas-vindas
  welcomeMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  // Estilo do subtítulo do cabeçalho
  subheader: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Estilo do container de carregamento
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  // Estilo do container de erro
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  // Estilo da mensagem de erro
  errorMessage: {
    fontSize: 16,
    color: '#e74c3c', // Vermelho para indicar erro
    textAlign: 'center',
    marginBottom: 16,
  },
  // Estilo da mensagem de erro durante atualização
  errorRefreshMessage: {
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 10,
  },
  // Estilo do botão de tentar novamente
  retryButton: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#007BFF', // Azul
    borderRadius: 5,
  },
  // Estilo do texto do botão de tentar novamente
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilo dos títulos das seções
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  // Estilo da lista horizontal
  horizontalList: {
    marginBottom: 20,
  },
  // Estilo dos cards de ofertas
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
    elevation: 2, // Sombra para Android
  },
  // Estilo do título da oferta
  offerTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#333' 
  },
  // Estilo do preço da oferta
  offerPrice: { 
    fontSize: 14, 
    color: '#007BFF', // Azul para destacar o preço
    fontWeight: 'bold', 
    marginTop: 4 
  },
  // Estilo dos cards de contratações
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
  // Estilo do título da contratação
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Estilo do status da contratação
  bookingStatus: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  // Estilo da data da contratação
  bookingDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  // Estilo da mensagem de lista vazia
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  // Estilo do container de botões de ação
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
