import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// 1. Importar o hook useAuth e o tipo UserRole
import { useAuth } from "@/context/AuthContext";
import { UserRole, User } from "@/types/user"; // Importar o tipo centralizado

/**
 * Verifica se um usuário possui a role específica requerida
 * @param user O objeto do usuário
 * @param role A role requerida
 * @returns true se o usuário possui a role, false caso contrário
 */
function hasRequiredRole(user: User, role: UserRole): boolean {
  switch (role) {
    case 'comprador':
      return !!user.isComprador;
    case 'prestador':
      return !!user.isPrestador;
    case 'anunciante':
      return !!user.isAnunciante;
    case 'admin':
      return !!user.isAdmin;
    default:
      return false;
  }
}

/**
 * Gera uma representação textual das roles que um usuário possui
 * @param user O objeto do usuário
 * @returns String com as roles do usuário separadas por vírgula
 */
function getUserRolesText(user: User): string {
  const roles: string[] = [];

  if (user.isComprador) roles.push('comprador');
  if (user.isPrestador) roles.push('prestador');
  if (user.isAnunciante) roles.push('anunciante');
  if (user.isAdmin) roles.push('admin');

  return roles.length > 0 ? roles.join(', ') : 'nenhum';
}

// 2. Definir a interface para as Props do componente
interface PrivateScreenProps {
  /** Os componentes filhos que serão renderizados se o acesso for permitido. */
  children: ReactNode;
  /** O papel (role) específico necessário para acessar este conteúdo (opcional). */
  requiredRole?: UserRole; // Usa o tipo UserRole importado
}

/**
 * PrivateScreen – Componente de proteção para telas ou seções do app.
 * Verifica se o usuário está autenticado (e se o estado já foi carregado)
 * e, opcionalmente, se possui a role requerida antes de renderizar os filhos.
 */
export default function PrivateScreen({ requiredRole, children }: PrivateScreenProps) {
  // 3. Usar o hook useAuth tipado
  const { user, isLoading } = useAuth();

  // 4. Verificar o estado de carregamento inicial do AuthContext
  if (isLoading) {
    // Exibe um indicador de carregamento enquanto o estado de autenticação é verificado
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // 5. Verificar se o usuário está autenticado (após o carregamento)
  if (!user) {
    // Se não há usuário após o carregamento, exibe mensagem
    // Em um app real, pode-se navegar para a tela de Login aqui
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Usuário não autenticado.</Text>
        <Text style={styles.messageText}>Por favor, faça login.</Text>
        {/* Exemplo: <Button title="Ir para Login" onPress={() => navigation.navigate('Login')} /> */}
        {/* Note: Para usar navigation aqui, teria que receber como prop ou usar useNavigation() */}
      </View>
    );
  }

  // 6. Verificar se uma role específica é exigida e se o usuário a possui
  if (requiredRole && !hasRequiredRole(user, requiredRole)) {
    // Se a role é exigida mas não corresponde, nega o acesso
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Acesso Negado.</Text>
        <Text style={styles.messageText}>
          Esta área é restrita para usuários do tipo '{requiredRole}'.
        </Text>
        <Text style={styles.messageText}>
          Seus tipos são: {getUserRolesText(user)}
        </Text>
      </View>
    );
  }

  // 7. Se todas as verificações passarem, renderiza o conteúdo protegido (children)
  // O React trata ReactNode (incluindo JSX, null, etc.) corretamente aqui.
  return <>{children}</>;
}

// Estilos básicos para as mensagens e container
const styles = StyleSheet.create({
  container: {
    flex: 1, // Ocupa espaço disponível
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0', // Um fundo leve
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
});
