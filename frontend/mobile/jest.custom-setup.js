// Este arquivo é uma configuração personalizada para o Jest que contorna a configuração padrão do React Native
// Ele fornece os mocks necessários para componentes e APIs do React Native
// Um mock é uma simulação de um componente ou função real para fins de teste

// Mock de componentes e APIs do React Native
// Aqui criamos uma versão simulada do objeto ErrorUtils que existe no React Native
global.ErrorUtils = {
  setGlobalHandler: jest.fn(),  // Função simulada para definir um manipulador global de erros
  getGlobalHandler: jest.fn(),  // Função simulada para obter o manipulador global de erros
  reportError: jest.fn(),       // Função simulada para reportar erros
  reportFatalError: jest.fn(),  // Função simulada para reportar erros fatais
};

// Inclui a configuração existente
// Importa o arquivo jest.setup.js para aproveitar suas configurações
require('./jest.setup.js');
