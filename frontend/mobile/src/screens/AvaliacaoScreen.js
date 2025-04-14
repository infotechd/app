import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * AvaliacaoScreen – Tela de Avaliação
 * Permite que o usuário (buyer ou provider) registre uma avaliação para outro usuário.
 * O token JWT e os dados de navegação são passados via route.params.
 */
export default function AvaliacaoScreen({ route, navigation }) {
  // O token é necessário para autenticação na API
  const { token } = route.params;
  // Estados para armazenar os dados do formulário
  const [receptorId, setReceptorId] = useState('');
  const [nota, setNota] = useState('');
  const [comentario, setComentario] = useState('');

  /**
   * Função para enviar a avaliação para o backend.
   * Valida os campos obrigatórios e envia os dados via POST para o endpoint de avaliação.
   */
  const handleSubmit = async () => {
    if (!receptorId || !nota) {
      Alert.alert('Erro', 'Receptor e nota são obrigatórios.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/avaliacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receptorId,
          nota: Number(nota),
          comentario
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        navigation.goBack();
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Avaliar Usuário</Text>
      <TextInput
        placeholder="ID do Receptor"
        value={receptorId}
        onChangeText={setReceptorId}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Nota (1 a 5)"
        value={nota}
        onChangeText={setNota}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Comentário (opcional)"
        value={comentario}
        onChangeText={setComentario}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Enviar Avaliação" onPress={handleSubmit} />
    </View>
  );
}
