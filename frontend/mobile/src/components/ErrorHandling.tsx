import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/styles/theme';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Componente para exibir mensagens de erro com opções de retry
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Erro',
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <View style={styles.buttonContainer}>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Fechar</Text>
          </TouchableOpacity>
        )}
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

/**
 * Hook para gerenciar erros de forma consistente
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: unknown, customMessage?: string) => {
    console.error('Erro capturado:', err);
    
    // Determinar a mensagem de erro apropriada
    let errorMessage: string;
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else {
      errorMessage = 'Ocorreu um erro inesperado';
    }
    
    // Usar mensagem personalizada se fornecida
    const displayMessage = customMessage || errorMessage;
    
    // Armazenar o erro no estado
    setError(err instanceof Error ? err : new Error(displayMessage));
    
    // Exibir alerta para o usuário
    Alert.alert('Erro', displayMessage);
    
    return { errorMessage: displayMessage };
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    handleError,
    clearError,
  };
}

/**
 * Função utilitária para tratamento de erros de API
 * @param error - O erro capturado
 * @param navigation - Objeto de navegação (opcional)
 * @returns Objeto com informações sobre o erro
 */
export function handleApiError(error: unknown, navigation?: any) {
  // Extrair a mensagem de erro
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Verificar se é um erro de autenticação
  const isAuthError = 
    errorMessage.includes('Token inválido') || 
    errorMessage.includes('Token expirado') || 
    errorMessage.includes('não autorizado');
  
  // Se for um erro de autenticação e tiver navegação disponível
  if (isAuthError && navigation) {
    Alert.alert(
      "Sessão expirada",
      "Sua sessão expirou. Por favor, faça login novamente.",
      [
        { 
          text: "OK", 
          onPress: () => {
            // Redireciona para a tela de login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } 
        }
      ]
    );
    return { isAuthError: true, errorMessage };
  }
  
  // Para outros tipos de erro
  Alert.alert(
    "Erro",
    errorMessage || "Ocorreu um erro inesperado. Tente novamente."
  );
  
  return { isAuthError: false, errorMessage };
}

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dismissButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.sm,
  },
  dismissButtonText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
});