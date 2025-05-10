import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ListRenderItemInfo // Tipo para renderItem
} from 'react-native';
// Adiciona a referência para o namespace JSX


// 1. Imports de tipos e API
import { Training } from "@/types/training";
import { fetchTrainings as apiFetchTrainings } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props da Tela
type TreinamentoListScreenProps = NativeStackScreenProps<RootStackParamList, 'TreinamentoList'>;

/**
 * TreinamentoListScreen – Exibe uma lista de treinamentos publicados.
 * Busca dados da API e permite navegar para os detalhes de um treinamento.
 */
export default function TreinamentoListScreen({ navigation }: TreinamentoListScreenProps) {
  // 3. Tipar Estados
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Refatorar fetchTreinamentos para usar a API tipada
  const loadTrainings = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpa erro anterior
    try {
      const response = await apiFetchTrainings();
      setTrainings(response.trainings); // A resposta já está tipada
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      Alert.alert('Erro ao Buscar Treinamentos', errorMessage); // Alerta opcional
      setTrainings([]); // Limpa treinamentos em caso de erro
    } finally {
      setLoading(false);
    }
  }, []); // useCallback para evitar recriação desnecessária

  // Busca inicial ao montar a tela
  useEffect(() => {
    // Usando IIFE (Immediately Invoked Function Expression) para lidar com a Promise
    (async () => {
      try {
        await loadTrainings();
      } catch (error) {
        console.error('Erro ao carregar treinamentos:', error);
      }
    })();
  }, [loadTrainings]); // Inclui loadTrainings como dependência

  // Renderização do indicador de carregamento
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando treinamentos...</Text>
      </View>
    );
  }

  // Renderização da mensagem de erro
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
        {/* Adicionar um botão para tentar novamente */}
        {/* <Button title="Tentar Novamente" onPress={loadTrainings} /> */}
      </View>
    );
  }

  // 5. Tipar renderItem
  const renderItem = ({ item }: ListRenderItemInfo<Training>): JSX.Element => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('TreinamentoDetail', { treinamentoId: item._id })}
    >
      <View >
        <Text style={styles.itemTitle}>{item.titulo}</Text>
        {/* Exibe descrição apenas se existir */}
        {item.descricao && (
          <Text style={styles.itemDescription} numberOfLines={2}>{item.descricao}</Text>
        )}
        {/* Adicionar mais informações se desejar (formato, preço) */}
        {/* <Text style={styles.itemMeta}>Formato: {item.formato} | Preço: R$ {item.preco.toFixed(2)}</Text> */}
      </View>
    </TouchableOpacity>
  );

  // 6. Tipar keyExtractor
  const keyExtractor = (item: Training): string => item._id;

  // Componente para lista vazia
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhum treinamento encontrado.</Text>
    </View>
  );


  // Renderização da lista
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={trainings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyList} // 7. Adicionar componente para lista vazia
        // Adicionar Pull-to-refresh se desejar
        // onRefresh={loadTrainings}
        // refreshing={loading}
      />
    </View>
  );
}

// 8. Estilos
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    flex: 1,
  },
  itemContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#eee', // Borda mais suave
    backgroundColor: '#fff', // Fundo branco para itens
  },
  itemTitle: {
    fontSize: 17, // Um pouco maior
    fontWeight: '600', // Semi-bold
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#555', // Cinza mais escuro
  },
  itemMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
