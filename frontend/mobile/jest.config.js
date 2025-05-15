// jest.config.js
module.exports = {
  // Configuração para testes React Native com TypeScript
  preset: 'jest-expo',
  testEnvironment: 'node',

  // Define padrões de caminhos que serão ignorados pelos testes, como as pastas node_modules e as pastas específicas de plataformas nativas
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],

  // Configura transformIgnorePatterns para permitir que módulos específicos dentro de node_modules sejam transformados pelo Babel,
  // isso é útil para pacotes que precisam ser compilados para funcionar com Jest, como alguns módulos do React Native e do Expo
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|victory-.*|@react-native/js-polyfills|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*|app-common))'
  ],

  // Configuração para transformar arquivos TypeScript
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Configuração para módulos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Configuração para path aliases (@/*)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Configuração para setup de testes
  // Usando os matchers embutidos em @testing-library/react-native v12.4+
  // e nosso arquivo de setup personalizado
  setupFilesAfterEnv: ['./jest.custom-setup.js'],
};
