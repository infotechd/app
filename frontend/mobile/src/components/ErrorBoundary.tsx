// src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

// Interface para as props do ErrorBoundary (pode ser vazia ou ter props customizadas)
interface Props {
  children: ReactNode; // Componentes filhos que este boundary vai proteger
  // Você pode adicionar props aqui se precisar, por exemplo, uma função de callback para logar o erro
  // onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Interface para o estado do ErrorBoundary
interface State {
  hasError: boolean;
  error?: Error; // Opcional: Armazena o erro para exibição ou log
}

// Componente de classe que implementa a lógica do Error Boundary
class ErrorBoundary extends Component<Props, State> {
  // Inicializa o estado
  public state: State = {
    hasError: false,
  };

  /**
   * Método estático chamado durante a fase de "render" quando ocorre um erro
   * em um componente descendente. Retorna um objeto para atualizar o estado.
   * @param error O erro que foi lançado.
   * @returns Um objeto de estado indicando que um erro ocorreu.
   */
  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error: error };
  }

  /**
   * Método chamado durante a fase de "commit" após um erro ter ocorrido
   * em um componente descendente. É um bom lugar para logar o erro.
   * @param error O erro que foi lançado.
   * @param errorInfo Um objeto com informações sobre qual componente lançou o erro.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você pode logar o erro para um serviço de monitoramento aqui
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);

    // Se você passou uma prop onError, pode chamá-la aqui
    // this.props.onError?.(error, errorInfo);
  }

  // Função para tentar renderizar novamente (resetar o estado de erro)
  // Pode ser chamada por um botão na UI de fallback
  private resetError = () => {
    this.setState({ hasError: false, error: undefined });
    // Adicionalmente, você pode querer forçar uma recarga do app ou navegar para a home
    // Depende da sua estratégia de recuperação de erro.
    // Ex: import * as Updates from 'expo-updates'; Updates.reloadAsync();
  };

  /**
   * Renderiza os componentes filhos ou a UI de fallback se um erro ocorreu.
   */
  public render() {
    // Se o estado indica que houve um erro, renderiza a UI de fallback
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Ocorreu um Erro Inesperado</Text>
          <Text style={styles.message}>
            Algo deu errado na aplicação. Por favor, tente novamente.
          </Text>
          {/* Opcional: Mostrar detalhes do erro em modo DEV */}
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetails}>
              Detalhes (DEV): {this.state.error.toString()}
            </Text>
          )}
          {/* Botão para tentar resetar (pode ou não funcionar dependendo do erro) */}
          <Button title="Tentar Novamente" onPress={this.resetError} color="#FF6347"/>
        </View>
      );
    }

    // Se não houve erro, renderiza os componentes filhos normalmente
    return this.props.children;
  }
}

// Estilos para a tela de fallback
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default ErrorBoundary;