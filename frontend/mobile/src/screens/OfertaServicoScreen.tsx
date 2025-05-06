import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity, // Para botões de status
  ListRenderItemInfo,
  RefreshControl // Para pull-to-refresh na lista
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import {
  fetchMyOffers as apiFetchMyOffers,
  createOffer as apiCreateOffer
} from '../services/api';
import { Offer, OfferData, OfferStatus } from '../types/offer'; // Tipos de Oferta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props (sem parâmetros de rota agora)
type OfertaServicoScreenProps = NativeStackScreenProps<RootStackParamList, 'OfertaServico'>;

// Valores válidos para o status (para botões/validação)
const validStatuses: OfferStatus[] = ['draft', 'ready'];

/**
 * Tela que permite ao prestador criar e gerenciar suas ofertas de serviço.
 * Usa as rotas do backend: /api/oferta (POST, GET)
 */
export default function OfertaServicoScreen({ navigation, route }: OfertaServicoScreenProps) {
  // 3. Obter usuário (para token) e parâmetros da rota
  const { user } = useAuth();
  // Extrair parâmetros da rota (offerId e mode)
  const { offerId, mode } = route.params;

  // 4. Tipar Estados
  // Estados do Formulário
  const [descricao, setDescricao] = useState<string>('');
  const [preco, setPreco] = useState<string>(''); // Input é string
  const [status, setStatus] = useState<OfferStatus>('draft'); // Usa OfferStatus
  const [disponibilidade, setDisponibilidade] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false); // Loading para criação

  // Estados da Lista
  const [ofertas, setOfertas] = useState<Offer[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true); // Loading para lista
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar fetchOfertas com melhor tratamento de erros
  const fetchOfertas = useCallback(async () => {
    if (!user?.token) {
      // Não deveria acontecer se a tela for protegida, mas é bom verificar
      setError("Autenticação necessária para ver ofertas.");
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    setError(null);
    try {
      // Passa o token para buscar apenas as ofertas do usuário logado
      // A função apiFetchMyOffers agora retorna { offers: [] } em caso de erro 404
      const response = await apiFetchMyOffers(user.token);

      // Verifica se a resposta contém ofertas
      if (response && Array.isArray(response.offers)) {
        setOfertas(response.offers);
        // Se a lista estiver vazia, podemos mostrar uma mensagem amigável
        if (response.offers.length === 0) {
          console.log('Nenhuma oferta encontrada para este usuário.');
          // Não definimos erro aqui, pois lista vazia não é um erro
        }
      } else {
        // Este caso não deve ocorrer com as melhorias na API, mas mantemos por segurança
        console.warn('Resposta da API não contém array de ofertas.');
        setOfertas([]);
      }
    } catch (err) {
      // Mesmo com as melhorias na API, ainda pode haver outros tipos de erros
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar ofertas:', msg);
      setError(msg);
      // Não mostramos o Alert para não incomodar o usuário, apenas registramos o erro
      // e mostramos na interface de forma menos intrusiva
    } finally {
      setLoadingList(false);
    }
  }, [user?.token]); // Depende do token do usuário

  // Carrega as ofertas ao montar ou quando o token mudar
  useEffect(() => {
    fetchOfertas();
  }, [fetchOfertas]);

  // 6. Refatorar handleCreateOffer com melhor tratamento de erros
  const handleCreateOffer = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária.');
      return;
    }

    // Validação básica
    if (!descricao.trim() || !preco.trim() || !disponibilidade.trim()) {
      Alert.alert('Erro de Validação', 'Descrição, Preço e Disponibilidade são obrigatórios.');
      return;
    }
    const precoNumero = Number(preco);
    if (isNaN(precoNumero) || precoNumero < 0) {
      Alert.alert('Erro de Validação', 'Preço inválido.');
      return;
    }

    setIsCreating(true);
    const offerData: OfferData = {
      descricao: descricao.trim(),
      preco: precoNumero,
      status,
      disponibilidade: disponibilidade.trim(),
    };

    try {
      // A função apiCreateOffer agora tem melhor tratamento de erros
      const response = await apiCreateOffer(user.token, offerData);

      // Verifica se a resposta indica sucesso
      if (response && response.sucesss !== false) {
        Alert.alert('Sucesso', response.message || 'Oferta criada com sucesso!');
        // Limpar formulário
        setDescricao('');
        setPreco('');
        setDisponibilidade('');
        setStatus('draft');
        // Recarregar a lista de ofertas
        fetchOfertas();
      } else {
        // Este caso não deve ocorrer com as melhorias na API, mas mantemos por segurança
        console.warn('Resposta da API indica falha ao criar oferta:', response);
        Alert.alert('Aviso', response.message || 'Não foi possível confirmar se a oferta foi criada. Verifique sua lista de ofertas.');
      }
    } catch (err) {
      // Mesmo com as melhorias na API, ainda pode haver outros tipos de erros
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao criar oferta:', msg);

      // Mensagem mais amigável para o usuário
      Alert.alert(
        'Erro ao Criar Oferta', 
        'Não foi possível criar a oferta no momento. Por favor, tente novamente mais tarde.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // 7. Tipar renderItem e keyExtractor
  const renderItem = ({ item }: ListRenderItemInfo<Offer>): JSX.Element => (
    // TODO: Adicionar botões de Editar/Excluir aqui
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle} numberOfLines={1}>{item.descricao}</Text>
      <Text>Preço: R$ {item.preco.toFixed(2)}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Disponibilidade: {item.disponibilidade}</Text>
    </View>
  );

  const keyExtractor = (item: Offer): string => item._id;

  // Componente para lista vazia com mensagem mais informativa
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyListText}>Você ainda não criou nenhuma oferta.</Text>
      <Text style={styles.emptyListSubText}>
        Use o formulário acima para criar sua primeira oferta de serviço.
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchOfertas}
      >
        <Text style={styles.refreshButtonText}>Atualizar Lista</Text>
      </TouchableOpacity>
    </View>
  );

  // Função auxiliar para botões de status
  const renderStatusButton = (value: OfferStatus, title: string) => (
    <TouchableOpacity
      style={[styles.statusButton, status === value ? styles.statusButtonSelected : {}]}
      onPress={() => setStatus(value)}
      disabled={isCreating}
    >
      <Text style={[styles.statusButtonText, status === value ? styles.statusButtonTextSelected : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.screenContainer}>
        {/* --- Formulário de Criação --- */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Criar Nova Oferta</Text>
          <Text style={styles.label}>Descrição *</Text>
          <TextInput
            placeholder="Descrição detalhada do serviço"
            value={descricao}
            onChangeText={setDescricao}
            style={styles.input}
            editable={!isCreating}
          />
          <Text style={styles.label}>Preço (R$) *</Text>
          <TextInput
            placeholder="Ex: 150.00"
            value={preco}
            onChangeText={setPreco}
            keyboardType="numeric"
            style={styles.input}
            editable={!isCreating}
          />
          <Text style={styles.label}>Disponibilidade *</Text>
          <TextInput
            placeholder="Ex: Imediata, Agendar, Próx. semana"
            value={disponibilidade}
            onChangeText={setDisponibilidade}
            style={styles.input}
            editable={!isCreating}
          />
          <Text style={styles.label}>Status Inicial *</Text>
          <View style={styles.statusButtonGroup}>
            {renderStatusButton('draft', 'Rascunho (Draft)')}
            {renderStatusButton('ready', 'Pronta (Ready)')}
          </View>
          <Button
            title={isCreating ? "Criando..." : "Criar Oferta"}
            onPress={handleCreateOffer}
            disabled={isCreating || loadingList} // Desabilita se estiver criando ou carregando lista
          />
        </View>

        {/* --- Lista de Ofertas Existentes --- */}
        <View style={styles.listSectionContainer}>
          <Text style={styles.listTitle}>Minhas Ofertas</Text>
          {loadingList ? (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }}/>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {error.includes('404') ? 
                  'Não foi possível conectar ao serviço de ofertas. Tente novamente mais tarde.' : 
                  `Erro ao carregar ofertas: ${error}`}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchOfertas}
              >
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={ofertas}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              ListEmptyComponent={renderEmptyList}
              // Adicionando refresh control para permitir ao usuário atualizar a lista
              refreshControl={
                <RefreshControl 
                  refreshing={loadingList} 
                  onRefresh={fetchOfertas}
                  colors={['#0000ff']}
                  tintColor="#0000ff"
                />
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 8. Estilos
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  statusButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  statusButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  statusButtonText: {
    color: '#555',
  },
  statusButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listSectionContainer: {
    padding: 20,
    flex: 1, // Para ocupar espaço se o form for pequeno
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: { // Para lista vazia
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 20,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffdddd',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
