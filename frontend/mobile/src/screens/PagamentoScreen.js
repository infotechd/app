import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

/**
 * PagamentoScreen – Tela para Processamento de Pagamento (Mobile)
 * Permite que o usuário efetue o pagamento de um serviço.
 * O token JWT e o contratacaoId são passados via route.params para autenticação e referência da contratação.
 */
export default function PagamentoScreen({ route, navigation }) {
  const { token, contratacaoId } = route.params;
  const [valor, setValor] = useState('');
  const [metodo, setMetodo] = useState('cartao'); // Valor padrão: 'cartao'

  /**
   * handleProcessarPagamento: Envia os dados do pagamento para o backend.
   * Caso o pagamento seja processado com sucesso, o usuário é informado.
   */
  const handleProcessarPagamento = async () => {
    if (!valor || !metodo) {
      Alert.alert('Erro', 'Preencha os dados do pagamento.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/pagamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contratacaoId,
          valor: Number(valor),
          metodo
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        // Redireciona ou atualiza o fluxo conforme a lógica do app
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Processar Pagamento</Text>
      <TextInput
        placeholder="Valor"
        value={valor}
        onChangeText={setValor}
        keyboardType="numeric"
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Método (cartao, boleto, pix)"
        value={metodo}
        onChangeText={setMetodo}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Efetuar Pagamento" onPress={handleProcessarPagamento} />
    </View>
  );
}
