import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
  View, // Componente para criar containers
  Text, // Componente para exibir texto
  FlatList, // Componente para renderizar listas eficientes
  ActivityIndicator, // Componente para indicar carregamento
  TouchableOpacity, // Componente para criar áreas clicáveis
  StyleSheet, // API para criar estilos
  Alert, // API para exibir alertas
  ListRenderItemInfo // Tipo para a função renderItem
} from 'react-native';
// Adiciona a referência para o namespace JSX para tipagem de elementos React


// 1. Imports de tipos e API - Importa os tipos e funções necessárias para a aplicação
import { Training } from "@/types/training"; // Tipo que define a estrutura de um treinamento
import { fetchTrainings as apiFetchTrainings } from '../services/api'; // Função para buscar treinamentos da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipo para as props de navegação
import { RootStackParamList } from "@/navigation/types"; // Tipo que define os parâmetros das rotas

// 2. Tipo das Props da Tela - Define o tipo de propriedades que esta tela recebe
type TreinamentoListScreenProps = NativeStackScreenProps<RootStackParamList, 'TreinamentoList'>;

/**
 * TreinamentoListScreen – Exibe uma lista de treinamentos publicados.
 * Busca dados da API e permite navegar para os detalhes de um treinamento.
 * Este componente é responsável por mostrar todos os treinamentos disponíveis
 * e gerenciar estados de carregamento e erros.
 */
export default function TreinamentoListScreen({ navigation }: TreinamentoListScreenProps) {
  // 3. Tipar Estados - Definição dos estados utilizados no componente
  const [trainings, setTrainings] = useState<Training[]>([]); // Lista de treinamentos
  const [loading, setLoading] = useState<boolean>(true); // Estado de carregamento
  const [error, setError] = useState<string | null>(null); // Mensagem de erro, se houver

  // 4. Função para carregar os treinamentos da API
  const loadTrainings = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpa erro anterior
    try {
      const response = await apiFetchTrainings();
      setTrainings(response.trainings); // Atualiza o estado com os treinamentos recebidos
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      Alert.alert('Erro ao Buscar Treinamentos', errorMessage); // Exibe alerta com a mensagem de erro
      setTrainings([]); // Limpa a lista de treinamentos em caso de erro
    } finally {
      setLoading(false); // Finaliza o estado de carregamento independente do resultado
    }
  }, []); // useCallback para evitar recriação desnecessária da função

  // Efeito para carregar os treinamentos quando o componente é montado
  useEffect(() => {
    // Usando IIFE (Função Imediatamente Invocada) para lidar com a Promise de forma assíncrona
    (async () => {
      try {
        await loadTrainings(); // Chama a função para carregar os treinamentos
      } catch (error) {
        console.error('Erro ao carregar treinamentos:', error); // Registra erros no console
      }
    })();
  }, [loadTrainings]); // Inclui loadTrainings como dependência para reexecutar se a função mudar

  // Renderização condicional: mostra indicador de carregamento enquanto os dados são buscados
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" /> {/* Indicador visual de carregamento */}
        <Text>Carregando treinamentos...</Text>
      </View>
    );
  }

  // Renderização condicional: mostra mensagem de erro se a busca falhar
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
        {/* Possibilidade de adicionar um botão para tentar novamente */}
        {/* <Button title="Tentar Novamente" onPress={loadTrainings} /> */}
      </View>
    );
  }

  // 5. Função para renderizar cada item da lista de treinamentos
  // Esta função cria um componente touchable para cada treinamento na lista
  const renderItem = ({ item }: ListRenderItemInfo<Training>): JSX.Element => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('TreinamentoDetail', { treinamentoId: item._id })}
    >
      {/* Cada item é clicável e navega para a tela de detalhes */}
      <View >
        <Text style={styles.itemTitle}>{item.titulo}</Text>
        {/* Exibe descrição apenas se existir */}
        {item.descricao && (
          <Text style={styles.itemDescription} numberOfLines={2}>{item.descricao}</Text>
        )}
        {/* A descrição é limitada a 2 linhas para manter a interface limpa */}
        {/* Possibilidade de adicionar mais informações como formato e preço */}
        {/* <Text style={styles.itemMeta}>Formato: {item.formato} | Preço: R$ {item.preco.toFixed(2)}</Text> */}
      </View>
    </TouchableOpacity>
  );

  // 6. Função para extrair a chave única de cada item da lista
  // Usa o ID do treinamento como chave para otimizar a renderização da lista
  const keyExtractor = (item: Training): string => item._id;

  // Componente que será renderizado quando a lista estiver vazia
  // Mostra uma mensagem informativa quando não há treinamentos disponíveis
  const renderEmptyList = () => (
    <View style={styles.centerContainer}>
      <Text>Nenhum treinamento encontrado.</Text>
    </View>
  );


  // Renderização principal da lista de treinamentos
  // Retorna um componente FlatList dentro de uma View
  return (
    <View style={styles.listContainer}>
      <FlatList
        data={trainings} // Array de dados a serem renderizados
        keyExtractor={keyExtractor} // Função para extrair chaves únicas
        renderItem={renderItem} // Função para renderizar cada item
        ListEmptyComponent={renderEmptyList} // Componente a ser mostrado quando a lista está vazia
        // Possibilidade de adicionar funcionalidade de atualizar puxando para baixo
        // onRefresh={loadTrainings}
        // refreshing={loading}
      />
    </View>
  );
}

// 8. Definição dos estilos utilizados no componente
// Estilos organizados por seções para facilitar a manutenção
const styles = StyleSheet.create({
  // Estilo para containers centralizados (usado em telas de carregamento e erro)
  centerContainer: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
    padding: 20,
  },
  // Estilo para o container principal da lista
  listContainer: {
    flex: 1, // Ocupa todo o espaço disponível
  },
  // Estilo para cada item individual da lista
  itemContainer: {
    paddingVertical: 15, // Espaçamento interno vertical
    paddingHorizontal: 20, // Espaçamento interno horizontal
    borderBottomWidth: 1, // Linha divisória entre itens
    borderColor: '#eee', // Cor da borda mais suave
    backgroundColor: '#fff', // Fundo branco para os itens
  },
  // Estilo para o título de cada item
  itemTitle: {
    fontSize: 17, // Tamanho da fonte um pouco maior
    fontWeight: '600', // Peso da fonte semi-negrito
    marginBottom: 4, // Espaçamento abaixo do título
  },
  // Estilo para a descrição de cada item
  itemDescription: {
    fontSize: 14, // Tamanho da fonte para descrição
    color: '#555', // Cor cinza mais escuro para melhor legibilidade
  },
  // Estilo para metadados adicionais (opcional)
  itemMeta: {
    fontSize: 12, // Fonte menor para informações secundárias
    color: '#888', // Cor cinza para informações menos importantes
    marginTop: 5, // Espaçamento acima dos metadados
  },
  // Estilo para mensagens de erro
  errorText: {
    color: 'red', // Cor vermelha para destacar erros
    fontSize: 16, // Tamanho da fonte para mensagens de erro
    textAlign: 'center', // Alinhamento centralizado
  },
});
