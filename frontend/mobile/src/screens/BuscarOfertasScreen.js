import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';

/**
 * Tela para filtrar e pesquisar ofertas (status "ready").
 * Buyer pode buscar por texto ou filtrar por preço máximo, etc.
 * Caso de Uso 4.
 */
export default function BuscarOfertasScreen() {
  const [textoPesquisa, setTextoPesquisa] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [ofertas, setOfertas] = useState([]);

  const handleSearch = async () => {
    try {
      let url = 'http://localhost:5000/api/public/ofertas?';
      if (textoPesquisa) url += `textoPesquisa=${encodeURIComponent(textoPesquisa)}&`;
      if (precoMax) url += `precoMax=${encodeURIComponent(precoMax)}&`;
      const response = await fetch(url);
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

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Buscar Ofertas</Text>
      <TextInput
        placeholder="Digite um texto de pesquisa"
        value={textoPesquisa}
        onChangeText={setTextoPesquisa}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Preço Máximo"
        value={precoMax}
        onChangeText={setPrecoMax}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Buscar" onPress={handleSearch} />

      <FlatList
        data={ofertas}
        keyExtractor={(item) => item._id}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text>Descrição: {item.descricao}</Text>
            <Text>Preço: R$ {item.preco}</Text>
            <Text>Disponibilidade: {item.disponibilidade}</Text>
          </View>
        )}
      />
    </View>
  );
}
