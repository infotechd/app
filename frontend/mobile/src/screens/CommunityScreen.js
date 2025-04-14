import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList } from 'react-native';

/**
 * CommunityScreen – Tela de Comunidade
 * Permite que usuários autenticados criem publicações (posts ou eventos)
 * e visualizem as publicações aprovadas.
 */
export default function CommunityScreen({ route, navigation }) {
  const { token } = route.params; // Token JWT passado via navegação
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState('post'); // 'post' ou 'evento'
  const [publicacoes, setPublicacoes] = useState([]);

  // Função para buscar publicações aprovadas
  const fetchPublicacoes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/publicacao');
      const data = await response.json();
      if (response.ok) {
        setPublicacoes(data.publicacoes);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Chama a função de busca ao montar a tela
  useEffect(() => {
    fetchPublicacoes();
  }, []);

  // Função para criar nova publicação
  const handleCreatePublicacao = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/publicacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo, tipo })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setConteudo('');
        fetchPublicacoes(); // Atualiza a lista
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Renderiza cada publicação na lista
  const renderItem = ({ item }) => (
    <View style={{ marginVertical: 10, padding: 10, borderWidth: 1, borderColor: '#ccc' }}>
      <Text style={{ fontWeight: 'bold' }}>Autor: {item.autor?.nome || 'Desconhecido'}</Text>
      <Text>{item.conteudo}</Text>
      <Text>Tipo: {item.tipo}</Text>
      <Text>Data: {new Date(item.dataPostagem).toLocaleString()}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Comunidade</Text>
      <TextInput
        placeholder="Digite sua publicação..."
        value={conteudo}
        onChangeText={setConteudo}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      {/* Botões para definir o tipo de publicação */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
        <Button title="Post" onPress={() => setTipo('post')} />
        <Button title="Evento" onPress={() => setTipo('evento')} />
      </View>
      <Button title="Publicar" onPress={handleCreatePublicacao} />
      <Text style={{ fontSize: 18, marginVertical: 20 }}>Publicações Aprovadas</Text>
      <FlatList
        data={publicacoes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
}
