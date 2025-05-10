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

// 1. Imports de tipos e API
import { Training } from "@/types/training"; // Importa a interface do Treinamento
import { fetchTrainingDetail as apiFetchTrainingDetail } from '../services/api'; // Importa a função da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types"; // Importa a lista de parâmetros

// 2. Tipo das Props da Tela (espera 'treinamentoId' nos params)
type TreinamentoDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TreinamentoDetail'>;

/**
 * TreinamentoDetailScreen – Exibe os detalhes completos de um treinamento.
 * Busca os dados da API com base no ID recebido via navegação.
 */
export default function TreinamentoDetailScreen({ route }: TreinamentoDetailScreenProps) {
  // Extrai o ID dos parâmetros da rota
  const { treinamentoId } = route.params;

  // 3. Tipar Estados
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Refatorar fetchTreinamento
  const loadTrainingDetail = useCallback(async () => {
    if (!treinamentoId) {
      setError("ID do treinamento não fornecido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiFetchTrainingDetail(treinamentoId);
      setTraining(response.treinamento); // A API retorna { treinamento: Training }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      Alert.alert('Erro ao Buscar Detalhes', errorMessage);
      setTraining(null); // Limpa dados anteriores em caso de erro
    } finally {
      setLoading(false);
    }
  }, [treinamentoId]); // Depende do ID

  // Busca inicial ao montar ou quando o ID mudar
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
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando detalhes...</Text>
      </View>
    );
  }

  // Renderização da mensagem de erro
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro: {error}</Text>
        {/* <Button title="Tentar Novamente" onPress={loadTrainingDetail} /> */}
      </View>
    );
  }

  // Renderização caso o treinamento não seja encontrado (após loading e sem erro)
  if (!training) {
    return (
      <View style={styles.centerContainer}>
        <Text>Treinamento não encontrado.</Text>
      </View>
    );
  }

  // Formatação segura da data/hora
  const formatDateTime = (isoString: string | null): string | null => {
    if (!isoString) return null;
    try {
      return new Date(isoString).toLocaleString('pt-BR'); // Ajuste locale se necessário
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return "Data inválida";
    }
  };

  const formattedDate = formatDateTime(training.dataHora);

  // Renderização dos detalhes do treinamento
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

      {/* Adicionar mais detalhes ou botões de ação aqui (ex: Inscrever-se) */}

    </ScrollView>
  );
}

// 6. Estilos
const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff', // Fundo branco para o conteúdo
  },
  contentContainer: {
    padding: 20, // Padding interno do ScrollView
  },
  title: {
    fontSize: 26, // Maior
    fontWeight: 'bold',
    marginBottom: 15, // Mais espaço
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24, // Melhorar legibilidade
    color: '#555',
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row', // Label e valor na mesma linha
    marginBottom: 12,
    alignItems: 'flex-start', // Alinhar no topo se texto quebrar linha
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginRight: 8, // Espaço entre label e valor
    width: 90, // Largura fixa para alinhar valores (ajuste conforme necessário)
  },
  detailValue: {
    fontSize: 16,
    color: '#555',
    flex: 1, // Permite que o valor ocupe o resto do espaço
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
