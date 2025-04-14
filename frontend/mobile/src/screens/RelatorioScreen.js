import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';

/**
 * RelatorioScreen – Tela de Relatórios e Indicadores (Mobile)
 * 
 * Esta tela busca do backend os indicadores agregados e os exibe para o usuário.
 * São apresentados:
 *  - Usuários por tipo
 *  - Contratações por status
 *  - Média de avaliações
 *  - Total de publicações aprovadas
 * 
 * O token JWT é passado via route.params para autenticar a requisição.
 */
export default function RelatorioScreen({ route }) {
  const { token } = route.params;
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar o relatório do backend
  const fetchRelatorio = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/relatorio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setRelatorio(data.relatorio);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorio();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Relatório de Indicadores</Text>
      
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Usuários por Tipo:</Text>
      {relatorio.usuariosPorTipo.map((item) => (
        <Text key={item._id}>{item._id}: {item.count}</Text>
      ))}

      <Text style={{ fontSize: 18, marginVertical: 10 }}>Contratações por Status:</Text>
      {relatorio.contratacoesPorStatus.map((item) => (
        <Text key={item._id}>{item._id}: {item.count}</Text>
      ))}

      <Text style={{ fontSize: 18, marginVertical: 10 }}>Média de Avaliações: {relatorio.avgRating.toFixed(2)}</Text>
      
      <Text style={{ fontSize: 18, marginVertical: 10 }}>Total de Publicações Aprovadas: {relatorio.totalPublicacoes}</Text>
      
      <Text style={{ fontSize: 14, color: '#666', marginTop: 20 }}>
        Relatório gerado em: {new Date(relatorio.timestamp).toLocaleString()}
      </Text>
    </ScrollView>
  );
}
