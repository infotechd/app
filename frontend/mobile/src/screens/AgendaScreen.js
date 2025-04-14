import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, FlatList } from 'react-native';

/**
 * Tela que exibe a agenda do prestador e permite atualizar o status dos compromissos.
 * Caso de Uso 6: Gerenciar Agenda do Service Provider
 */
export default function AgendaScreen({ route }) {
  const { token } = route.params;
  const [agenda, setAgenda] = useState(null);

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/agenda', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAgenda(data.agenda);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const updateStatus = async (compromissoId, status) => {
    try {
      if (!agenda) return;
      const response = await fetch(`http://localhost:5000/api/agenda/${agenda._id}/compromisso/${compromissoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setAgenda(data.agenda);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  if (!agenda) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Carregando agenda...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Minha Agenda</Text>
      <FlatList
        data={agenda.compromissos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <Text>Data: {new Date(item.data).toLocaleString()}</Text>
            <Text>Status: {item.status}</Text>
            <Button
              title="Marcar Concluído"
              onPress={() => updateStatus(item._id, 'Concluído')}
            />
          </View>
        )}
      />
    </View>
  );
}
