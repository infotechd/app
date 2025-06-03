import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';

// 1. Importações
// Importa os hooks e componentes necessários do React e React Native
import { useAuth } from "@/context/AuthContext";  // Hook para acessar o contexto de autenticação
import { deleteAccount as apiDeleteAccount } from '../services/api';  // Função da API para excluir conta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';  // Tipo para as props de navegação
import { RootStackParamList } from "@/navigation/types";  // Tipo que define os parâmetros das rotas

// 2. Tipo das Props (sem parâmetros de rota)
// Define o tipo para as propriedades do componente, baseado na navegação
type DeleteAccountScreenProps = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

/**
 * Tela para exclusão de conta.
 * Solicita confirmação do usuário, chama a API de exclusão
 * e realiza logout do contexto em caso de sucesso.
 */
export default function DeleteAccountScreen({}: DeleteAccountScreenProps) {
  // 3. Obter usuário (para token) e função logout do contexto
  // Utiliza o hook useAuth para acessar o usuário atual e a função de logout
  const { user, logout: contextLogout } = useAuth();
  // Estado para controlar a exibição do indicador de carregamento
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 4. Função para lidar com a exclusão da conta
  // Esta função exibe um alerta de confirmação e processa a exclusão se confirmada
  const handleDelete = () => {
    // Exibe o pop-up de confirmação para o usuário
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
        // Este botão executa a operação de exclusão quando pressionado
        {
          text: 'Excluir',
          style: 'destructive', // Estilo para ação destrutiva (vermelho no iOS)
          onPress: async () => {
            // Verifica se temos o usuário e token necessários
            // Sem o token, não é possível autenticar a requisição de exclusão
            if (!user || !user.token) {
              Alert.alert('Erro', 'Não foi possível obter os dados de autenticação. Tente fazer login novamente.');
              return;
            }

            setIsLoading(true); // Ativa o indicador de carregamento

            try {
              // Chama a função da API tipada, passando o token do contexto
              // Esta função envia a requisição para o backend excluir a conta
              const response = await apiDeleteAccount(user.token);

              // Exibe mensagem de sucesso com a resposta do servidor
              Alert.alert('Sucesso', response.message);

              // Realiza o logout no AuthContext após a exclusão bem-sucedida no backend
              // Isso remove as credenciais do usuário do armazenamento local
              await contextLogout();

              // Não é mais necessário navegar manualmente para Login,
              // pois AppNavigation.tsx detectará user === null e renderizará o stack correto.
              // A navegação acontece automaticamente quando o estado de autenticação muda

            } catch (error) {
              // Trata o erro lançado pela função da API
              // Exibe uma mensagem de erro apropriada para o usuário
              Alert.alert(
                'Erro ao Excluir Conta',
                error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'
              );
              setIsLoading(false); // Garante que desativa o indicador de carregamento em caso de erro
            }
            // O bloco finally não é necessário aqui pois o logout vai desmontar a tela
            // ou a navegação ocorrerá. Se houvesse chance de continuar na tela,
            // setIsLoading(false) iria no finally.
          },
        },
      ],
      { cancelable: true } // Permite fechar o alerta clicando fora (Android)
    );
  };

  // 5. Renderização do componente
  // Retorna a interface visual da tela de exclusão de conta
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Excluir Conta</Text>
      <Text style={styles.warningText}>
        Atenção: Ao excluir sua conta, todos os seus dados associados serão removidos permanentemente (conforme política de retenção de dados). Esta ação não pode ser desfeita.
      </Text>
      {isLoading ? (
        // Exibe um indicador de carregamento enquanto a operação está em andamento
        <ActivityIndicator size="large" color="#dc3545" />
      ) : (
        // Botão de exclusão de conta que aciona o processo quando pressionado
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

// 6. Estilos
// Define os estilos visuais para os componentes da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,                  // Ocupa todo o espaço disponível
    padding: 20,              // Espaçamento interno
    justifyContent: 'center', // Centraliza conteúdo verticalmente
    alignItems: 'center',     // Centraliza conteúdo horizontalmente
  },
  title: {
    fontSize: 22,             // Tamanho da fonte do título
    fontWeight: 'bold',       // Negrito
    marginBottom: 20,         // Espaço abaixo do título
    textAlign: 'center',      // Alinhamento centralizado
  },
  warningText: {
    fontSize: 16,             // Tamanho da fonte do texto de aviso
    textAlign: 'center',      // Alinhamento centralizado
    marginBottom: 30,         // Mais espaço antes do botão
    color: '#6c757d',         // Cor cinza escuro
    paddingHorizontal: 10,    // Evita texto muito largo nas laterais
  },
});
