// Importa o polyfill necessário no topo do arquivo.
import 'react-native-gesture-handler';

// Importa React e hooks/componentes necessários.
import React, { useEffect, useCallback, useState, useRef } from 'react';
// ATENÇÃO: Importe apenas os componentes que você realmente usa. 'Text' foi removido.
import { View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Importa o Error Boundary personalizado.
// VERIFIQUE: Certifique-se de que o caminho para ErrorBoundary está correto.
//import ErrorBoundary from './src/components/ErrorBoundary';

// Importa o provedor e o hook de autenticação.
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Importa o componente de navegação principal.
import AppNavigation from './src/navigation/AppNavigation';

// --- Lógica de Splash Screen e Navegação ---

/*
 * Componente interno para encapsular a lógica que depende do AuthProvider.
 */
const AppInner: React.FC = () => {
  const { isLoading: isAuthLoading } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);
  const rootRef = useRef<View>(null);

  useEffect(() => {
    // Define a função async para esconder a splash screen.
    const hideSplash = async () => {
      if (!isAuthLoading && isAppReady) {
        try {
          await SplashScreen.hideAsync();
          console.log("AuthProvider carregado e App pronto, Splash Screen escondida.");
        } catch (e) {
          console.warn("Erro ao esconder a Splash Screen:", e);
        }
      }
    };

    // Chama a função async e trata a Promise retornada pela própria chamada.
    hideSplash().catch(err => console.warn('[App.tsx] Erro ao chamar hideSplash:', err));

  }, [isAuthLoading, isAppReady]);

  const onLayoutRootView = useCallback(() => {
    if (rootRef.current) {
      console.log("Layout raiz renderizado e medido.");
      setIsAppReady(true);
    }
  }, []);

  if (!isAppReady || isAuthLoading) {
    console.log(`Aguardando para exibir o app... App Pronto: ${isAppReady}, Auth Carregando: ${isAuthLoading}`);
    return (
      <View
        ref={rootRef}
        style={styles.rootViewContainer}
        onLayout={onLayoutRootView}
      />
    );
  }

  return <AppNavigation />;
};

// --- Componente Raiz Principal ---

/*
 * Componente raiz principal da aplicação (App).
 * Configura Error Boundary, AuthProvider e gerencia a Splash Screen inicial.
 */
const App: React.FC = () => {

  useEffect(() => {
    // Define a função async para prevenir o auto-hide.
    const preventHide = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        console.log("Splash Screen prevenida de auto-hide.");
      } catch (e) {
        console.warn("Erro ao prevenir o auto-hide da Splash Screen:", e);
      }
    };

    // Chama a função async e trata a Promise retornada pela própria chamada.
    preventHide().catch(err => console.warn('[App.tsx] Erro ao chamar preventHide:', err));
  }, []);

  return (
 //   <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
 //    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  rootViewContainer: {
    flex: 1,
  },
});

/*
 * Exporta o componente 'App' como padrão.
 * NOTA: O aviso "Unused 'default' export" do linter pode ser um falso positivo
 * para o arquivo 'App'.tsx raiz em projetos React Native/Expo, pois ele é
 * usado pela estrutura do 'framework' para iniciar o 'app'.
 */
export default App;