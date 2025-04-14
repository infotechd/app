import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * Tela para cadastrar ou editar o currículo do prestador
 * Exige que o usuário tenha tipoUsuario="prestador" e possua um token JWT
 */
export default function CurriculoFormScreen({ route, navigation }) {
  const { token } = route.params; // Token obtido no login
  const [experiencia, setExperiencia] = useState('');
  const [habilidades, setHabilidades] = useState('');
  const [projetos, setProjetos] = useState('');

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/curriculo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ experiencia, habilidades, projetos })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        navigation.goBack();
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Cadastrar Currículo</Text>
      <TextInput
        placeholder="Experiência"
        value={experiencia}
        onChangeText={setExperiencia}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Habilidades"
        value={habilidades}
        onChangeText={setHabilidades}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Projetos"
        value={projetos}
        onChangeText={setProjetos}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Salvar" onPress={handleSave} />
    </View>
  );
}
