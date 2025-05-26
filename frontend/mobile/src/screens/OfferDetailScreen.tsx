import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchPublicOfferById, fetchMyOfferById, deleteOffer } from '@/services/api';
import { Offer, IDisponibilidade, IRecorrenciaSemanal } from '@/types/offer';
import { TipoUsuarioEnum } from '@/types/user';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Ionicons } from '@expo/vector-icons';

// Tipo das props da tela
type OfferDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'OfferDetail'>;

/**
 * Tela de detalhes da oferta
 * Exibe informações detalhadas sobre uma oferta específica
 * Comportamento diferente para prestadores (proprietários da oferta) e compradores
 */
export default function OfferDetailScreen({ route, navigation }: OfferDetailScreenProps) {
  // Obter o ID da oferta dos parâmetros da rota
  const { offerId } = route.params;

  // Garantir que offerId é uma string válida
  const offerIdString = offerId ? String(offerId) : "";

  // Obter informações do usuário autenticado
  const { user } = useAuth();

  // Estados
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Verificar se o usuário é o proprietário da oferta
  const isOwner = user && offer && user.idUsuario === (typeof offer.prestadorId === 'object' ? offer.prestadorId._id : offer.prestadorId);

  // Verificar se o usuário é um prestador
  const isPrestador = user?.tipoUsuario === TipoUsuarioEnum.PRESTADOR;

  // Função para carregar os detalhes da oferta
  const loadOfferDetails = useCallback(async () => {
    if (!offerIdString) {
      setError('ID da oferta não fornecido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      // Se o usuário é um prestador, tenta buscar como oferta própria primeiro
      if (user && isPrestador && user.token) {
        response = await fetchMyOfferById(user.token, offerIdString);

        // Verificar se a resposta tem a estrutura esperada
        if (response && typeof response === 'object') {
          if (response.success && response.offer) {
            setOffer(response.offer);
            setLoading(false);
            return;
          } else if (!response.success) {
            // Se a resposta não foi bem-sucedida, mas não lançou erro, tentamos buscar como oferta pública
            console.log('Não é uma oferta própria, tentando como oferta pública', response.message);
            // Não definimos o erro ainda, tentamos buscar como oferta pública primeiro
          }
        } else {
          console.error('Resposta da API (fetchMyOfferById) em formato inesperado:', response);
          // Continua o fluxo para tentar buscar como oferta pública
        }
      }

      // Busca a oferta como pública (acessível para qualquer usuário ou quando a busca como oferta própria falhou)
      // Se o usuário estiver autenticado, passa o token para a API
      response = await fetchPublicOfferById(offerIdString, user?.token);

      // Verificar se a resposta tem a estrutura esperada
      if (response && typeof response === 'object') {
        if (response.success && response.offer) {
          setOffer(response.offer);
        } else {
          // Se a resposta não foi bem-sucedida, definimos o erro
          let errorMessage = response.message || 'Oferta não encontrada';

          // Personalizar mensagem de erro
          if (errorMessage.includes('não encontrada') || errorMessage.includes('404')) {
            if (isPrestador) {
              errorMessage = `Não foi possível encontrar a oferta ${offerIdString}. Esta oferta pode não existir ou você não tem permissão para visualizá-la.`;
            } else {
              errorMessage = `Não foi possível encontrar a oferta ${offerIdString}. A oferta pode ter sido removida ou não está mais disponível.`;
            }
          }

          setError(errorMessage);
        }
      } else {
        console.error('Resposta da API em formato inesperado:', response);
        setError('Erro ao processar resposta da API. Formato inesperado.');
      }
    } catch (err) {
      // Este bloco só será executado se houver um erro não tratado nas chamadas à API
      let errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes da oferta';
      let isNotFoundError = errorMessage.includes('404') || errorMessage.includes('não encontrada');

      // Melhora as mensagens de erro para torná-las mais específicas e amigáveis
      if (isNotFoundError) {
        // Para erros 404 (não encontrado), personalizamos a mensagem de acordo com o tipo de usuário
        if (isPrestador) {
          errorMessage = `Não foi possível encontrar a oferta ${offerIdString}. Esta oferta pode não existir ou você não tem permissão para visualizá-la.`;
        } else {
          errorMessage = `Não foi possível encontrar a oferta ${offerIdString}. A oferta pode ter sido removida ou não está mais disponível.`;
        }
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Tempo de resposta excedido. O servidor pode estar sobrecarregado.';
      }

      console.error('Erro ao carregar oferta:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offerIdString, user, isPrestador]);

  // Carregar detalhes da oferta ao montar o componente
  useEffect(() => {
    loadOfferDetails();
  }, [loadOfferDetails]);

  // Função para lidar com a atualização por puxar para baixo (pull-to-refresh)
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOfferDetails();
  }, [loadOfferDetails]);

  // Função para formatar o preço no formato brasileiro
  const formatPrice = (price: number): string => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Função para formatar a disponibilidade do prestador
  const formatDisponibilidade = (disponibilidade: IDisponibilidade | string): React.ReactNode => {
    try {
      // Se a disponibilidade for uma string simples, apenas exibe o texto sem formatação adicional
      if (typeof disponibilidade === 'string') {
        return <Text style={styles.disponibilidadeText}>{disponibilidade}</Text>;
      }

      // Verifica se disponibilidade é um objeto válido
      if (!disponibilidade || typeof disponibilidade !== 'object') {
        return <Text style={styles.disponibilidadeText}>Formato de disponibilidade inválido</Text>;
      }

      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      return (
        <View style={styles.disponibilidadeContainer}>
          {disponibilidade.duracaoMediaMinutos && (
            <View style={styles.disponibilidadeItem}>
              <Text style={styles.disponibilidadeLabel}>Duração média:</Text>
              <Text style={styles.disponibilidadeText}>
                {disponibilidade.duracaoMediaMinutos} minutos
              </Text>
            </View>
          )}

          {disponibilidade.observacoes && (
            <View style={styles.disponibilidadeItem}>
              <Text style={styles.disponibilidadeLabel}>Observações:</Text>
              <Text style={styles.disponibilidadeText}>{disponibilidade.observacoes}</Text>
            </View>
          )}

          {disponibilidade.recorrenciaSemanal && Array.isArray(disponibilidade.recorrenciaSemanal) && 
           disponibilidade.recorrenciaSemanal.length > 0 && (
            <View style={styles.disponibilidadeItem}>
              <Text style={styles.disponibilidadeLabel}>Disponibilidade semanal:</Text>
              {disponibilidade.recorrenciaSemanal.map((recorrencia: IRecorrenciaSemanal, index: number) => {
                // Verifica se o objeto de recorrência é válido e se contém um dia da semana válido (0-6)
                if (!recorrencia || typeof recorrencia.diaSemana !== 'number' || 
                    recorrencia.diaSemana < 0 || recorrencia.diaSemana > 6) {
                  return (
                    <View key={index} style={styles.diaContainer}>
                      <Text style={styles.diaText}>Dia inválido</Text>
                    </View>
                  );
                }

                return (
                  <View key={index} style={styles.diaContainer}>
                    <Text style={styles.diaText}>{diasSemana[recorrencia.diaSemana]}:</Text>
                    {Array.isArray(recorrencia.horarios) ? (
                      recorrencia.horarios.map((horario, horarioIndex) => (
                        <Text key={horarioIndex} style={styles.horarioText}>
                          {horario && horario.inicio && horario.fim 
                            ? `${horario.inicio} - ${horario.fim}`
                            : 'Horário não especificado'}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.horarioText}>Horários não disponíveis</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    } catch (error) {
      console.error('Erro ao formatar disponibilidade:', error);
      return <Text style={styles.disponibilidadeText}>Erro ao exibir informações de disponibilidade</Text>;
    }
  };

  // Função para lidar com a contratação da oferta
  const handleContratarOferta = () => {
    if (!user) {
      Alert.alert(
        'Autenticação necessária',
        'Você precisa estar logado para contratar um serviço.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Fazer login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    // Navegar para a tela de contratação
    navigation.navigate('Contratacao', { ofertaId: offerIdString });
  };

  // Função para lidar com a edição da oferta
  const handleEditarOferta = () => {
    navigation.navigate('OfertaServico', { offerId: offerIdString, mode: 'edit' });
  };

  // Função para lidar com a exclusão da oferta
  const handleExcluirOferta = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            if (!user || !user.token || !offerIdString) {
              Alert.alert('Erro', 'Não foi possível excluir a oferta. Informações de autenticação ausentes.');
              return;
            }

            try {
              // Mostrar indicador de carregamento
              setLoading(true);

              // Chamar a API para excluir a oferta
              const result = await deleteOffer(user.token, offerIdString);

              // Mostrar mensagem de sucesso
              Alert.alert(
                'Sucesso',
                result.message || 'Oferta excluída com sucesso!',
                [
                  { 
                    text: 'OK', 
                    onPress: () => {
                      // Navegar de volta à tela anterior após a exclusão bem-sucedida
                      navigation.goBack();
                    }
                  }
                ]
              );
            } catch (error) {
              // Tratar erros
              const errorMessage = error instanceof Error 
                ? error.message 
                : 'Ocorreu um erro ao excluir a oferta. Tente novamente mais tarde.';

              Alert.alert('Erro', errorMessage);
            } finally {
              // Esconder indicador de carregamento
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Renderizar tela de carregamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Carregando detalhes da oferta...</Text>
      </View>
    );
  }

  // Renderizar tela de erro quando ocorrer algum problema
  if (error) {
    // Personaliza a mensagem de erro para torná-la mais amigável ao usuário
    let errorTitle = 'Erro ao carregar oferta';
    let errorMessage = error;
    let showRetryButton = true;

    // Verifica se é um erro de oferta não encontrada (código 404 ou mensagem específica)
    if (error.includes('404') || error.includes('não foi possível encontrar') || error.includes('não encontrada')) {
      errorTitle = 'Oferta não encontrada';
      errorMessage = 'A oferta que você está procurando não está disponível ou foi removida.';
      showRetryButton = false; // Remove o botão de tentar novamente para casos de ofertas não encontradas
    }

    return (
      <View style={styles.errorContainer}>
        <Ionicons 
          name={error.includes('404') || error.includes('não encontrada') ? "search" : "alert-circle"} 
          size={50} 
          color="#e74c3c" 
        />
        <Text style={styles.errorTitle}>{errorTitle}</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>

        <View style={styles.errorButtonsContainer}>
          {showRetryButton && (
            <TouchableOpacity style={styles.retryButton} onPress={loadOfferDetails}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.retryButton, styles.backButton]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Renderizar tela de oferta não encontrada
  if (!offer) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="search" size={50} color="#e74c3c" />
        <Text style={styles.errorTitle}>Oferta não encontrada</Text>
        <Text style={styles.errorText}>A oferta solicitada não existe ou não está disponível.</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizar detalhes da oferta
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cabeçalho da oferta */}
        <View style={styles.header}>
          <Text style={styles.title}>{offer.descricao || 'Sem descrição'}</Text>
          <Text style={styles.price}>{offer.preco !== undefined ? formatPrice(offer.preco) : 'Preço não disponível'}</Text>
        </View>

        {/* Status da oferta */}
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusBadge,
            offer.status === 'ready' ? styles.statusReady :
            offer.status === 'draft' ? styles.statusDraft :
            offer.status === 'inactive' ? styles.statusInactive :
            styles.statusArchived
          ]}>
            {offer.status === 'ready' ? 'Disponível' :
             offer.status === 'draft' ? 'Rascunho' :
             offer.status === 'inactive' ? 'Inativa' :
             offer.status === undefined ? 'Status desconhecido' :
             'Arquivada'}
          </Text>
        </View>

        {/* Informações do prestador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Criador</Text>
          <View style={styles.prestadorInfo}>
            {/* Nome do criador da oferta */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome:</Text>
              <Text style={styles.infoValue}>
                {typeof offer.prestadorId === 'object' && offer.prestadorId.nome 
                  ? offer.prestadorId.nome 
                  : offer.nomePrestador || offer.prestadorNome || 
                    (offer.prestadorInfo && offer.prestadorInfo.nome) || 
                    (offer.prestador && (
                      typeof offer.prestador === 'object' 
                        ? offer.prestador.nome 
                        : null
                    )) || 
                    'Nome do criador não disponível'}
              </Text>
            </View>
            {/* Categorias de serviço */}
            {offer.categorias && offer.categorias.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Categoria:</Text>
                <Text style={styles.infoValue}>{offer.categorias.join(', ')}</Text>
              </View>
            )}
            {/* Localização */}
            {offer.localizacao && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Localização:</Text>
                <Text style={styles.infoValue}>
                  {offer.localizacao.cidade ? `${offer.localizacao.cidade}, ` : ''}
                  {offer.localizacao.estado || 'Localização não especificada'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Detalhes da oferta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes da Oferta</Text>
          <Text style={styles.descricao}>{offer.descricao || 'Sem descrição detalhada'}</Text>
        </View>

        {/* Disponibilidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidade</Text>
          {offer.disponibilidade ? formatDisponibilidade(offer.disponibilidade) : 
            <Text style={styles.disponibilidadeText}>Informações de disponibilidade não fornecidas</Text>}
        </View>

        {/* Data de criação/atualização */}
        {(offer.dataCriacao || offer.dataAtualizacao) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datas</Text>
            {offer.dataCriacao && (
              <Text style={styles.dateText}>
                Criado em: {(() => {
                  try {
                    return new Date(offer.dataCriacao).toLocaleDateString('pt-BR');
                  } catch (e) {
                    console.error('Erro ao formatar data de criação:', e);
                    return 'Data inválida';
                  }
                })()}
              </Text>
            )}
            {offer.dataAtualizacao && (
              <Text style={styles.dateText}>
                Atualizado em: {(() => {
                  try {
                    return new Date(offer.dataAtualizacao).toLocaleDateString('pt-BR');
                  } catch (e) {
                    console.error('Erro ao formatar data de atualização:', e);
                    return 'Data inválida';
                  }
                })()}
              </Text>
            )}
          </View>
        )}

        {/* Botões de ação */}
        <View style={styles.actionsContainer}>
          {isOwner ? (
            // Botões de ação disponíveis para o proprietário da oferta (editar e excluir)
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]} 
                onPress={handleEditarOferta}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Editar Oferta</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={handleExcluirOferta}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Excluir Oferta</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Botão de contratação disponível para potenciais clientes
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.contractButton,
                // Aplica uma opacidade reduzida (visual de desabilitado) quando a oferta não está disponível
                offer.status !== 'ready' ? { opacity: 0.5 } : {}
              ]}
              onPress={handleContratarOferta}
              disabled={offer.status !== 'ready'}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {offer.status === 'ready' 
                  ? 'Contratar Serviço' 
                  : `Indisponível (${offer.status === 'draft' 
                      ? 'Rascunho' 
                      : offer.status === 'inactive' 
                        ? 'Inativo' 
                        : 'Arquivado'})`
                }
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#95a5a6',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 14,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  statusReady: {
    backgroundColor: '#2ecc71',
    color: 'white',
  },
  statusDraft: {
    backgroundColor: '#f39c12',
    color: 'white',
  },
  statusInactive: {
    backgroundColor: '#95a5a6',
    color: 'white',
  },
  statusArchived: {
    backgroundColor: '#7f8c8d',
    color: 'white',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  prestadorInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  prestadorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  descricao: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  disponibilidadeContainer: {
    marginTop: 5,
  },
  disponibilidadeItem: {
    marginBottom: 10,
  },
  disponibilidadeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  disponibilidadeText: {
    fontSize: 16,
    color: '#333',
  },
  diaContainer: {
    marginLeft: 10,
    marginBottom: 8,
  },
  diaText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  horarioText: {
    fontSize: 15,
    color: '#555',
    marginLeft: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  actionsContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contractButton: {
    backgroundColor: '#3498db',
  },
  editButton: {
    backgroundColor: '#f39c12',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
});
