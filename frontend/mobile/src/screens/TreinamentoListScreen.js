import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';

/**
 * TreinamentoListScreen – Exibe uma lista de treinamentos publicados.
 * Essa tela é acessível a todos os usuários e permite navegar para os detalhes de um treinamento.
 */
export default function TreinamentoListScreen({ navigation }) {
  const [treinamentos, setTreinamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os treinamentos do backend
  const fetchTreinamentos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/treinamento');
      const data = await response.json();
      if (response.ok) {
        setTreinamentos(data.treinamentos);
      }
    } catch (error) {
      console.error('Erro ao buscar treinamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreinamentos();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Renderiza cada item da lista
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TreinamentoDetail', { treinamentoId: item._id })}>
      <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#ccc' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.titulo}</Text>
        <Text numberOfLines={2}>{item.descricao}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={treinamentos}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
}
