// jest.ci.config.js - Configuração para testes em ambiente de Integração Contínua (CI)
module.exports = {
  // Usa o preset jest-expo para React Native - Define as configurações básicas para testes em aplicações React Native com Expo
  preset: 'jest-expo',
  testEnvironment: 'jsdom',

  // Padrões para localizar arquivos de teste - Define quais arquivos serão reconhecidos como testes
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],

  // Configura padrões de transformação para lidar com módulos React Native e Expo - Especifica quais módulos node_modules não devem ser transformados
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native/.*|@react-native\\/js-polyfills|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@expo-google-fonts/.*|victory-.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|app-common|socket.io-client|engine.io-client|socket.io-parser|@socket.io/component-emitter|@testing-library/react-native)'
  ],

  // Transforma arquivos - Define como os diferentes tipos de arquivos serão processados pelo Jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Configura extensões de módulos - Lista as extensões de arquivo que o Jest deve reconhecer
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Configura aliases de caminhos (@/*) e mocks de módulos - Define mapeamentos para facilitar importações e substituir módulos por versões simuladas
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native/js-polyfills/error-guard': '<rootDir>/__mocks__/error-guard-mock.js',
    'expo-modules-core': '<rootDir>/__mocks__/expo-modules-core.js'
  },

  // Arquivos a serem executados antes de qualquer teste - Configura o ambiente antes da execução dos testes
  setupFiles: ['./jest.setup.pre.js'],

  // Usa arquivos de configuração - Arquivos que serão executados após o ambiente de teste ser configurado
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
};
