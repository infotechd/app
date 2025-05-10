import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';

// 1. Imports
import { useAuth } from "@/context/AuthContext";
import { deleteAccount as apiDeleteAccount } from '../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";

// 2. Tipo das Props (sem parâmetros de rota)
type DeleteAccountScreenProps = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

/**
 * Tela para exclusão de conta.
 * Solicita confirmação do usuário, chama a API de exclusão
 * e realiza logout do contexto em caso de sucesso.
 */
export default function DeleteAccountScreen({}: DeleteAccountScreenProps) {
  // 3. Obter usuário (para token) e função logout do contexto
  const { user, logout: contextLogout } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 4. Refatorar handleDelete
  const handleDelete = () => {
    // Exibe o pop-up de confirmação
    Alert.alert(
      'Confirmar Exclusão', // Título do Alerta
      'Você realmente deseja excluir sua conta?\nEsta ação não pode ser desfeita.', // Mensagem
      [
        // Botão 1: Cancelar
        {
          text: 'Cancelar',
          style: 'cancel', // Estilo padrão para cancelamento (iOS)
          onPress: () => console.log('Exclusão cancelada'),
        },
        // Botão 2: Excluir (com lógica assíncrona)
        {
          text: 'Excluir',
          style: 'destructive', // Estilo para ação destrutiva (vermelho no iOS)
          onPress: async () => {
            // Verifica se temos o usuário e token necessários
            if (!user || !user.token) {
              Alert.alert('Erro', 'Não foi possível obter os dados de autenticação. Tente fazer login novamente.');
              return;
            }

            setIsLoading(true); // Ativa o carregamento

            try {
              // Chama a função da API tipada, passando o token do contexto
              const response = await apiDeleteAccount(user.token);

              Alert.alert('Sucesso', response.message);

              // Realiza o logout no AuthContext após a exclusão bem-sucedida no backend
              await contextLogout();

              // Não é mais necessário navegar manualmente para Login,
              // pois AppNavigation.tsx detectará user === null e renderizará o stack correto.

            } catch (error) {
              // Trata o erro lançado pela função da API
              Alert.alert(
                'Erro ao Excluir Conta',
                error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
              );
              setIsLoading(false); // Garante que desativa o loading em caso de erro
            }
            // finally não é necessário aqui pois o logout vai desmontar a tela
            // ou a navegação ocorrerá. Se houvesse chance de continuar na tela,
            // setIsLoading(false) iria no finally.
          },
        },
      ],
      { cancelable: true } // Permite fechar o alerta clicando fora (Android)
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excluir Conta</Text>
      <Text style={styles.warningText}>
        Atenção: Ao excluir sua conta, todos os seus dados associados serão removidos permanentemente (conforme política de retenção de dados). Esta ação não pode ser desfeita.
      </Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#dc3545" />
      ) : (
        <Button
          title="Excluir Minha Conta Permanentemente"
          onPress={handleDelete}
          color="#dc3545" // Cor vermelha para botão destrutivo
          disabled={isLoading}
        />
      )}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // Centraliza conteúdo
    alignItems: 'center',     // Centraliza conteúdo
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30, // Mais espaço antes do botão
    color: '#6c757d', // Cor cinza escuro
    paddingHorizontal: 10, // Evita texto muito largo
  },
});