import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  SectionList, // Usar SectionList para múltiplas seções de dados (permite organizar conteúdo em seções)
  SectionListRenderItemInfo
} from 'react-native';

// 1. Imports (Importações necessárias para o funcionamento da tela)
import { useAuth } from "@/context/AuthContext"; // Contexto de autenticação para obter dados do usuário logado
import {
  fetchMyOffers as apiFetchMyOffers, // Função para buscar ofertas do prestador
  fetchReceivedContratacoes as apiFetchReceivedContratacoes // Função para buscar contratações recebidas
} from '../services/api'; // Funções da API tipadas para comunicação com o backend
import { Offer } from "@/types/offer"; // Tipo Offer (define a estrutura de dados de uma oferta)
import { Contratacao } from "@/types/contratacao"; // Tipo Contratacao (define a estrutura de dados de uma contratação)
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipo para as props de navegação
import { RootStackParamList } from "@/navigation/types"; // Tipos de Navegação (define as rotas disponíveis no app)

// 2. Tipo das Props (Define o tipo de propriedades que este componente recebe)
type ProviderDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'ProviderDashboard'>;

export default function ProviderDashboardScreen({ navigation }: ProviderDashboardScreenProps) {
  // 3. Obter usuário/token do contexto (Recupera informações do usuário autenticado)
  const { user } = useAuth();

  // 4. Definição dos Estados com Tipagem (Armazena e gerencia os dados da tela)
  const [offers, setOffers] = useState<Offer[]>([]); // Lista de ofertas do prestador
  const [bookings, setBookings] = useState<Contratacao[]>([]); // Lista de contratações recebidas (renomeado para clareza e tipado)
  const [loading, setLoading] = useState<boolean>(true); // Controla o estado de carregamento
  const [error, setError] = useState<string | null>(null); // Armazena mensagens de erro, se houver

  // 5. Função para Carregamento de Dados (Busca dados da API de forma otimizada)
  const loadDashboardData = useCallback(async (isRefreshing = false) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      setError("Autenticação necessária.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true); // Ativa indicador de carregamento apenas no carregamento inicial
    setError(null); // Limpa erros anteriores

    try {
      // Busca ofertas e contratações em paralelo para melhor performance
      const [offersResponse, bookingsResponse] = await Promise.all([
        apiFetchMyOffers(user.token), // Chamada à API para buscar ofertas do prestador
        apiFetchReceivedContratacoes(user.token) // Chamada à API para buscar contratações recebidas
      ]);
      setOffers(offersResponse.offers); // Atualiza o estado com as ofertas recebidas
      setBookings(bookingsResponse.contratacoes); // Atualiza o estado com as contratações (nome do array na resposta da API)
    } catch (err) {
      // Tratamento de erro com mensagem amigável
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard.';
      setError(msg);
      // Não limpar dados antigos em caso de erro no refresh para manter a experiência do usuário
      // setOffers([]);
      // setBookings([]);
    } finally {
      // Finaliza o estado de carregamento apenas se não for um refresh
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]); // Recria a função apenas quando o token do usuário mudar

  // Efeito para Carregamento Inicial de Dados (Executa quando o componente é montado)
  useEffect(() => {
    const fetchData = async () => {
      try {
        await loadDashboardData(); // Carrega os dados do dashboard
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      }
    };

    fetchData().catch(error => {
      console.error('Falha ao buscar dados do dashboard:', error);
    });
  }, [loadDashboardData]); // Executa novamente se a função loadDashboardData mudar

  // 6. Funções de Navegação (Gerenciam a navegação para outras telas)
  const handleOfferPress = (offer: Offer) => {
    // Navega para a tela de detalhes da oferta, passando o ID como parâmetro
    navigation.navigate('OfferDetail', { offerId: offer._id });
  };

  const handleBookingPress = (booking: Contratacao) => {
    // Navega para a tela de detalhes da contratação, passando o ID como parâmetro
    navigation.navigate('ContratacaoDetalhe', { contratacaoId: booking._id });
  };

  // 7. Funções de Renderização com Tipagem (Definem como cada item será exibido na interface)
  const renderOfferItem = ({ item }: ListRenderItemInfo<Offer>): React.ReactElement => (
    <TouchableOpacity style={styles.offerCard} onPress={() => handleOfferPress(item)}>
      {/* Renderiza os campos da interface Offer de forma estruturada */}
      <Text style={styles.offerTitle}>{item.descricao}</Text>
      <Text style={styles.offerStatus}>Status: {item.status}</Text>
      <Text style={styles.offerPrice}>Preço: R$ {item.preco.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderBookingItem = ({ item }: ListRenderItemInfo<Contratacao>): React.ReactElement => (
    <TouchableOpacity style={styles.bookingCard} onPress={() => handleBookingPress(item)}>
      {/* Renderiza os campos da interface Contratacao de forma estruturada */}
      {/* Idealmente, a API traria o título da oferta ou nome do comprador para melhor experiência */}
      <Text style={styles.bookingTitle}>Contrato ID: {item._id}</Text>
      <Text style={styles.bookingStatus}>Status: {item.status}</Text>
      <Text style={styles.bookingDate}>
        Contratado em: {new Date(item.dataContratacao).toLocaleDateString('pt-BR')}
      </Text>
      {/* Renderização condicional: adiciona nome do comprador se a API fornecer esse dado */}
      {/* item.compradorNome && <Text>Comprador: {item.compradorNome}</Text> */}
    </TouchableOpacity>
  );

  // Função para renderizar mensagem quando a lista estiver vazia
  const renderListEmpty = (message: string) => (
    <Text style={styles.emptyMessage}>{message}</Text>
  );

  // --- Renderização Principal (Lógica de exibição condicional da interface) ---

  // Exibe tela de carregamento quando estiver buscando dados pela primeira vez
  if (loading && offers.length === 0 && bookings.length === 0) { // Mostra loading apenas na carga inicial para melhor experiência
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Carregando dados...</Text>
      </View>
    );
  }

  // Exibe tela de erro quando ocorrer falha na busca de dados e não houver conteúdo para mostrar
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

  // Implementação com SectionList (Solução otimizada para exibição de múltiplas seções)
  // Usando SectionList para evitar o erro de VirtualizedLists aninhadas
  // e para melhor performance com múltiplas seções de dados

  // Definição de tipos para o SectionList
  // Define um tipo de união para todos os possíveis tipos de itens nas seções
  type SectionItem = string | Offer | Contratacao; // Pode ser uma string para itens especiais ou objetos de dados

  // Define o tipo para as seções do SectionList
  type Section = {
    title: string; // Título da seção
    data: readonly SectionItem[]; // Array de itens da seção (somente leitura para otimização)
    renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => React.ReactElement; // Função de renderização específica para cada seção
  };

  // Definição das seções do SectionList (Estrutura de dados para a interface)
  const sections: readonly Section[] = [
    {
      title: "Cabeçalho", // Seção de cabeçalho da tela
      data: ["header"] as const, // Usamos um item dummy para renderizar o cabeçalho (apenas um marcador)
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => (
        <View style={styles.header}>
          <Text style={styles.welcomeMessage}>Bem-vindo, {user?.nome || 'Prestador'}!</Text>
          <Text style={styles.subheader}>Gerencie suas ofertas e contratações</Text>
          {/* Exibe mensagem de erro discreta se ocorreu durante atualização (refresh) */}
          {error && (offers.length > 0 || bookings.length > 0) && !loading && (
            <Text style={styles.errorRefreshMessage}>Erro ao atualizar: {error}</Text>
          )}
        </View>
      )
    },
    {
      title: "Minhas Ofertas", // Seção que lista as ofertas do prestador
      data: (offers.length > 0 ? offers : ["empty_offers"]) as readonly SectionItem[], // Usa dados reais ou marcador de lista vazia
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => {
        const item = info.item;
        // Renderização condicional: mensagem para lista vazia ou item de oferta
        if (item === "empty_offers") {
          return renderListEmpty("Você ainda não criou nenhuma oferta.");
        }
        return renderOfferItem({item: item as Offer} as ListRenderItemInfo<Offer>);
      }
    },
    {
      title: "Contratações Recebidas", // Seção que lista as contratações recebidas
      data: (bookings.length > 0 ? bookings : ["empty_bookings"]) as readonly SectionItem[], // Usa dados reais ou marcador de lista vazia
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => {
        const item = info.item;
        // Renderização condicional: mensagem para lista vazia ou item de contratação
        if (item === "empty_bookings") {
          return renderListEmpty("Nenhuma contratação recebida no momento.");
        }
        return renderBookingItem({item: item as Contratacao} as ListRenderItemInfo<Contratacao>);
      }
    },
    {
      title: "Ações Rápidas", // Seção com botões de ação para navegação rápida
      data: ["actions"] as const, // Marcador único para renderizar os botões de ação
      renderItem: (info: SectionListRenderItemInfo<SectionItem, Section>) => (
        <View style={styles.actionButtonsContainer}>
          {/* Botão para gerenciar ofertas */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('OfertaServico', { offerId: '', mode: 'list' })}
          >
            <Text style={styles.actionButtonText}>Gerenciar Minhas Ofertas</Text>
          </TouchableOpacity>

          {/* Botão para acessar agenda */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Agenda')}
          >
            <Text style={styles.actionButtonText}>Minha Agenda</Text>
          </TouchableOpacity>

          {/* Botão para atualizar currículo */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CurriculoForm')}
          >
            <Text style={styles.actionButtonText}>Atualizar Currículo</Text>
          </TouchableOpacity>
        </View>
      )
    }
  ];

  // Renderização do componente SectionList (Componente principal da interface)
  return (
    <SectionList<SectionItem, Section>
      style={styles.container}
      sections={sections} // Array de seções definido anteriormente
      keyExtractor={(item, index) => {
        // Função para gerar chaves únicas para cada item
        if (typeof item === 'string') return item + index; // Para itens de marcação (strings)
        return (item as any)._id || index.toString(); // Para objetos de dados (ofertas e contratações)
      }}
      renderSectionHeader={({section}) => (
        // Renderiza o cabeçalho de cada seção, exceto para a seção "Cabeçalho"
        section.title !== "Cabeçalho" ? (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        ) : null
      )}
      renderItem={(info) => info.section.renderItem(info)} // Usa a função de renderização específica de cada seção
      refreshControl={
        // Componente para permitir atualização por gesto de puxar para baixo
        <RefreshControl refreshing={loading} onRefresh={() => loadDashboardData(true)} />
      }
      ListFooterComponent={() => <View style={{ height: 40 }} />} // Espaço em branco no final da lista
      stickySectionHeadersEnabled={false} // Desativa cabeçalhos fixos durante a rolagem
    />
  );
}

// Definição de Estilos (Estilização completa para todos os componentes da tela)
// Cada objeto define as propriedades visuais de um elemento específico da interface
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
