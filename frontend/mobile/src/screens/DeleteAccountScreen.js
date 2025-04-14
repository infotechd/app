import React from 'react';
import { View, Text, Button, Alert } from 'react-native';

/**
 * Tela para exclusão de conta.
 * Solicita confirmação do usuário e, se confirmado, chama o endpoint DELETE /api/auth/profile.
 */
export default function DeleteAccountScreen({ navigation, route }) {
  const { token } = route.params;

  const handleDelete = async () => {
    Alert.alert('Confirmação', 'Você realmente deseja excluir sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const response = await fetch('http://localhost:5000/api/auth/profile', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            if (response.ok) {
              Alert.alert('Sucesso', data.message);
              navigation.navigate('Login');
            } else {
              Alert.alert('Erro', data.message);
            }
          } catch (error) {
            Alert.alert('Erro', 'Falha na conexão.');
          }
        }
      }
    ]);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Excluir Conta</Text>
      <Button title="Excluir Conta" onPress={handleDelete} color="red" />
    </View>
  );
}
