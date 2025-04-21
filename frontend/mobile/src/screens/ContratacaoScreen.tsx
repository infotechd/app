import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';

// 1. Imports
import { useAuth } from '../context/AuthContext';
import { hireOffer as apiHireOffer } from '../services/api';
import { ContratacaoData } from '../types/contratacao'; // Tipo para dados da API
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // Importa ParamList atualizado

// 2. Tipo das Props (espera 'ofertaId' via route.params)
type ContratacaoScreenProps = NativeStackScreenProps<RootStackParamList, 'Contratacao'>;

/**
 * Tela para confirmar a contratação de uma oferta específica.
 * O ID da oferta é recebido via parâmetros de navegação.
 */
export default function ContratacaoScreen({ route, navigation }: ContratacaoScreenProps) {
  // 3. Extrair ofertaId e obter usuário/token
  const { ofertaId } = route.params; // Obtém da navegação
  const { user } = useAuth(); // Obtém usuário logado (para token)

  // 4. Estado Local (apenas loading)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [ofertaId, setOfertaId] = useState(''); // REMOVIDO

  // 5. Refatorar handleContratar
  const handleContratar = async () => {
    if (!user || !user.token) {
      Alert.alert('Erro', 'Você precisa estar logado para contratar.');
      return;
    }
    if (!ofertaId) {
      Alert.alert('Erro Interno', 'ID da oferta não encontrado.');
      return;
    }

    setIsLoading(true);

    // Monta o objeto de dados para a API
    const contratacaoData: ContratacaoData = {
      ofertaId: ofertaId,
    };

    try {
      // Chama a função da API tipada
      const response = await apiHireOffer(user.token, contratacaoData);

      Alert.alert('Sucesso', response.message);
      navigation.goBack(); // Volta para a tela anterior (provavelmente a de busca/detalhe)

    } catch (error) {
      Alert.alert(
        'Erro ao Contratar',
        error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 6. Atualizar UI
    <View style={styles.container}>
      <Text style={styles.title}>Confirmar Contratação</Text>
      <Text style={styles.infoText}>
        Você está prestes a contratar a oferta com ID: {ofertaId}.
      </Text>
      <Text style={styles.infoText}>
        Ao confirmar, o prestador será notificado. Detalhes adicionais e o pagamento serão tratados posteriormente.
      </Text>

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
  // Remover estilos do TextInput se existiam
});