import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

/**
 * Tela simplificada para contratar uma oferta
 * O buyer informa o ID da oferta ou escolhe a oferta de uma lista e confirma.
 */
export default function ContratacaoScreen({ route, navigation }) {
  const { token } = route.params;
  const [ofertaId, setOfertaId] = useState('');

  const handleContratar = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/contratacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ofertaId })
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
      <TextInput
        placeholder="ID da Oferta"
        value={ofertaId}
        onChangeText={setOfertaId}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Contratar Oferta" onPress={handleContratar} />
    </View>
  );
}
