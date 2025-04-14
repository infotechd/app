import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';

/**
 * NegociacaoScreen – Tela para Gerenciar a Negociação de Ajustes (Mobile)
 * Permite que o Buyer inicie uma negociação e que o Provider responda com uma contra-proposta,
 * além do Buyer poder confirmar a negociação.
 *
 * Requisitos:
 * - O token JWT é passado via route.params para autenticação.
 * - contratacaoId e providerId são fornecidos para vincular a negociação.
 */
export default function NegociacaoScreen({ route, navigation }) {
  const { token, contratacaoId, providerId } = route.params;
  const [propostaInicial, setPropostaInicial] = useState({ novoPreco: '', novoPrazo: '', observacoes: '' });
  const [respostaProvider, setRespostaProvider] = useState({ novoPreco: '', novoPrazo: '', observacoes: '' });
  const [status, setStatus] = useState('pendente');
  const [negociacao, setNegociacao] = useState(null);

  // Função para iniciar a negociação (Buyer)
  const iniciarNegociacao = async () => {
    if (!propostaInicial.novoPreco || !propostaInicial.novoPrazo) {
      Alert.alert('Erro', 'Informe os ajustes iniciais (preço e prazo).');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/negociacao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contratacaoId,
          providerId,
          propostaInicial: {
            novoPreco: Number(propostaInicial.novoPreco),
            novoPrazo: propostaInicial.novoPrazo,
            observacoes: propostaInicial.observacoes
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setNegociacao(data.negociacao);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Função para o Provider responder à negociação
  const responderNegociacao = async () => {
    if (!respostaProvider.novoPreco || !respostaProvider.novoPrazo) {
      Alert.alert('Erro', 'Informe os ajustes propostos.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/negociacao/${negociacao._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          respostaProvider: {
            novoPreco: Number(respostaProvider.novoPreco),
            novoPrazo: respostaProvider.novoPrazo,
            observacoes: respostaProvider.observacoes
          },
          status: 'counter-proposta'
        })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setNegociacao(data.negociacao);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Função para o Buyer confirmar a negociação (se o Provider aceitar)
  const confirmarNegociacao = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/negociacao/${negociacao._id}/confirmar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sucesso', data.message);
        setNegociacao(data.negociacao);
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Negociação de Ajustes</Text>

      {/* Se ainda não foi iniciada, permite que o Buyer inicie a negociação */}
      {!negociacao && (
        <View>
          <Text style={{ fontWeight: 'bold' }}>Proposta Inicial (Buyer):</Text>
          <TextInput
            placeholder="Novo Preço"
            value={propostaInicial.novoPreco}
            onChangeText={(value) => setPropostaInicial({ ...propostaInicial, novoPreco: value })}
            keyboardType="numeric"
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Novo Prazo"
            value={propostaInicial.novoPrazo}
            onChangeText={(value) => setPropostaInicial({ ...propostaInicial, novoPrazo: value })}
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Observações"
            value={propostaInicial.observacoes}
            onChangeText={(value) => setPropostaInicial({ ...propostaInicial, observacoes: value })}
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <Button title="Iniciar Negociação" onPress={iniciarNegociacao} />
        </View>
      )}

      {/* Se a negociação foi iniciada e o usuário é o Provider */}
      {negociacao && reqUserIsProvider() && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Responder à Negociação (Provider):</Text>
          <TextInput
            placeholder="Novo Preço"
            value={respostaProvider.novoPreco}
            onChangeText={(value) => setRespostaProvider({ ...respostaProvider, novoPreco: value })}
            keyboardType="numeric"
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Novo Prazo"
            value={respostaProvider.novoPrazo}
            onChangeText={(value) => setRespostaProvider({ ...respostaProvider, novoPrazo: value })}
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <TextInput
            placeholder="Observações"
            value={respostaProvider.observacoes}
            onChangeText={(value) => setRespostaProvider({ ...respostaProvider, observacoes: value })}
            style={{ borderBottomWidth: 1, marginBottom: 10 }}
          />
          <Button title="Enviar Resposta" onPress={responderNegociacao} />
        </View>
      )}

      {/* Se a negociação foi respondida e o usuário é o Buyer */}
      {negociacao && reqUserIsBuyer() && negociacao.status === 'counter-proposta' && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Confirmar Negociação (Buyer):</Text>
          <Button title="Confirmar Ajustes" onPress={confirmarNegociacao} />
        </View>
      )}

      {/* Exibe os detalhes da negociação */}
      {negociacao && (
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontWeight: 'bold' }}>Detalhes da Negociação:</Text>
          <Text>Proposta Inicial: Preço - {negociacao.propostaInicial.novoPreco}, Prazo - {negociacao.propostaInicial.novoPrazo}</Text>
          {negociacao.respostaProvider && (
            <Text>Resposta do Provider: Preço - {negociacao.respostaProvider.novoPreco}, Prazo - {negociacao.respostaProvider.novoPrazo}</Text>
          )}
          <Text>Status: {negociacao.status}</Text>
        </View>
      )}
    </ScrollView>
  );

  // Funções auxiliares para determinar o tipo de usuário
  function reqUserIsBuyer() {
    // Em um app real, o tipo de usuário deve estar disponível via contexto ou props
    // Aqui, para exemplo, assume que se token contém "buyer", o usuário é comprador
    // Esta função deve ser adaptada conforme a estratégia de autenticação adotada
    return true; // Placeholder – implemente a lógica de verificação
  }
  
  function reqUserIsProvider() {
    // Placeholder – implemente a lógica para verificar se o usuário é prestador
    return false; // Ajuste conforme necessário
  }
}
