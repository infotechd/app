import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; // Para o Loading
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. Importar Hook de Autenticação e Tipos de Navegação
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from './types'; // Importa a lista de parâmetros centralizada

// 2. Importar Telas Existentes (usar .tsx para as convertidas)
// import OnboardingScreen from '../screens/OnboardingScreen'; // Não existe
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
// import ResetPasswordScreen from '../screens/ResetPasswordScreen'; // Não existe
import HomeScreen from '../screens/HomeScreen'; // Ainda .js
// Importe outras telas conforme necessário no futuro
// import EditProfileScreen from '../screens/EditProfileScreen';
// import TreinamentoListScreen from '../screens/TreinamentoListScreen';


// 3. Criar o Stack Navigator Tipado
const Stack = createNativeStackNavigator<RootStackParamList>();

// Componente simples para exibir durante o carregamento do estado de auth
const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

/**
 * Componente principal de navegação do app.
 * Renderiza condicionalmente as telas de autenticação ou as telas principais
 * com base no estado do usuário (logado ou não).
 */
export default function AppNavigation() {
  // 4. Obter estado de autenticação e carregamento
  const { user, isLoading } = useAuth();

  // 5. Exibir indicador enquanto o estado de autenticação é carregado
  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <NavigationContainer>
      {/* 6. Configurar o Stack Navigator */}
      {/* initialRouteName não é mais necessário aqui devido à renderização condicional */}
      {/* screenOptions pode ser usado para configurar aparência global (header, etc.) */}
      <Stack.Navigator
        screenOptions={{
          // Exemplo: Desabilitar header por padrão, habilitar por tela se necessário
          // headerShown: false,
        }}
      >
        {user ? (
          // --- Telas para Usuários Autenticados ---
          <>
            {/* Tela Principal após login */}
            <Stack.Screen
              name="Home"
              component={HomeScreen} // Ainda .js
              options={{ title: 'Início' }}
            />
            {/* Adicionar outras telas privadas aqui */}
            {/* Exemplo:
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="TreinamentoList" component={TreinamentoListScreen} />
            ... */}
          </>
        ) : (
          // --- Telas para Usuários Não Autenticados ---
          <>
            {/* Onboarding removido/comentado pois o arquivo não existe */}
            {/*
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            */}

            {/* Tela de Login (primeira tela se deslogado) */}
            <Stack.Screen
              name="Login"
              component={LoginScreen} // Convertida para .tsx
              options={{ title: 'Entrar', headerShown: false }} // Oculta header na tela de login
            />
            {/* Tela de Cadastro */}
            <Stack.Screen
              name="Registration"
              component={RegistrationScreen} // Convertida para .tsx
              options={{ title: 'Criar Conta' }} // Mantém header aqui
            />
            {/* ResetPassword removido/comentado pois o arquivo não existe */}
            {/*
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ title: 'Redefinir Senha' }}
            />
            */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});