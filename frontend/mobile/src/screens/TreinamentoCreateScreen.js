import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * TreinamentoCreateScreen – Tela para criação de treinamentos.
 * Exclusiva para anunciantes, permite criar novos treinamentos com informações
 * como título, descrição, formato, data/hora (opcional) e preço.
 * O token JWT é passado via route.params para autenticação.
 */
export default function TreinamentoCreateScreen({ route, navigation }) {
  const { token } = route.params;
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formato, setFormato] = useState('video'); // Valores: video, pdf, webinar
  const [dataHora, setDataHora] = useState('');
  const [preco, setPreco] = useState('');

  const handleCreateTreinamento = async () => {
    if (!titulo || !descricao || !formato) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/treinamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo,
          descricao,
          formato,
          dataHora: dataHora || null,
          preco: Number(preco) || 0,
          status: 'draft'
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
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Criar Treinamento</Text>
      <TextInput
        placeholder="Título"
        value={titulo}
        onChangeText={setTitulo}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Formato (video, pdf, webinar)"
        value={formato}
        onChangeText={setFormato}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Data/Hora (opcional, ISO format)"
        value={dataHora}
        onChangeText={setDataHora}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Preço (0 para gratuito)"
        value={preco}
        onChangeText={setPreco}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Criar Treinamento" onPress={handleCreateTreinamento} />
    </View>
  );
}
