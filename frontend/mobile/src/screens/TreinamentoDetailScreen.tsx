import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  // Button // Descomente se adicionar botão "Tentar Novamente"
} from 'react-native';

// 1. Importações de tipos e API
// Esta seção importa os tipos necessários e as funções da API para o componente
import { Training } from "@/types/training"; // Importa a interface do Treinamento
import { fetchTrainingDetail as apiFetchTrainingDetail } from '../services/api'; // Importa a função da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types"; // Importa a lista de parâmetros

// 2. Definição do tipo das Props da Tela (espera 'treinamentoId' nos parâmetros)
// Este tipo define a estrutura das propriedades que este componente espera receber
type TreinamentoDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TreinamentoDetail'>;

/**
 * TreinamentoDetailScreen – Exibe os detalhes completos de um treinamento.
 * Busca os dados da API com base no ID recebido via navegação.
 * Este componente é responsável por mostrar informações detalhadas sobre um treinamento específico.
 */
export default function TreinamentoDetailScreen({ route }: TreinamentoDetailScreenProps) {
  // Extrai o ID dos parâmetros da rota
  // Obtém o ID do treinamento a partir dos parâmetros passados para esta tela
  const { treinamentoId } = route.params;

  // 3. Definição dos Estados com Tipagem
  // Estes estados gerenciam os dados do treinamento, o status de carregamento e possíveis erros
  const [training, setTraining] = useState<Training | null>(null); // Estado para armazenar os dados do treinamento
  const [loading, setLoading] = useState<boolean>(true); // Estado para controlar o indicador de carregamento
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro

  // 4. Função para Carregar os Detalhes do Treinamento
  // Esta função assíncrona busca os detalhes do treinamento da API usando o ID fornecido
  const loadTrainingDetail = useCallback(async () => {
    // Verifica se o ID do treinamento foi fornecido
    if (!treinamentoId) {
      setError("ID do treinamento não fornecido.");
      setLoading(false);
      return;
    }

    // Inicia o processo de carregamento
    setLoading(true);
    setError(null);
    try {
      // Faz a chamada à API para buscar os detalhes do treinamento
      const response = await apiFetchTrainingDetail(treinamentoId);
      setTraining(response.treinamento); // A API retorna { treinamento: Training }
    } catch (err) {
      // Tratamento de erros durante a busca
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      Alert.alert('Erro ao Buscar Detalhes', errorMessage);
      setTraining(null); // Limpa dados anteriores em caso de erro
    } finally {
      // Finaliza o estado de carregamento independentemente do resultado
      setLoading(false);
    }
  }, [treinamentoId]); // Esta função é recriada apenas quando o ID do treinamento muda

  // Efeito para carregar os detalhes do treinamento quando o componente é montado
  // ou quando a função loadTrainingDetail muda (o que ocorre quando o ID muda)
  useEffect(() => {
    (async () => {
      try {
        await loadTrainingDetail();
      } catch (error) {
        console.error("Erro ao carregar detalhes do treinamento:", error);
      }
    })();
  }, [loadTrainingDetail]);

  // Renderização do indicador de carregamento
  // Exibe um spinner de carregamento enquanto os dados estão sendo buscados
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando detalhes...</Text>
      </View>
    );
  }

  // Renderização da mensagem de erro
  // Exibe uma mensagem de erro caso ocorra algum problema durante o carregamento
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        {/* <Button title="Tentar Novamente" onPress={loadTrainingDetail} /> */}
      </View>
    );
  }

  // Renderização caso o treinamento não seja encontrado (após loading e sem erro)
  // Este caso ocorre quando a API retorna sucesso, mas não encontrou o treinamento solicitado
  if (!training) {
    return (
      <View style={styles.centerContainer}>
        <Text>Treinamento não encontrado.</Text>
      </View>
    );
  }

  // Função para formatação segura da data/hora
  // Converte strings ISO de data para o formato local brasileiro, com tratamento de erros
  const formatDateTime = (isoString: string | null): string | null => {
    if (!isoString) return null; // Retorna null se a string de data for nula
    try {
      return new Date(isoString).toLocaleString('pt-BR'); // Formata a data para o padrão brasileiro
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return "Data inválida"; // Retorna mensagem de erro em caso de falha na formatação
    }
  };

  // Formata a data do treinamento usando a função acima
  const formattedDate = formatDateTime(training.dataHora);

  // Renderização dos detalhes do treinamento
  // Esta seção retorna a interface visual com todos os detalhes do treinamento
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{training.titulo}</Text>
      <Text style={styles.description}>{training.descricao}</Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Formato:</Text>
        <Text style={styles.detailValue}>{training.formato}</Text>
      </View>

      {/* Exibe Data/Hora apenas se existir e for válida */}
      {formattedDate && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Data/Hora:</Text>
          <Text style={styles.detailValue}>{formattedDate}</Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Preço:</Text>
        <Text style={styles.detailValue}>
          {training.preco === 0 ? 'Gratuito' : `R$ ${training.preco.toFixed(2)}`}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={styles.detailValue}>{training.status}</Text>
      </View>

      {/* Aqui podem ser adicionados mais detalhes ou botões de ação (ex: Inscrever-se) */}

    </ScrollView>
  );
}

// 6. Definição dos Estilos
// Esta seção define todos os estilos visuais utilizados no componente
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
    padding: 20, // Espaçamento interno
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff', // Fundo branco para o conteúdo
  },
  contentContainer: {
    padding: 20, // Espaçamento interno do ScrollView
  },
  title: {
    fontSize: 26, // Tamanho maior para o título
    fontWeight: 'bold', // Texto em negrito
    marginBottom: 15, // Espaçamento inferior
    color: '#333', // Cor do texto
  },
  description: {
    fontSize: 16, // Tamanho da fonte
    lineHeight: 24, // Altura da linha para melhorar legibilidade
    color: '#555', // Cor do texto
    marginBottom: 25, // Espaçamento inferior
  },
  detailRow: {
    flexDirection: 'row', // Organiza os elementos em linha
    marginBottom: 12, // Espaçamento entre linhas
    alignItems: 'flex-start', // Alinha no topo quando o texto quebra linha
  },
  detailLabel: {
    fontSize: 16, // Tamanho da fonte
    fontWeight: 'bold', // Texto em negrito
    color: '#444', // Cor do texto
    marginRight: 8, // Espaçamento entre o rótulo e o valor
    width: 90, // Largura fixa para alinhar todos os valores
  },
  detailValue: {
    fontSize: 16, // Tamanho da fonte
    color: '#555', // Cor do texto
    flex: 1, // Permite que o valor ocupe o resto do espaço disponível
  },
  errorText: {
    color: 'red', // Cor vermelha para mensagens de erro
    fontSize: 16, // Tamanho da fonte
    textAlign: 'center', // Centraliza o texto
  },
});
