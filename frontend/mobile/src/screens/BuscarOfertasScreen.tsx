import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity, // Para tornar itens clicáveis
  ListRenderItemInfo
} from 'react-native';

// 1. Imports de tipos e API
import { Offer, FetchOffersParams } from "@/types/offer";
import { 
  fetchPublicOffers as apiFetchPublicOffers,
  fetchAuthenticatedOffers as apiFetchAuthenticatedOffers
} from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/context/AuthContext";

// 2. Tipo das Props da Tela
type BuscarOfertasScreenProps = NativeStackScreenProps<RootStackParamList, 'BuscarOfertas'>;

/**
 * Tela para filtrar e pesquisar ofertas públicas (status "ready").
 * Permite buscar por texto e filtrar por preço máximo.
 */
export default function BuscarOfertasScreen({ navigation }: BuscarOfertasScreenProps) {
  // 3. Tipar Estados
  const [textoPesquisa, setTextoPesquisa] = useState<string>('');
  const [precoMax, setPrecoMax] = useState<string>(''); // Input é string
  const [ofertas, setOfertas] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Inicia como false, busca é manual
  const [error, setError] = useState<string | null>(null);

  // Acessa o contexto de autenticação
  const { user, isTokenValid } = useAuth();

  // 4. Refatorar handleSearch
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOfertas([]); // Limpa resultados anteriores

    // Monta objeto de parâmetros para a API
    const params: FetchOffersParams = {
      status: 'ready', // Busca apenas ofertas prontas (conforme descrição original)
    };
    if (textoPesquisa.trim()) {
      params.textoPesquisa = textoPesquisa.trim();
    }
    const precoMaxNum = Number(precoMax);
    if (!isNaN(precoMaxNum) && precoMaxNum >= 0) {
      params.precoMax = precoMaxNum;
    } else if (precoMax.trim() !== '') {
      // Avisa se o preço máximo for inválido, mas não impede a busca sem ele
      Alert.alert("Aviso", "Preço máximo inválido, buscando sem limite de preço.");
    }

    try {
      let response;

      // Verifica se o usuário está autenticado e tem um token válido
      if (user && user.token && isTokenValid) {
        console.log('Buscando ofertas com autenticação');
        // Usa a função de busca autenticada
        response = await apiFetchAuthenticatedOffers(user.token, params);
      } else {
        console.log('Buscando ofertas públicas (sem autenticação)');
        // Usa a função de busca pública
        response = await apiFetchPublicOffers(params);
      }

      setOfertas(response.offers);

      // Se não encontrou ofertas, mostra uma mensagem
      if (response.offers.length === 0) {
        Alert.alert("Informação", "Nenhuma oferta encontrada com estes critérios.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      Alert.alert('Erro ao Buscar Ofertas', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [textoPesquisa, precoMax, user, isTokenValid]); // Depende dos filtros e do estado de autenticação

  // 5. Tipar renderItem
  const renderItem = ({ item }: ListRenderItemInfo<Offer>): React.ReactElement => (
    // 7. Navegação para detalhes da oferta
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => {
        // Navega para a tela de detalhes da oferta
        navigation.navigate('OfertaServico', { 
          offerId: item._id,
          mode: 'view' // Modo de visualização
        });
      }}
    >
      <Text style={styles.itemTitle} numberOfLines={1}>{item.descricao}</Text>
      <Text style={styles.itemDetail}>Preço: R$ {item.preco.toFixed(2)}</Text>
      <Text style={styles.itemDetail}>Disponibilidade: {typeof item.disponibilidade === 'string' 
        ? item.disponibilidade 
        : item.disponibilidade.observacoes || 'Verificar detalhes'}</Text>
      {item.prestadorId && (
        <Text style={styles.itemDetail}>ID do Prestador: {item.prestadorId}</Text>
      )}
    </TouchableOpacity>
  );

  // 6. Tipar keyExtractor
  const keyExtractor = (item: Offer): string => item._id;

  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhuma oferta encontrada com estes critérios.</Text>
    </View>
  );

  // Efeito para buscar ofertas automaticamente ao montar o componente ou quando o estado de autenticação mudar
  useEffect(() => {
    // Só executa a busca automática se não estiver já carregando
    if (!loading) {
      console.log('Executando busca automática devido a mudança no estado de autenticação');
      handleSearch()
        .catch(err => {
          console.error('Erro na busca automática:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isTokenValid]); // Dependências: estado de autenticação

  return (
    <View style={styles.screenContainer}>
      <View style={styles.searchContainer}>
        <Text style={styles.title}>Buscar Ofertas</Text>

        {/* Indicador de estado de autenticação */}
        <View style={styles.authStatusContainer}>
          <Text style={styles.authStatusText}>
            {user && isTokenValid 
              ? "Modo: Autenticado ✓" 
              : "Modo: Visitante (não autenticado)"}
          </Text>
        </View>

        <TextInput
          placeholder="Digite um texto de pesquisa..."
          value={textoPesquisa}
          onChangeText={setTextoPesquisa}
          style={styles.input}
          editable={!loading}
          returnKeyType="search" // Melhora usabilidade do teclado
          onSubmitEditing={handleSearch} // Permite buscar com enter
        />
        <TextInput
          placeholder="Preço Máximo (ex: 50.00)"
          value={precoMax}
          onChangeText={setPrecoMax}
          keyboardType="numeric"
          style={styles.input}
          editable={!loading}
        />
        <Button
          title={loading ? "Buscando..." : "Buscar"}
          onPress={handleSearch}
          disabled={loading}
        />
      </View>

      {/* 8. Adicionar UI para Carregamento/Erro */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      {error && !loading && ( // Mostra erro apenas se não estiver carregando
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Erro: {error}</Text>
        </View>
      )}

      {/* Lista de Resultados (só mostra se não estiver carregando e sem erro inicial) */}
      {!loading && !error && (
        <FlatList
          data={ofertas}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyList} // 9. Componente lista vazia
          style={styles.list}
          contentContainerStyle={ofertas.length === 0 ? styles.listEmptyContainer : {}}
        />
      )}
    </View>
  );
}

// 10. Estilos
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 15, // Padding geral
  },
  searchContainer: {
    marginBottom: 15, // Espaço abaixo da busca
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20, // Maior
    fontWeight: 'bold',
    marginBottom: 10,
  },
  authStatusContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  authStatusText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1, // Faz a lista ocupar o espaço restante
    marginTop: 10,
  },
  listEmptyContainer: {
    flex: 1, // Centraliza o empty component se a lista ocupa espaço
    justifyContent: 'center',
    alignItems: 'center'
  },
  centerContainer: { // Para Loading, Error, Empty List
    // flex: 1, // Pode causar problemas se usado dentro de outro container flex
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 5, // Pequeno espaço entre itens
    borderRadius: 5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemDetail: {
    fontSize: 14,
    color: '#444',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
