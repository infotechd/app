import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Button // Para botão de tentar novamente
} from 'react-native';

// 1. Importações
// Importa os hooks do React e componentes necessários para a interface
import { useAuth } from "@/context/AuthContext"; // Contexto de autenticação para obter o token do usuário
import { fetchRelatorio as apiFetchRelatorio } from '../services/api'; // Função para buscar dados do relatório da API
import { Relatorio, UsuariosPorTipoItem, ContratacoesPorStatusItem } from "@/types/relatorio"; // Importa tipos para tipagem forte
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipo para props de navegação
import { RootStackParamList } from "@/navigation/types"; // Tipos de parâmetros para navegação

// 2. Tipo das Props
type RelatorioScreenProps = NativeStackScreenProps<RootStackParamList, 'Relatorio'>;

/**
 * RelatorioScreen – Tela de Relatórios e Indicadores (Mobile)
 * Busca e exibe indicadores agregados da plataforma.
 * Este componente é responsável por mostrar estatísticas e métricas importantes
 * sobre usuários, contratações e avaliações do sistema.
 */
export default function RelatorioScreen({ }: RelatorioScreenProps) {
  // 3. Obter usuário/token
  // Acessa o contexto de autenticação para obter o usuário logado e seu token
  const { user } = useAuth();

  // 4. Estados do componente
  // Armazena os dados do relatório após serem carregados da API
  const [report, setReport] = useState<Relatorio | null>(null); // Estado para armazenar os dados do relatório
  // Controla o estado de carregamento para exibir indicadores visuais
  const [loading, setLoading] = useState<boolean>(true);
  // Armazena mensagens de erro caso ocorram problemas ao carregar os dados
  const [error, setError] = useState<string | null>(null);

  // 5. Função para carregar dados do relatório
  // Esta função é responsável por buscar os dados do relatório da API
  // O parâmetro isRefreshing indica se é uma atualização manual (pull-to-refresh)
  const loadReport = useCallback(async (isRefreshing = false) => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      setError("Autenticação necessária para visualizar relatórios.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    // Ativa o indicador de carregamento apenas se não for refresh
    if (!isRefreshing) setLoading(true);
    // Limpa erros anteriores
    setError(null);
    try {
      // Faz a requisição à API usando o token do usuário
      const response = await apiFetchRelatorio(user.token);
      // Atualiza o estado com os dados recebidos
      setReport(response.relatorio); // API retorna { relatorio: Relatorio }
    } catch (err) {
      // Trata erros de forma adequada
      const msg = err instanceof Error ? err.message : 'Erro ao carregar relatório';
      setError(msg);
      // Alert.alert('Erro', msg); // Alert pode ser irritante no refresh
    } finally {
      // Desativa o indicador de carregamento
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  // Efeito que carrega o relatório quando o componente é montado
  useEffect(() => {
    (async () => {
      try {
        await loadReport();
      } catch (error) {
        console.error("Erro ao carregar relatório:", error);
      }
    })();
  }, [loadReport]);

  // --- Funções Auxiliares de Renderização ---
  // Esta seção contém funções que ajudam a renderizar partes específicas da interface

  // Renderiza um item da lista de usuários por tipo
  // Recebe um objeto com _id (tipo de usuário) e count (quantidade) e retorna um elemento React
  const renderUsuarioItem = (item: UsuariosPorTipoItem): React.ReactElement => (
    <View key={String(item._id)} style={styles.listItem}>
      <Text style={styles.listItemLabel}>{item._id}:</Text>
      <Text style={styles.listItemValue}>{item.count}</Text>
    </View>
  );

  // Renderiza um item da lista de contratações por status
  // Recebe um objeto com _id (status da contratação) e count (quantidade) e retorna um elemento React
  const renderContratacaoItem = (item: ContratacoesPorStatusItem): React.ReactElement => (
    <View key={String(item._id)} style={styles.listItem}>
      <Text style={styles.listItemLabel}>{item._id}:</Text>
      <Text style={styles.listItemValue}>{item.count}</Text>
    </View>
  );

  // Formatação segura da data/hora
  // Converte uma string ISO para formato de data localizado em português do Brasil
  // Inclui tratamento de erro para evitar quebras caso a data seja inválida
  const formatTimestamp = (isoString: string): string => {
    try { return new Date(isoString).toLocaleString('pt-BR'); }
    catch (e) { return "Data inválida"; }
  };


  // --- Renderização Principal ---
  // Esta seção contém a lógica de renderização condicional baseada no estado da aplicação

  if (loading && !report) { // Loading inicial - exibido durante o primeiro carregamento
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando relatório...</Text>
      </View>
    );
  }

  if (error && !report) { // Erro sem dados para mostrar - exibido quando ocorre erro e não há dados anteriores
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
        <Button title="Tentar Novamente" onPress={() => loadReport()} />
      </View>
    );
  }

  if (!report) { // Caso não esteja carregando, sem erro, mas sem relatório - situação rara mas possível
    return (
      <View style={styles.centerContainer}>
        <Text>Nenhum dado de relatório disponível.</Text>
      </View>
    );
  }

  // Exibe o relatório se carregado - interface principal com os dados do relatório
  return (
    <ScrollView
      style={styles.container}
      refreshControl={ // Componente para permitir atualização manual puxando para baixo
        <RefreshControl refreshing={loading} onRefresh={()=>loadReport(true)} />
      }
    >
      <Text style={styles.title}>Relatório de Indicadores</Text>
      {/* Mostra erro discreto se ocorreu durante atualização manual */}
      {error && <Text style={styles.errorTextSmall}>{error}</Text>}

      {/* Seção de usuários por tipo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usuários por Tipo:</Text>
        {/* Renderiza a lista de usuários por tipo ou mensagem de ausência de dados */}
        {report.usuariosPorTipo.length > 0
          ? report.usuariosPorTipo.map(renderUsuarioItem)
          : <Text style={styles.noDataText}>Nenhum dado.</Text>
        }
      </View>

      {/* Seção de contratações por status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contratações por Status:</Text>
        {report.contratacoesPorStatus.length > 0
          ? report.contratacoesPorStatus.map(renderContratacaoItem)
          : <Text style={styles.noDataText}>Nenhum dado.</Text>
        }
      </View>

      {/* Seção de outros indicadores importantes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outros Indicadores:</Text>
        <View style={styles.listItem}>
          <Text style={styles.listItemLabel}>Média de Avaliações:</Text>
          <Text style={styles.listItemValue}>{report.avgRating.toFixed(2)} ★</Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.listItemLabel}>Publicações Aprovadas:</Text>
          <Text style={styles.listItemValue}>{report.totalPublicacoes}</Text>
        </View>
      </View>

      {/* Rodapé com timestamp de geração do relatório */}
      <Text style={styles.timestamp}>
        Relatório gerado em: {formatTimestamp(report.timestamp)}
      </Text>
    </ScrollView>
  );
}

// 7. Estilos
// Definição dos estilos utilizados no componente
const styles = StyleSheet.create({
  // Estilo do container principal com scroll
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f9f9f9', // Fundo cinza claro para melhor contraste
  },
  // Container centralizado usado para telas de carregamento e erro
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Estilo do título principal do relatório
  title: {
    fontSize: 22, // Tamanho ajustado para melhor legibilidade
    fontWeight: 'bold',
    marginBottom: 20, // Espaçamento inferior aumentado
    textAlign: 'center',
    color: '#333',
  },
  // Estilo das seções do relatório (cards)
  section: {
    marginBottom: 25, // Espaçamento entre seções
    backgroundColor: '#fff', // Fundo branco para as seções
    padding: 15,
    borderRadius: 8, // Bordas arredondadas
    elevation: 1, // Sombra leve para efeito de elevação
  },
  // Estilo dos títulos de cada seção
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-negrito
    marginBottom: 15,
    color: '#0056b3', // Cor azul para destaque
    borderBottomWidth: 1, // Linha separadora abaixo do título
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  // Estilo dos itens de lista (linha com label e valor)
  listItem: {
    flexDirection: 'row', // Layout horizontal
    justifyContent: 'space-between', // Espaço entre label e valor
    paddingVertical: 5,
    borderBottomWidth: 1, // Linha separadora entre itens
    borderBottomColor: '#f0f0f0',
  },
  // Estilo das labels dos itens (lado esquerdo)
  listItemLabel: {
    fontSize: 15,
    color: '#555', // Cinza para menor destaque que o valor
  },
  // Estilo dos valores dos itens (lado direito)
  listItemValue: {
    fontSize: 15,
    fontWeight: 'bold', // Negrito para destacar o valor
    color: '#333',
  },
  // Estilo do texto exibido quando não há dados
  noDataText: {
    fontStyle: 'italic',
    color: '#777', // Cinza médio
    textAlign: 'center',
    marginTop: 10,
  },
  // Estilo do timestamp no rodapé
  timestamp: {
    fontSize: 12, // Tamanho pequeno
    color: '#666', // Cinza para menor destaque
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Estilo do texto de erro principal
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  // Estilo do texto de erro discreto (usado durante atualização)
  errorTextSmall: { 
    color: 'red',
    fontSize: 14, // Tamanho menor que o erro principal
    textAlign: 'center',
    marginBottom: 10,
  },
});
