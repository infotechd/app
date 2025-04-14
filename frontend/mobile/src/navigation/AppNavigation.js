// Importa as bibliotecas essenciais do React Navigation e React
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importa as telas conforme os casos de uso do App
// - OnboardingScreen: guia inicial para novos usuários
// - LoginScreen: tela para autenticação
// - RegistrationScreen: tela para cadastro de usuários (Comprador, Prestador, Anunciante)
// - ResetPasswordScreen: (opcional) fluxo para recuperação de senha
// - HomeScreen: área privada após login (dashboard, ofertas, agenda, etc.)
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';

// Cria o stack navigator que organiza as telas em pilha
const Stack = createNativeStackNavigator();

/**
 * Componente principal de navegação do app mobile.
 * Define as rotas públicas (onboarding, login, cadastro, reset de senha) e
 * as rotas privadas (ex.: Home) que serão acessadas após a autenticação.
 */
export default function AppNavigation() {
  return (
    // NavigationContainer é o provedor que gerencia o estado de navegação
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        {/* Tela de Onboarding: Introduz o app ao usuário novo.
            Geralmente exibe um walkthrough ou informações iniciais. */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />

        {/* Rotas públicas:
            Login, Cadastro e Reset de Senha estão disponíveis para usuários não autenticados. */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Entrar' }}
        />
        <Stack.Screen
          name="Registration"
          component={RegistrationScreen}
          options={{ title: 'Criar Conta' }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{ title: 'Redefinir Senha' }}
        />

        {/* Rotas privadas:
            Após a autenticação, o usuário acessa a Home, que pode integrar outras telas (dashboard, ofertas, agenda, etc.).
            A proteção das rotas deve ser implementada em um componente de controle de acesso se necessário. */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Início' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
