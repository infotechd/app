// Importa o polyfill necessário no topo do arquivo.
// Este polyfill é essencial para o funcionamento correto dos gestos na aplicação.
import 'react-native-gesture-handler';

// Importa React e hooks/componentes necessários.
// Estes hooks são utilizados para gerenciar o ciclo de vida e estado dos componentes.
import React, { useEffect, useCallback, useState, useRef } from 'react';
// Importamos os componentes necessários para a aplicação, incluindo Text para renderizar strings.
import { View, StyleSheet, Text } from 'react-native';
// Importa a biblioteca de Splash Screen do Expo para controlar a tela inicial.
import * as SplashScreen from 'expo-splash-screen';

// Importa o Error Boundary personalizado.
// Este componente captura erros na árvore de componentes filhos e exibe uma UI de fallback.
import ErrorBoundary from './src/components/ErrorBoundary';

// Importa o provedor e hook unificado de usuário.
// O UserProvider fornece o contexto unificado de autenticação e gerenciamento de papéis para toda a aplicação.
import { UserProvider, useUser } from './src/context/UserContext';

// Importa o provedor de autenticação.
// O AuthProvider fornece o contexto de autenticação para a aplicação.
import { AuthProvider } from './src/context/AuthContext';

// Importa o componente de navegação principal.
// Este componente gerencia todas as rotas e navegação da aplicação.
import AppNavigation from './src/navigation/AppNavigation';

// --- Lógica de Splash Screen e Navegação ---
// Esta seção contém a lógica para gerenciar a exibição da Splash Screen e inicialização da navegação.

/*
 * Componente interno para encapsular a lógica que depende do UserProvider.
 * Este componente gerencia o estado de carregamento da aplicação e controla a exibição da Splash Screen.
 */
const AppInner: React.FC = () => {
  // Obtém o estado de carregamento do contexto unificado de usuário
  const { isLoading } = useUser();
  // Estado para controlar quando a aplicação está pronta para ser exibida
  const [isAppReady, setIsAppReady] = useState(false);
  // Referência para o componente View raiz, usado para detectar quando o layout está pronto
  const rootRef = useRef<View>(null);

  useEffect(() => {
    // Define a função async para esconder a splash screen.
    // Esta função é chamada quando o contexto de usuário foi carregado e a aplicação está pronta
    const hideSplash = async () => {
      if (!isLoading && isAppReady) {
        try {
          // Esconde a Splash Screen quando tudo estiver pronto
          await SplashScreen.hideAsync();
          // console.log("UserProvider carregado e App pronto, Splash Screen escondida.");
        } catch (e) {
          // console.warn("Erro ao esconder a Splash Screen:", e);
        }
      }
    };

    // Chama a função async e trata a Promise retornada pela própria chamada.
    // Captura e loga qualquer erro que ocorra durante o processo
    hideSplash().catch(err => {/* console.warn('[App.tsx] Erro ao chamar hideSplash:', err) */});

  }, [isLoading, isAppReady]); // Executa o efeito quando o estado de carregamento do usuário ou de prontidão da app mudar

  // Função de callback executada quando o layout da View raiz é calculado
  const onLayoutRootView = useCallback(() => {
    if (rootRef.current) {
      // console.log("Layout raiz renderizado e medido.");
      // Marca a aplicação como pronta para ser exibida
      setIsAppReady(true);
    }
  }, []);

  // Se a aplicação não estiver pronta ou o contexto de usuário ainda estiver carregando,
  // exibe uma View vazia que serve como placeholder enquanto aguarda
  if (!isAppReady || isLoading) {
    // console.log(`Aguardando para exibir o app... App Pronto: ${isAppReady}, User Carregando: ${isLoading}`);
    return (
      <View
        ref={rootRef}
        style={styles.rootViewContainer}
        onLayout={onLayoutRootView}
      >
        {/* Adicionando um componente Text para garantir que qualquer texto seja renderizado corretamente */}
        <Text style={{ display: 'none' }}>Carregando...</Text>
      </View>
    );
  }

  // Quando tudo estiver pronto, renderiza o componente de navegação principal
  return <AppNavigation />;
};

// --- Componente Raiz Principal ---
// Esta seção contém o componente principal da aplicação que inicializa todos os provedores e configurações

/*
 * Componente raiz principal da aplicação (App).
 * Configura Error Boundary, AuthProvider e gerencia a Splash Screen inicial.
 * Este é o ponto de entrada da aplicação que configura todo o ambiente necessário.
 */
const App: React.FC = () => {

  useEffect(() => {
    // Define a função async para prevenir o auto-hide.
    // Esta função impede que a Splash Screen seja automaticamente escondida pelo Expo
    const preventHide = async () => {
      try {
        // Impede que a Splash Screen seja escondida automaticamente
        await SplashScreen.preventAutoHideAsync();
        // console.log("Splash Screen prevenida de auto-hide.");
      } catch (e) {
        // console.warn("Erro ao prevenir o auto-hide da Splash Screen:", e);
      }
    };

    // Chama a função async e trata a Promise retornada pela própria chamada.
    // Captura e loga qualquer erro que ocorra durante o processo
    preventHide().catch(err => {/* console.warn('[App.tsx] Erro ao chamar preventHide:', err) */});
  }, []); // Array de dependências vazio significa que este efeito só é executado uma vez, na montagem do componente

  return (
    <ErrorBoundary>
      <UserProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </UserProvider>
    </ErrorBoundary>
  );
};

// Definição dos estilos utilizados na aplicação
const styles = StyleSheet.create({
  // Estilo para o container raiz que ocupa toda a tela
  rootViewContainer: {
    flex: 1, // Faz com que o componente ocupe todo o espaço disponível
  },
});

/*
 * Exporta o componente 'App' como padrão.
 * NOTA: O aviso "Unused 'default' export" do linter pode ser um falso positivo
 * para o arquivo 'App'.tsx raiz em projetos React Native/Expo, pois ele é
 * usado pela estrutura do 'framework' para iniciar o 'app'.
 * 
 * Este é o ponto de entrada principal que o Expo/React Native utiliza para
 * inicializar a aplicação no dispositivo.
 */
export default App;
