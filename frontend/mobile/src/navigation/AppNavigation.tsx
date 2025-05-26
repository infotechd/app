// src/navigation/AppNavigation.tsx

import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native'; // Adicionado Text para Placeholder
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. Importar Hook de Autenticação e Tipos de Navegação
import { useAuth } from "@/context/AuthContext";
import { RootStackParamList } from './types';

// 2. Importar Componentes das Telas
// Telas Públicas/Autenticação
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
// Telas que não existem ainda, mas estão definidas em types.ts
// import OnboardingScreen from '../screens/OnboardingScreen';
// import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// Telas Privadas (Autenticadas)
import HomeScreen from '../screens/HomeScreen';
import EditProfileScreen from '../screens/NewEditProfileScreen';
import TreinamentoListScreen from '../screens/TreinamentoListScreen';
import TreinamentoDetailScreen from '../screens/TreinamentoDetailScreen';
import TreinamentoCreateScreen from '../screens/TreinamentoCreateScreen';
import RelatorioScreen from '../screens/RelatorioScreen';
import ProviderDashboardScreen from '../screens/ProviderDashboardScreen';
import PagamentoScreen from '../screens/PagamentoScreen';
import OfertaServicoScreen from '../screens/OfertaServicoScreen';
import NotificacaoScreen from '../screens/NotificacaoScreen';
import NegociacaoScreen from '../screens/NegociacaoScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import CurriculoFormScreen from '../screens/CurriculoFormScreen';
import ContratacaoScreen from '../screens/ContratacaoScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ChatScreen from '../screens/ChatScreen';
import BuyerDashboardScreen from '../screens/BuyerDashboardScreen';
import BuscarOfertasScreen from '../screens/BuscarOfertasScreen';
import AvaliacaoScreen from '../screens/AvaliacaoScreen';
import AgendaScreen from '../screens/AgendaScreen';
import AdvertiserDashboardScreen from '../screens/AdvertiserDashboardScreen';

// Telas definidas em types.ts mas que ainda não existem como arquivos
import OfferDetailScreen from '../screens/OfferDetailScreen';
// import ContratacaoDetalheScreen from '../screens/ContratacaoDetalheScreen';
// import AdDetailScreen from '../screens/AdDetailScreen';


// --- Placeholder para telas ainda não implementadas ---
const PlaceholderScreen = ({ route }: any) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderTitle}>Tela em Desenvolvimento</Text>
    <Text style={styles.placeholderText}>A tela "{route?.name ?? 'Placeholder'}" ainda está sendo implementada.</Text>
    <Text style={styles.placeholderSubtext}>Por favor, volte mais tarde.</Text>
  </View>
);
// --- Fim Placeholder ---


// 3. Criar o Stack Navigator Tipado
// Usando createNativeStackNavigator e passando a lista de parâmetros importada
const Stack = createNativeStackNavigator<RootStackParamList>();

// Componente simples para exibir durante o carregamento inicial do estado de auth
const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" /> {/* Cor exemplo iOS Blue */}
  </View>
);

/**
 * Componente principal de navegação do app.
 * Controla o fluxo entre telas de autenticação e telas principais da aplicação
 * com base no estado de login do usuário.
 */
export default function AppNavigation() {
  // 4. Obter estado de autenticação (usuário logado?) e status de carregamento
  const { user, isLoading } = useAuth();

  // 5. Exibir indicador de carregamento enquanto o estado de autenticação é verificado
  if (isLoading) {
    return <LoadingIndicator />;
  }

  // 6. Renderizar o container de navegação e o stack navigator apropriado
  return (
    <NavigationContainer>
      {/* Configurações globais do Stack Navigator podem ser definidas aqui */}
      <Stack.Navigator
        id={undefined}  // O stack.navigator estava dando erro acrecentei isso aqui = id={undefined}
        initialRouteName={user ? 'Home' : 'BuscarOfertas'} // Define a tela inicial baseada no login
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#f8f8f8' },
          headerTintColor: '#333',
          headerBackTitle: 'Voltar',
        }}
      >
        {user ? (
          // --- Telas para Usuários Autenticados ---
          // O usuário está logado, mostrar telas privadas/principais
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }}/>
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil' }} />
            <Stack.Screen name="TreinamentoList" component={TreinamentoListScreen} options={{ title: 'Treinamentos' }} />
            <Stack.Screen name="TreinamentoDetail" component={TreinamentoDetailScreen} options={{ title: 'Detalhe Treinamento' }} />
            <Stack.Screen name="TreinamentoCreate" component={TreinamentoCreateScreen} options={{ title: 'Criar Treinamento' }} />
            <Stack.Screen name="Relatorio" component={RelatorioScreen} options={{ title: 'Relatórios' }} />
            <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} options={{ title: 'Painel Prestador' }} />
            {/* Telas definidas em types.ts mas que ainda não existem como arquivos */}
            <Stack.Screen name="OfferDetail" component={OfferDetailScreen} options={{ title: 'Detalhe da Oferta' }} />
            <Stack.Screen name="ContratacaoDetalhe" component={PlaceholderScreen} options={{ title: 'Detalhe Contratação' }} />
            <Stack.Screen name="Pagamento" component={PagamentoScreen} options={{ title: 'Pagamento' }} />
            <Stack.Screen name="OfertaServico" component={OfertaServicoScreen} options={{ title: 'Minhas Ofertas' }} />
            <Stack.Screen name="Notificacao" component={NotificacaoScreen} options={{ title: 'Notificações' }} />
            <Stack.Screen name="Negociacao" component={NegociacaoScreen} options={{ title: 'Negociação' }} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Excluir Conta' }} />
            <Stack.Screen name="CurriculoForm" component={CurriculoFormScreen} options={{ title: 'Editar Currículo' }} />
            <Stack.Screen name="Contratacao" component={ContratacaoScreen} options={{ title: 'Contratar Serviço' }} />
            <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'Comunidade' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
            <Stack.Screen name="BuyerDashboard" component={BuyerDashboardScreen} options={{ title: 'Painel Comprador' }} />
            <Stack.Screen name="BuscarOfertas" component={BuscarOfertasScreen} options={{ title: 'Buscar Ofertas' }} />
            <Stack.Screen name="Avaliacao" component={AvaliacaoScreen} options={{ title: 'Avaliar Usuário' }} />
            <Stack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Minha Agenda' }} />
            <Stack.Screen name="AdvertiserDashboard" component={AdvertiserDashboardScreen} options={{ title: 'Painel Anunciante' }} />
            <Stack.Screen name="AdDetail" component={PlaceholderScreen} options={{ title: 'Detalhe Anúncio' }} />
          </>
        ) : (
          // --- Telas para Usuários Não Autenticados ---
          // O usuário NÃO está logado, mostrar telas de Onboarding, Login, Cadastro
          <>
            {/* Telas definidas em types.ts mas que ainda não existem como arquivos */}
            <Stack.Screen name="Onboarding" component={PlaceholderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Criar Conta' }} />
            <Stack.Screen name="ResetPassword" component={PlaceholderScreen} options={{ title: 'Redefinir Senha' }} />
            <Stack.Screen name="BuscarOfertas" component={BuscarOfertasScreen} options={{ title: 'Buscar Ofertas' }} />
            <Stack.Screen name="OfertaServico" component={OfertaServicoScreen} options={{ title: 'Detalhes da Oferta' }} />
            <Stack.Screen name="OfferDetail" component={OfferDetailScreen} options={{ title: 'Detalhe da Oferta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Estilos para o container do loading indicator e placeholder
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fundo branco enquanto carrega
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
  },
});
