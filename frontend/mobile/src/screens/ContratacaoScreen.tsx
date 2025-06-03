import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';

// 1. Importações
// Este bloco importa todas as dependências necessárias para o componente funcionar
import { useAuth } from "@/context/AuthContext"; // Hook para acessar o contexto de autenticação
import { hireOffer as apiHireOffer } from '../services/api'; // Função da API para contratar uma oferta
import { ContratacaoData } from "@/types/contratacao"; // Tipo para dados da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack'; // Tipo para props de navegação
import { RootStackParamList } from "@/navigation/types"; // Importa ParamList atualizado

// 2. Tipo das Props (espera 'ofertaId' via route.params)
// Define o tipo das props que este componente recebe, incluindo parâmetros de navegação
type ContratacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Contratacao'>;

/**
 * Tela para confirmar a contratação de uma oferta específica.
 * O ID da oferta é recebido via parâmetros de navegação.
 * Esta tela permite ao usuário confirmar a contratação de um serviço.
 */
export default function ContratacaoScreen({ route, navigation }: ContratacaoScreenProps) {
  // 3. Extrair ofertaId e obter usuário/token
  // Aqui extraímos o ID da oferta dos parâmetros de navegação e obtemos o usuário atual
  const { ofertaId } = route.params; // Obtém o ID da oferta da navegação
  const { user } = useAuth(); // Obtém o usuário logado (para acessar o token de autenticação)

  // 4. Estado Local (apenas loading)
  // Gerenciamos o estado de carregamento para mostrar um indicador quando a operação estiver em andamento
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [ofertaId, setOfertaId] = useState(''); // REMOVIDO - Não é mais necessário como estado local

  // 5. Função de Contratação
  // Esta função é responsável por processar a contratação da oferta
  const handleContratar = async () => {
    // Verificações de segurança antes de prosseguir
    if (!user || !user.token) {
      Alert.alert('Erro', 'Você precisa estar logado para contratar.');
      return;
    }
    if (!ofertaId) {
      Alert.alert('Erro Interno', 'ID da oferta não encontrado.');
      return;
    }

    // Ativa o indicador de carregamento
    setIsLoading(true);

    // Monta o objeto de dados para enviar à API
    const contratacaoData: ContratacaoData = {
      ofertaId: ofertaId,
    };

    try {
      // Chama a função da API para realizar a contratação
      const response = await apiHireOffer(user.token, contratacaoData);

      // Exibe mensagem de sucesso e retorna à tela anterior
      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior (provavelmente a de busca/detalhe)

    } catch (error) {
      // Tratamento de erro com mensagem apropriada
      Alert.alert(
        'Erro ao Contratar',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      // Desativa o indicador de carregamento independentemente do resultado
      setIsLoading(false);
    }
  };

  return (
    // 6. Interface do Usuário
    // Aqui definimos a estrutura visual da tela de contratação
    <View style={styles.container}>
      {/* Título principal da tela */}
      <Text style={styles.title}>Confirmar Contratação</Text>

      {/* Informações sobre a oferta que está sendo contratada */}
      <Text style={styles.infoText}>
        Você está prestes a contratar a oferta com ID: {ofertaId}.
      </Text>

      {/* Informações adicionais sobre o processo de contratação */}
      <Text style={styles.infoText}>
        Ao confirmar, o prestador será notificado. Detalhes adicionais e o pagamento serão tratados posteriormente.
      </Text>

      {/* Renderização condicional: mostra indicador de carregamento ou botão de confirmação */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader}/>
      ) : (
        <Button
          title="Confirmar Contratação da Oferta"
          onPress={handleContratar}
          disabled={isLoading}
        />
      )}
    </View>
  );
}

// 7. Estilos
// Definição dos estilos utilizados pelos componentes da interface
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
    color: '#444',
  },
  loader: {
    marginTop: 20,
  },
  // Estilos do TextInput foram removidos pois não são mais necessários
});
