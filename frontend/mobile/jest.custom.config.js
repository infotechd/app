// Configuração personalizada do Jest que não depende do preset jest-expo
// Este arquivo define a configuração do Jest para testes de componentes React Native
module.exports = {
  // Usa jsdom para testar componentes React
  // O jsdom simula um ambiente de navegador para testes de componentes React
  testEnvironment: 'jsdom',

  // Define caminhos a serem ignorados durante os testes
  // Estes diretórios não serão considerados ao executar testes
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],

  // Permite transformação de node_modules específicos
  // Esta configuração é necessária para que o Jest possa processar corretamente módulos do React Native
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native/.*|@react-native\\/js-polyfills|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@expo-google-fonts/.*|victory-.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|app-common|socket.io-client|engine.io-client|socket.io-parser|@socket.io/component-emitter|@testing-library/react-native)'
  ],

  // Transforma arquivos JS/TS com babel-jest
  // Define como os arquivos JavaScript e TypeScript serão processados pelo Jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Extensões de arquivo a serem consideradas
  // Lista de extensões que o Jest reconhecerá como módulos válidos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Aliases de caminho e mocks de módulos
  // Configura atalhos para importações e substitui módulos reais por versões simuladas para teste
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native/js-polyfills/error-guard': '<rootDir>/__mocks__/error-guard-mock.js',
    'expo-modules-core': '<rootDir>/__mocks__/expo-modules-core.js',
    '@expo/vector-icons': '<rootDir>/__mocks__/@expo/vector-icons.js'
  },

  // Arquivos de configuração que são executados antes dos testes
  // Estes arquivos configuram o ambiente de teste antes da execução
  setupFiles: [
    '<rootDir>/jest.custom.setup.js'
  ],

  // Arquivos de configuração que são executados após o ambiente ser configurado
  // Estes arquivos estendem as funcionalidades do ambiente de teste
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect'
  ],

  // Configuração de tempos limite para testes
  // Aumenta o tempo limite para testes assíncronos
  testTimeout: 30000,

  // Configuração para lidar com avisos de act()
  // Isso ajuda a resolver problemas com atualizações de estado assíncronas em testes
  globals: {
    IS_REACT_ACT_ENVIRONMENT: true,
  },
};
