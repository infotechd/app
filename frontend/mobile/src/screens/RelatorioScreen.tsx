import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Button // Para botão de tentar novamente
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import { fetchRelatorio as apiFetchRelatorio } from '../services/api';
import { Relatorio, UsuariosPorTipoItem, ContratacoesPorStatusItem } from '../types/relatorio'; // Importa tipos
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props
type RelatorioScreenProps = NativeStackScreenProps<RootStackParamList, 'Relatorio'>;

/**
 * RelatorioScreen – Tela de Relatórios e Indicadores (Mobile)
 * Busca e exibe indicadores agregados da plataforma.
 */
export default function RelatorioScreen({ navigation }: RelatorioScreenProps) {
  // 3. Obter usuário/token
  const { user } = useAuth();

  // 4. Tipar Estados
  const [report, setReport] = useState<Relatorio | null>(null); // Renomeado para clareza
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 5. Refatorar fetchRelatorio
  const loadReport = useCallback(async (isRefreshing = false) => {
    if (!user?.token) {
      setError("Autenticação necessária para visualizar relatórios.");
      if (!isRefreshing) setLoading(false);
      return;
    }
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const response = await apiFetchRelatorio(user.token);
      setReport(response.relatorio); // API retorna { relatorio: Relatorio }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar relatório';
      setError(msg);
      // Alert.alert('Erro', msg); // Alert pode ser irritante no refresh
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // --- Funções Auxiliares de Renderização ---

  // Renderiza um item da lista de usuários por tipo
  const renderUsuarioItem = (item: UsuariosPorTipoItem): JSX.Element => (
    <View key={String(item._id)} style={styles.listItem}>
      <Text style={styles.listItemLabel}>{item._id}:</Text>
      <Text style={styles.listItemValue}>{item.count}</Text>
    </View>
  );

  // Renderiza um item da lista de contratações por status
  const renderContratacaoItem = (item: ContratacoesPorStatusItem): JSX.Element => (
    <View key={String(item._id)} style={styles.listItem}>
      <Text style={styles.listItemLabel}>{item._id}:</Text>
      <Text style={styles.listItemValue}>{item.count}</Text>
    </View>
  );

  // Formatação segura da data/hora
  const formatTimestamp = (isoString: string): string => {
    try { return new Date(isoString).toLocaleString('pt-BR'); }
    catch (e) { return "Data inválida"; }
  };


  // --- Renderização Principal ---

  if (loading && !report) { // Loading inicial
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando relatório...</Text>
      </View>
    );
  }

  if (error && !report) { // Erro sem dados para mostrar
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
        <Button title="Tentar Novamente" onPress={() => loadReport()} />
      </View>
    );
  }

  if (!report) { // Caso não esteja carregando, sem erro, mas sem relatório
    return (
      <View style={styles.centerContainer}>
        <Text>Nenhum dado de relatório disponível.</Text>
      </View>
    );
  }

  // Exibe o relatório se carregado
  return (
    <ScrollView
      style={styles.container}
      refreshControl={ // Pull-to-refresh
        <RefreshControl refreshing={loading} onRefresh={()=>loadReport(true)} />
      }
    >
      <Text style={styles.title}>Relatório de Indicadores</Text>
      {/* Mostra erro discreto se ocorreu durante refresh */}
      {error && <Text style={styles.errorTextSmall}>{error}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usuários por Tipo:</Text>
        {/* 6. Usar tipo no map */}
        {report.usuariosPorTipo.length > 0
          ? report.usuariosPorTipo.map(renderUsuarioItem)
          : <Text style={styles.noDataText}>Nenhum dado.</Text>
        }
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contratações por Status:</Text>
        {report.contratacoesPorStatus.length > 0
          ? report.contratacoesPorStatus.map(renderContratacaoItem)
          : <Text style={styles.noDataText}>Nenhum dado.</Text>
        }
      </View>

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

      <Text style={styles.timestamp}>
        Relatório gerado em: {formatTimestamp(report.timestamp)}
      </Text>
    </ScrollView>
  );
}

// 7. Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22, // Ajustado
    fontWeight: 'bold',
    marginBottom: 20, // Mais espaço
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    elevation: 1, // Sombra leve
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold
    marginBottom: 15,
    color: '#0056b3', // Azul
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLabel: {
    fontSize: 15,
    color: '#555',
  },
  listItemValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  noDataText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTextSmall: { // Erro discreto para refresh
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
});