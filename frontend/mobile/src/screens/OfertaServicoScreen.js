import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList } from 'react-native';

/**
 * Tela que permite ao prestador criar e gerenciar suas ofertas de serviço.
 * Usa as rotas do backend: /api/oferta (POST, GET, PUT, DELETE)
 */
export default function OfertaServicoScreen({ route, navigation }) {
  const { token } = route.params;
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [status, setStatus] = useState('draft');
  const [disponibilidade, setDisponibilidade] = useState('');
  const [ofertas, setOfertas] = useState([]);

  // Carrega as ofertas ao montar o componente
  useEffect(() => {
    fetchOfertas();
  }, []);

  const fetchOfertas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/oferta', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setOfertas(data.ofertas);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const handleCreateOffer = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/oferta', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ descricao, preco: Number(preco), status, disponibilidade })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setDescricao('');
        setPreco('');
        setDisponibilidade('');
        setStatus('draft');
        fetchOfertas(); // Atualiza a lista de ofertas
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Criar/Editar Ofertas</Text>
      <TextInput
        placeholder="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Preço"
        value={preco}
        onChangeText={setPreco}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Disponibilidade"
        value={disponibilidade}
        onChangeText={setDisponibilidade}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
        <Button title="Draft" onPress={() => setStatus('draft')} />
        <Button title="Ready" onPress={() => setStatus('ready')} />
      </View>
      <Button title="Criar Oferta" onPress={handleCreateOffer} />

      <Text style={{ marginVertical: 20, fontSize: 16 }}>Minhas Ofertas</Text>
      <FlatList
        data={ofertas}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text>Descrição: {item.descricao}</Text>
            <Text>Preço: R$ {item.preco}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Disponibilidade: {item.disponibilidade}</Text>
          </View>
        )}
      />
    </View>
  );
}
