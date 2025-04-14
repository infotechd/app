import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * Tela de edição de perfil.
 * Permite atualizar dados do usuário e envia os dados para o endpoint PUT /api/auth/profile.
 * Essa tela requer um token JWT, normalmente passado via route.params.
 */
export default function EditProfileScreen({ navigation, route }) {
  const { user, token } = route.params;
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [telefone, setTelefone] = useState(user.telefone);
  const [endereco, setEndereco] = useState(user.endereco);

  const handleUpdate = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email, telefone, endereco })
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
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Editar Perfil</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <Button title="Atualizar" onPress={handleUpdate} />
    </View>
  );
}
