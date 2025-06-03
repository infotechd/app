// Arquivo de configuração personalizada do Jest que combina as funcionalidades de jest.setup.pre.js e jest.setup.js
// Este arquivo configura o ambiente de teste com todos os mocks necessários para simular componentes e APIs do React Native

// Mock do objeto global expo antes de qualquer outra coisa
// Simula o objeto expo que é usado em aplicações React Native com Expo
global.expo = {
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),      // Função simulada para adicionar ouvintes de eventos
    removeListener: jest.fn(),   // Função simulada para remover ouvintes de eventos
    emit: jest.fn()              // Função simulada para emitir eventos
  })),
  NativeModule: jest.fn(),       // Simulação de módulo nativo
  SharedObject: jest.fn(),       // Simulação de objeto compartilhado
  SharedRef: jest.fn(),          // Simulação de referência compartilhada
};

// Mock das utilidades de erro do React Native
// Simula o objeto ErrorUtils que lida com erros no React Native
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),   // Função simulada para definir um manipulador global de erros
  getGlobalHandler: jest.fn(),   // Função simulada para obter o manipulador global de erros
  reportError: jest.fn(),        // Função simulada para reportar erros
  reportFatalError: jest.fn(),   // Função simulada para reportar erros fatais
};

// Mock do módulo completo @react-native/js-polyfills e seus submódulos
// Substitui o módulo real por uma versão simulada para testes
jest.mock('@react-native/js-polyfills', () => ({
  ErrorUtils: global.ErrorUtils,
}), { virtual: true });

// Mock específico do módulo error-guard
// Substitui o módulo de guarda de erro por uma versão simulada
jest.mock('@react-native/js-polyfills/error-guard', () => ({
  ErrorUtils: global.ErrorUtils,
}), { virtual: true });

// Polyfills (implementações de funcionalidades que podem não estar disponíveis no ambiente de teste)
// Adiciona funções e objetos necessários para o ambiente de teste
global.fetch = require('node-fetch');                 // Implementação de fetch para Node.js
global.TextEncoder = require('util').TextEncoder;     // Codificador de texto
global.TextDecoder = require('util').TextDecoder;     // Decodificador de texto
global.URL = require('url').URL;                      // Implementação de URL
global.URLSearchParams = require('url').URLSearchParams; // Implementação de parâmetros de busca URL

// Polyfill para animações
// Simula as funções de quadros de animação usando setTimeout
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Polyfill para setImmediate
// Simula a função setImmediate usando setTimeout
global.setImmediate = jest.fn((fn, ...args) => setTimeout(fn, 0, ...args));

// Mock dos componentes e APIs do React Native
// Substitui os componentes e APIs reais do React Native por versões simuladas para testes
jest.mock('react-native', () => ({
  // Componentes
  View: 'View',                  // Componente básico de visualização
  Text: 'Text',                  // Componente de texto
  FlatList: 'FlatList',          // Componente de lista
  TouchableOpacity: 'TouchableOpacity', // Componente tocável com efeito de opacidade
  StyleSheet: {
    create: jest.fn(styles => styles), // Função simulada para criar estilos
    flatten: jest.fn(style => style),  // Função simulada para achatar estilos
  },
  ActivityIndicator: 'ActivityIndicator', // Indicador de atividade (loading)
  ScrollView: 'ScrollView',      // Visualização com rolagem
  RefreshControl: 'RCTRefreshControl', // Controle de atualização
  Modal: 'Modal',                // Componente modal
  Pressable: 'Pressable',        // Componente pressionável
  Image: 'Image',                // Componente de imagem
  TextInput: 'TextInput',        // Campo de entrada de texto
  Button: 'Button',              // Botão
  SafeAreaView: 'SafeAreaView',  // Visualização segura (evita notch e barras de sistema)
  KeyboardAvoidingView: 'KeyboardAvoidingView', // Visualização que evita o teclado
  Platform: {
    OS: 'ios',                   // Sistema operacional simulado
    select: jest.fn(obj => obj.ios), // Função para selecionar valor baseado na plataforma
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })), // Dimensões simuladas da tela
  },
  Animated: {
    View: 'Animated.View',       // Componente de visualização animada
    createAnimatedComponent: jest.fn(component => component), // Cria componente animado
    timing: jest.fn(),           // Animação baseada em tempo
    spring: jest.fn(),           // Animação com efeito de mola
    Value: jest.fn(() => ({
      setValue: jest.fn(),       // Define valor da animação
      interpolate: jest.fn(),    // Interpola valores da animação
    })),
  },

  // APIs
  Alert: {
    alert: jest.fn(),            // Função de alerta simulada
  },
  Linking: {
    openURL: jest.fn(),          // Função simulada para abrir URLs
  },
}));

// Mock do AsyncStorage
// Simula o armazenamento assíncrono usado em React Native
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),            // Função simulada para obter item
  setItem: jest.fn(),            // Função simulada para definir item
  removeItem: jest.fn(),         // Função simulada para remover item
  clear: jest.fn(),              // Função simulada para limpar armazenamento
}));

// Mock da navegação
// Simula a navegação do React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'), // Mantém implementações reais
  useNavigation: () => ({
    navigate: jest.fn(),         // Função simulada para navegar entre telas
  }),
}));

// Mock dos módulos Expo
// Simula os módulos principais do Expo
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),      // Função simulada para adicionar ouvintes
    removeListener: jest.fn(),   // Função simulada para remover ouvintes
    emit: jest.fn()              // Função simulada para emitir eventos
  })),
  NativeModule: jest.fn(),       // Simulação de módulo nativo
  SharedObject: jest.fn(),       // Simulação de objeto compartilhado
  SharedRef: jest.fn(),          // Simulação de referência compartilhada
}));

// Mock dos ícones do Expo
// Simula os pacotes de ícones disponíveis no Expo usando componentes React que retornam null
// Isso segue a recomendação do README-Jest-Configuration-Update.md
const React = require('react');

// Função para criar componentes de ícones mockados
const createMockIconComponent = (displayName) => {
  const MockComponent = () => null;
  MockComponent.displayName = displayName;
  return MockComponent;
};

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: createMockIconComponent('MaterialIcons'),
  Ionicons: createMockIconComponent('Ionicons'),
  FontAwesome: createMockIconComponent('FontAwesome'),
  FontAwesome5: createMockIconComponent('FontAwesome5'),
  AntDesign: createMockIconComponent('AntDesign'),
  Entypo: createMockIconComponent('Entypo'),
  Feather: createMockIconComponent('Feather'),
  MaterialCommunityIcons: createMockIconComponent('MaterialCommunityIcons'),
  Octicons: createMockIconComponent('Octicons'),
  SimpleLineIcons: createMockIconComponent('SimpleLineIcons'),
  Fontisto: createMockIconComponent('Fontisto'),
  EvilIcons: createMockIconComponent('EvilIcons'),
  Foundation: createMockIconComponent('Foundation'),
  Zocial: createMockIconComponent('Zocial'),
}));
