import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * Tela de cadastro de usuário.
 * Coleta informações necessárias e envia para o endpoint /api/auth/register.
 */
export default function RegistrationScreen({ navigation }) {
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('comprador'); // valor padrão em minúsculo conforme modelo
  const [endereco, setEndereco] = useState('');
  const [foto, setFoto] = useState('');

  // Função para enviar os dados para o backend
  const handleRegister = async () => {
    // Validação simples dos campos obrigatórios
    if (!nome || !email || !senha || !cpfCnpj) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, telefone, cpfCnpj, tipoUsuario, endereco, foto })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        navigation.navigate('Login'); // Redireciona para a tela de login
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Cadastro</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="CPF/CNPJ" value={cpfCnpj} onChangeText={setCpfCnpj} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      <TextInput placeholder="URL da Foto" value={foto} onChangeText={setFoto} style={{ borderBottomWidth: 1, marginBottom: 10 }} />
      {/* Botões para selecionar o tipo de usuário */}
      <View style={{ flexDirection: 'row', marginVertical: 10, justifyContent: 'space-around' }}>
        <Button title="Comprador" onPress={() => setTipoUsuario('comprador')} />
        <Button title="Prestador" onPress={() => setTipoUsuario('prestador')} />
        <Button title="Anunciante" onPress={() => setTipoUsuario('anunciante')} />
      </View>
      <Button title="Cadastrar" onPress={handleRegister} />
    </View>
  );
}
