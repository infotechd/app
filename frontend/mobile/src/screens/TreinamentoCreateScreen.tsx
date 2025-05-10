import React, { useState } from 'react';
import {
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import { createTraining as apiCreateTraining } from '../services/api';
import { TrainingCreateData, TrainingFormat } from "@/types/training"; // Importa tipos de treinamento
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props (sem parâmetros de rota agora)
type TreinamentoCreateScreenProps = NativeStackScreenProps<RootStackParamList, 'TreinamentoCreate'>;

// Valores válidos para o formato (para validação ou futuro Picker)
const validFormats: TrainingFormat[] = ['video', 'pdf', 'webinar'];

/**
 * TreinamentoCreateScreen – Tela para criação de treinamentos.
 * Exclusiva para anunciantes (validação de role pode ser feita aqui ou via PrivateScreen).
 */
export default function TreinamentoCreateScreen({ navigation }: TreinamentoCreateScreenProps) {
  // 3. Obter usuário (para token) do contexto
  const { user } = useAuth();

  // 4. Tipar estados locais
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  // Inicializa com um valor válido de TrainingFormat
  const [formato, setFormato] = useState<TrainingFormat>('video');
  const [dataHora, setDataHora] = useState<string>(''); // Input é string
  const [preco, setPreco] = useState<string>(''); // Input é string
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 5. Refatorar handleCreateTreinamento
  const handleCreateTreinamento = async () => {
    if (!user || !user.token) {
      Alert.alert('Erro', 'Autenticação necessária para criar treinamento.');
      return;
    }

    // Validação dos campos obrigatórios
    if (!titulo.trim() || !descricao.trim() || !formato) {
      Alert.alert('Erro de Validação', 'Título, Descrição e Formato são obrigatórios.');
      return;
    }

    // Validação extra para o formato (se ainda estiver usando TextInput)
    if (!validFormats.includes(formato)) {
      Alert.alert('Erro de Validação', `Formato inválido. Use um de: ${validFormats.join(', ')}`);
      return;
    }

    // Validação e conversão de preço
    const precoNumero = Number(preco);
    if (isNaN(precoNumero) || precoNumero < 0) {
      Alert.alert('Erro de Validação', 'Preço inválido. Insira um número igual ou maior que zero.');
      return;
    }

    setIsLoading(true);

    // Monta o objeto de dados para a API
    const trainingData: TrainingCreateData = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      // Formato já é do tipo TrainingFormat devido ao state e validação
      formato: formato,
      // Envia null se dataHora for vazia, senão envia a string
      dataHora: dataHora.trim() || null,
      preco: precoNumero,
      // Status pode ser definido aqui ('draft') ou no backend
      status: 'draft' // Enviando status 'draft' como no original
    };

    try {
      // Chama a função da API tipada
      const response = await apiCreateTraining(user.token, trainingData);

      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior

    } catch (error) {
      Alert.alert(
        'Erro ao Criar Treinamento',
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
        <Text style={styles.title}>Criar Novo Treinamento</Text>

        <Text style={styles.label}>Título *</Text>
        <TextInput
          placeholder="Título do Treinamento"
          value={titulo}
          onChangeText={setTitulo}
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          placeholder="Descreva o treinamento..."
          value={descricao}
          onChangeText={setDescricao}
          style={[styles.input, styles.textArea]} // Estilo para área de texto
          multiline={true}
          numberOfLines={4}
          editable={!isLoading}
        />

        {/* TODO: Considerar usar um Picker ou Radio buttons para formato */}
        <Text style={styles.label}>Formato *</Text>
        <TextInput
          placeholder={`Formatos: ${validFormats.join(', ')}`}
          value={formato}
          // Força lowercase e garante que é um dos formatos válidos ao mudar
          onChangeText={(text) => setFormato(text.toLowerCase() as TrainingFormat)}
          autoCapitalize='none'
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Data/Hora (Opcional)</Text>
        <TextInput
          placeholder="AAAA-MM-DDTHH:MM:SSZ (Formato ISO)"
          value={dataHora}
          onChangeText={setDataHora}
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Preço *</Text>
        <TextInput
          placeholder="0 (para gratuito)"
          value={preco}
          onChangeText={setPreco}
          keyboardType="numeric"
          style={styles.input}
          editable={!isLoading}
        />

        <Button
          title={isLoading ? "Criando..." : "Criar Treinamento"}
          onPress={handleCreateTreinamento}
          disabled={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Estilos (reutilizando e adaptando dos anteriores)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
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
  textArea: {
    height: 100, // Altura maior para descrição
    textAlignVertical: 'top', // Alinha texto no topo em Android
  },
});