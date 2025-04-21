// Importa o polyfill necessário no topo
import 'react-native-gesture-handler';

// Importa React
import React from 'react';

// Importa o provedor de autenticação que já convertemos
// Ajuste o caminho se o AuthContext.tsx não estiver em ./src/context/
import { AuthProvider } from './src/context/AuthContext';

// Importa o componente de navegação principal que já convertemos
// Ajuste o caminho se o AppNavigation.tsx não estiver em ./src/navigation/
import AppNavigation from './src/navigation/AppNavigation';

// Não precisamos mais importar telas individuais ou criar o Stack aqui,
// pois isso é gerenciado dentro de AppNavigation.tsx

/**
 * Componente raiz principal da aplicação.
 * Configura os provedores globais (AuthProvider) e renderiza
 * a estrutura de navegação principal (AppNavigation).
 */
const App: React.FC = () => { // Tipando como um Functional Component
  return (
    // 1. Provedor de Autenticação envolve toda a aplicação
    <AuthProvider>
      {/* 2. Renderiza o componente de Navegação Principal */}
      {/* AppNavigation contém o NavigationContainer e a lógica do StackNavigator */}
      <AppNavigation />
    </AuthProvider>
  );
};

export default App;