import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

/**
 * NotificacaoScreen – Tela para exibir e gerenciar notificações (Mobile)
 * Permite que o usuário visualize suas notificações, marque-as como lidas e as exclua.
 * O token JWT é passado via route.params para autenticar as requisições.
 */
export default function NotificacaoScreen({ route }) {
  const { token } = route.params;
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca notificações do backend
  const fetchNotificacoes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notificacao', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setNotificacoes(data.notificacoes);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  // Função para marcar notificação como lida
  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notificacao/${id}/lida`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Atualiza a lista de notificações
        fetchNotificacoes();
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Função para excluir notificação
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notificacao/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        fetchNotificacoes();
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text style={{ fontWeight: 'bold' }}>{item.titulo}</Text>
      <Text>{item.mensagem}</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>{new Date(item.dataNotificacao).toLocaleString()}</Text>
      <Text style={{ color: item.lida ? 'green' : 'red' }}>
        {item.lida ? 'Lida' : 'Não lida'}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 5 }}>
        <TouchableOpacity onPress={() => handleMarkAsRead(item._id)} style={{ marginRight: 15 }}>
          <Text style={{ color: 'blue' }}>Marcar como lida</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Text style={{ color: 'red' }}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
}
