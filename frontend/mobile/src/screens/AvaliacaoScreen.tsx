import React, { useState } from 'react';
import {
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

// 1. Importações - Esta seção importa todos os componentes e funções necessários para o funcionamento da tela
import { useAuth } from "@/context/AuthContext"; // Importa o hook de autenticação para acessar dados do usuário logado
import { submitReview as apiSubmitReview } from '../services/api'; // Importa a função de API para enviar avaliações
import { ReviewData } from "@/types/avaliacao"; // Importa o tipo de dados para a avaliação
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Importa tipos para navegação
import { RootStackParamList } from "@/navigation/types"; // Importa tipos de parâmetros para as rotas

// 2. Tipo das Props (recebe receptorId e receptorNome via route.params)
type AvaliacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Avaliacao'>;

/**
 * AvaliacaoScreen – Tela de Avaliação
 * Permite que o usuário autenticado registre uma avaliação para outro usuário.
 * Esta tela recebe o ID e nome do usuário a ser avaliado através dos parâmetros de rota.
 */
export default function AvaliacaoScreen({ route, navigation }: AvaliacaoScreenProps) {
  // 3. Extrair dados do receptor e obter usuário/token - Obtém os dados necessários para a avaliação
  const { receptorId, receptorNome } = route.params; // Obtém o ID e nome do usuário a ser avaliado da navegação
  const { user } = useAuth(); // Obtém dados do usuário logado (avaliador) através do contexto de autenticação

  // 4. Tipar Estados Locais - Define e tipifica os estados que serão utilizados no componente
  const [nota, setNota] = useState<string>(''); // Estado para armazenar a nota (como string para facilitar o input)
  const [comentario, setComentario] = useState<string>(''); // Estado para armazenar o comentário da avaliação
  const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para controlar o indicador de carregamento
  // const [receptorIdState, setReceptorIdState] = useState(''); // REMOVIDO - Estado não mais necessário

  // 5. Função de Envio da Avaliação - Gerencia todo o processo de validação e envio da avaliação
  const handleSubmit = async () => {
    // Verifica se o usuário está autenticado
    if (!user?.token) {
      Alert.alert('Erro', 'Autenticação necessária para avaliar.');
      return;
    }
    // Verifica se o ID do receptor foi fornecido
    if (!receptorId) {
      Alert.alert('Erro Interno', 'ID do usuário a ser avaliado não encontrado.');
      return;
    }

    // Validação da nota - Garante que a nota seja um número válido entre 1 e 5
    const notaNumero = parseInt(nota, 10); // Usar parseInt para garantir inteiro
    if (!nota || isNaN(notaNumero) || notaNumero < 1 || notaNumero > 5) {
      Alert.alert('Erro de Validação', 'Nota inválida. Insira um número inteiro entre 1 e 5.');
      return;
    }

    // Ativa o indicador de carregamento
    setIsLoading(true);

    // Prepara os dados da avaliação para envio
    const reviewData: ReviewData = {
      receptorId: receptorId,
      nota: notaNumero,
      comentario: comentario.trim() || undefined, // Envia undefined se comentário for vazio
    };

    try {
      // Envia a avaliação para a API
      const response = await apiSubmitReview(user.token, reviewData);
      // Exibe mensagem de sucesso
      Alert.alert('Sucesso', response.message);
      // Retorna para a tela anterior
      navigation.goBack(); // Volta para a tela anterior

    } catch (error) {
      // Tratamento de erro - Exibe mensagem apropriada
      Alert.alert(
        'Erro ao Enviar Avaliação',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      // Desativa o indicador de carregamento independente do resultado
      setIsLoading(false);
    }
  };

  // Interface do usuário - Renderiza o formulário de avaliação
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Ajusta o comportamento baseado na plataforma
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


        {/* 6. Campo de entrada do ID do receptor foi removido pois agora é recebido via parâmetros */}
        {/* <TextInput placeholder="ID do Receptor" ... /> */}

        {/* TODO: Considerar usar componente de Estrelas para a nota no futuro */}
        <Text style={styles.label}>Nota (1 a 5) *</Text>
        <TextInput
          placeholder="Digite um número de 1 a 5"
          value={nota}
          onChangeText={setNota}
          keyboardType="number-pad" // Teclado numérico para facilitar entrada de números
          maxLength={1} // Limita a apenas 1 dígito
          style={styles.input}
          editable={!isLoading} // Desabilita o campo durante o carregamento
        />

        <Text style={styles.label}>Comentário (opcional)</Text>
        <TextInput
          placeholder="Deixe seu comentário sobre o serviço/usuário..."
          value={comentario}
          onChangeText={setComentario}
          style={[styles.input, styles.textArea]}
          multiline={true} // Permite múltiplas linhas
          numberOfLines={4} // Altura inicial de 4 linhas
          editable={!isLoading} // Desabilita o campo durante o carregamento
        />

        {/* Renderização condicional: mostra indicador de carregamento ou botão de envio */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" style={{marginTop: 20}}/>
        ) : (
          <Button title="Enviar Avaliação" onPress={handleSubmit} disabled={isLoading} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// 7. Estilos - Definição dos estilos utilizados nos componentes da interface
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Permite que o conteúdo cresça para preencher o espaço disponível
    padding: 20, // Espaçamento interno em todos os lados
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
  },
  title: {
    fontSize: 22, // Tamanho da fonte do título
    fontWeight: 'bold', // Peso da fonte em negrito
    marginBottom: 15, // Espaçamento inferior
    textAlign: 'center', // Alinhamento do texto ao centro
  },
  receptorInfo: {
    fontSize: 16, // Tamanho da fonte da informação do receptor
    textAlign: 'center', // Alinhamento do texto ao centro
    marginBottom: 20, // Espaçamento inferior
    color: '#555', // Cor do texto em cinza
  },
  label: {
    fontSize: 14, // Tamanho da fonte dos rótulos
    marginBottom: 5, // Espaçamento inferior
    marginLeft: 5, // Espaçamento à esquerda
    color: '#333', // Cor do texto em cinza escuro
    fontWeight: '500', // Peso da fonte semi-negrito
  },
  input: {
    borderWidth: 1, // Largura da borda
    borderColor: '#ccc', // Cor da borda em cinza claro
    borderRadius: 5, // Arredondamento dos cantos
    padding: 12, // Espaçamento interno
    marginBottom: 15, // Espaçamento inferior
    fontSize: 16, // Tamanho da fonte
    backgroundColor: '#fff', // Cor de fundo branca
  },
  textArea: {
    height: 100, // Altura fixa para a área de texto
    textAlignVertical: 'top', // Alinha o texto ao topo (importante para áreas de texto)
  },
});
