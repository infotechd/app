import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

// 1. Importar hook de autenticação e tipos de navegação
import { useAuth } from '../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // Importa a lista de parâmetros

// 2. Definir tipo das props da tela
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Tela principal exibida após o login do usuário.
 * Mostra uma mensagem de boas-vindas e opção de logout.
 */
// 3. Tipar as props recebidas pelo componente
export default function HomeScreen({ navigation }: HomeScreenProps) {
  // 4. Obter dados do usuário e função de logout do contexto
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // A navegação para a tela de Login deve acontecer automaticamente
    // devido à lógica condicional em AppNavigation.tsx quando o 'user' se torna null.
    // navigation.navigate('Login'); // Geralmente não é necessário aqui.
  };

  return (
    <View style={styles.container}>
      {/* 5. Usar nome do usuário (com optional chaining '?') */}
      <Text style={styles.title}>Bem-vindo(a), {user?.nome || 'Usuário'}!</Text>
      <Text style={styles.subtitle}>Você está na tela principal.</Text>

      {/* Informações adicionais (exemplo) */}
      {user && (
        <View style={styles.userInfo}>
          <Text>Email: {user.email}</Text>
          <Text>Tipo de Usuário: {user.tipoUsuario}</Text>
        </View>
      )}

      {/* 6. Botão de Logout */}
      <Button title="Sair (Logout)" onPress={handleLogout} color="#e74c3c" />

      {/* Adicionar aqui links ou botões para outras seções do app */}
      {/* Exemplo:
      <Button
        title="Ver Treinamentos"
        onPress={() => navigation.navigate('TreinamentoList')}
      />
      */}
    </View>
  );
}

// 7. Estilos básicos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', // Centraliza horizontalmente
    justifyContent: 'center', // Centraliza verticalmente
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  userInfo: {
    marginVertical: 20,
    alignItems: 'center', // Centraliza texto de info
  },
});