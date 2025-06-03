// frontend/mobile/index.tsx
// Arquivo de entrada principal para o aplicativo móvel
// Este arquivo importa o componente App e o registra como componente raiz usando a função do Expo

import { registerRootComponent } from 'expo'; // Importa a função registerRootComponent do pacote expo
import App from './App'; // Importa o componente App do arquivo App.tsx

// Registra o componente App como o componente raiz do aplicativo
// Isso faz com que o App seja o ponto de entrada da aplicação
registerRootComponent(App);
