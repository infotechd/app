import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import { submitReview as apiSubmitReview } from '../services/api';
import { ReviewData } from '../types/avaliacao'; // Importa tipo dos dados da avaliação
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// 2. Tipo das Props (recebe receptorId e receptorNome via route.params)
type AvaliacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Avaliacao'>;

/**
 * AvaliacaoScreen – Tela de Avaliação
 * Permite que o usuário autenticado registre uma avaliação para outro usuário.
 */
export default function AvaliacaoScreen({ route, navigation }: AvaliacaoScreenProps) {
  // 3. Extrair dados do receptor e obter usuário/token
  const { receptorId, receptorNome } = route.params; // Obtém da navegação
  const { user } = useAuth(); // Obtém usuário logado (avaliador)

  // 4. Tipar Estados Locais
  const [nota, setNota] = useState<string>(''); // Input é string
  const [comentario, setComentario] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [receptorIdState, setReceptorIdState] = useState(''); // REMOVIDO

  // 5. Refatorar handleSubmit
  const handleSubmit = async () => {
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária para avaliar.');
      return;
    }
    if (!receptorId) {
      Alert.alert('Erro Interno', 'ID do usuário a ser avaliado não encontrado.');
      return;
    }

    // Validação da nota
    const notaNumero = parseInt(nota, 10); // Usar parseInt para garantir inteiro
    if (!nota || isNaN(notaNumero) || notaNumero < 1 || notaNumero > 5) {
      Alert.alert('Erro de Validação', 'Nota inválida. Insira um número inteiro entre 1 e 5.');
      return;
    }

    setIsLoading(true);

    const reviewData: ReviewData = {
      receptorId: receptorId,
      nota: notaNumero,
      comentario: comentario.trim() || undefined, // Envia undefined se comentário for vazio
    };

    try {
      const response = await apiSubmitReview(user.token, reviewData);
      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior

    } catch (error) {
      Alert.alert(
        'Erro ao Enviar Avaliação',
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
        <Text style={styles.title}>Avaliar Usuário</Text>
        {/* Exibe o nome do usuário sendo avaliado, se disponível */}
        {receptorNome ? (
          <Text style={styles.receptorInfo}>Avaliando: {receptorNome}</Text>
        ) : (
          <Text style={styles.receptorInfo}>Avaliando ID: {receptorId}</Text>
        )}


        {/* 6. Remover Input de receptorId */}
        {/* <TextInput placeholder="ID do Receptor" ... /> */}

        {/* TODO: Considerar usar componente de Estrelas para a nota */}
        <Text style={styles.label}>Nota (1 a 5) *</Text>
        <TextInput
          placeholder="Digite um número de 1 a 5"
          value={nota}
          onChangeText={setNota}
          keyboardType="number-pad" // Teclado numérico
          maxLength={1} // Apenas 1 dígito
          style={styles.input}
          editable={!isLoading}
        />

        <Text style={styles.label}>Comentário (opcional)</Text>
        <TextInput
          placeholder="Deixe seu comentário sobre o serviço/usuário..."
          value={comentario}
          onChangeText={setComentario}
          style={[styles.input, styles.textArea]}
          multiline={true}
          numberOfLines={4}
          editable={!isLoading}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 20}}/>
        ) : (
          <Button title="Enviar Avaliação" onPress={handleSubmit} disabled={isLoading} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 7. Estilos
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  receptorInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
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
    height: 100,
    textAlignVertical: 'top',
  },
});