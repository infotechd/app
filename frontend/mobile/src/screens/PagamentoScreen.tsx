import React, { useState } from 'react';
import {
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

// 1. Importações
import { useAuth } from "@/context/AuthContext";
import { processPayment as apiProcessPayment } from '../services/api';
import { PaymentData, PaymentMethod } from "@/types/pagamento"; // Importa tipos de pagamento
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// Valores válidos para o método (para validação ou futuro Picker)
// Define os métodos de pagamento aceitos pelo sistema
const validPaymentMethods: PaymentMethod[] = ['cartao', 'boleto', 'pix'];

// 2. Tipo das Props (recebe contratacaoId via route.params)
type PagamentoScreenProps = NativeStackScreenProps<RootStackParamList, 'Pagamento'>;

/**
 * PagamentoScreen – Tela para Processamento de Pagamento (Mobile)
 * Permite que o usuário efetue o pagamento de um serviço.
 * Este componente gerencia todo o fluxo de pagamento, incluindo validação de dados e comunicação com a API.
 */
export default function PagamentoScreen({ route, navigation }: PagamentoScreenProps) {
  // 3. Extrair contratacaoId e obter usuário/token
  // Obtém o ID da contratação dos parâmetros da rota e as informações do usuário do contexto de autenticação
  const { contratacaoId } = route.params;
  const { user } = useAuth();

  // 4. Definir Estados Locais
  // Declaração dos estados que armazenam os dados do formulário e o estado de carregamento
  const [valor, setValor] = useState<string>(''); // Input é string
  const [metodo, setMetodo] = useState<PaymentMethod>('cartao'); // Usa o tipo PaymentMethod
  const [isLoading, setIsLoading] = useState<boolean>(false); // Controla o estado de carregamento durante o processamento

  // 5. Função de Processamento de Pagamento
  // Função assíncrona que valida os dados e envia a requisição de pagamento para a API
  const handleProcessarPagamento = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária para realizar pagamento.');
      return;
    }
    if (!contratacaoId){
      Alert.alert('Erro Interno', 'ID da Contratação não encontrado.');
      return;
    }

    // Validação dos dados de entrada
    // Converte o valor de string para número para validação e uso na API
    const valorNumero = Number(valor);
    if (!valor || isNaN(valorNumero) || valorNumero <= 0) {
      Alert.alert('Erro de Validação', 'Valor inválido. Insira um número maior que zero.');
      return;
    }
    if (!metodo || !validPaymentMethods.includes(metodo)) {
      Alert.alert('Erro de Validação', `Método inválido. Use um de: ${validPaymentMethods.join(', ')}`);
      return;
    }

    setIsLoading(true);

    const paymentData: PaymentData = {
      contratacaoId,
      valor: valorNumero,
      metodo, // Já é do tipo PaymentMethod - define o método de pagamento selecionado
    };

    try {
      const response = await apiProcessPayment(user.token, paymentData);
      Alert.alert('Sucesso', response.message);
      // TODO: Lógica pós-pagamento:
      // - Navegar para uma tela de sucesso?
      // - Voltar para a tela anterior?
      // - Atualizar o status da contratação localmente ou buscando novamente?
      // Atualmente apenas retorna para a tela anterior após o pagamento bem-sucedido
      navigation.goBack();

    } catch (error) {
      Alert.alert(
        'Erro no Pagamento',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Processar Pagamento</Text>
        <Text style={styles.label}>Contratação ID: {contratacaoId}</Text>

        <Text style={styles.label}>Valor a Pagar *</Text>
        <TextInput
          placeholder="Ex: 150.50"
          value={valor}
          onChangeText={setValor}
          keyboardType="numeric"
          style={styles.input}
          editable={!isLoading}
        />

        {/* TODO: Implementar Picker ou Radio Buttons para seleção do método de pagamento */}
        <Text style={styles.label}>Método de Pagamento *</Text>
        <TextInput
          placeholder={`(${validPaymentMethods.join(', ')})`}
          value={metodo}
          // Força texto em minúsculas e garante compatibilidade com os métodos válidos
          onChangeText={(text) => setMetodo(text.toLowerCase() as PaymentMethod)}
          autoCapitalize='none'
          style={styles.input}
          editable={!isLoading}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
        ) : (
          <Button
            title="Efetuar Pagamento"
            onPress={handleProcessarPagamento}
            disabled={isLoading}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 6. Estilos da Interface
// Define a aparência visual dos componentes da tela
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
