import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * Tela de login.
 * Coleta email e senha, e chama o endpoint /api/auth/login para autenticar.
 */
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', 'Login realizado.');
        // Armazene o token e dados do usuário conforme estratégia (ex: AsyncStorage ou Context)
        navigation.navigate('Home', { token: data.token, user: data.user });
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Login</Text>
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        style={{ borderBottomWidth: 1, marginBottom: 10 }} 
      />
      <TextInput 
        placeholder="Senha" 
        value={senha} 
        onChangeText={setSenha} 
        secureTextEntry 
        style={{ borderBottomWidth: 1, marginBottom: 10 }} 
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}
