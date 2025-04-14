import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';

/**
 * TreinamentoDetailScreen – Exibe os detalhes completos de um treinamento.
 * Permite que o usuário visualize informações detalhadas, como título, descrição,
 * formato, data/hora (quando aplicável), preço e status.
 */
export default function TreinamentoDetailScreen({ route }) {
  const { treinamentoId } = route.params;
  const [treinamento, setTreinamento] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTreinamento = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/treinamento/${treinamentoId}`);
      const data = await response.json();
      if (response.ok) {
        setTreinamento(data.treinamento);
      }
    } catch (error) {
      console.error('Erro ao buscar treinamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreinamento();
  }, [treinamentoId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!treinamento) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Treinamento não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{treinamento.titulo}</Text>
      <Text style={{ marginVertical: 10 }}>{treinamento.descricao}</Text>
      <Text style={{ fontWeight: 'bold' }}>Formato: {treinamento.formato}</Text>
      {treinamento.dataHora && (
        <Text style={{ fontWeight: 'bold' }}>
          Data/Hora: {new Date(treinamento.dataHora).toLocaleString()}
        </Text>
      )}
      <Text style={{ fontWeight: 'bold' }}>Preço: R$ {treinamento.preco}</Text>
      <Text style={{ fontWeight: 'bold', marginVertical: 10 }}>Status: {treinamento.status}</Text>
    </ScrollView>
  );
}
