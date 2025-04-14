// jest.config.js
module.exports = {
  // Define o preset para projetos Expo, o que já configura transformações e outras opções para testar apps React Native/Expo
  preset: 'jest-expo',

  // Caso você use TypeScript ou precise de configurações específicas para iOS/Android,
  // pode ajustar o preset conforme os comentários abaixo:
  // preset: "jest-expo/ios", "jest-expo/android", ...
  // ou utilizar "ts-jest" se necessário

  // Define padrões de caminhos que serão ignorados pelos testes, como as pastas node_modules e as pastas específicas de plataformas nativas
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],

  // Configura transformIgnorePatterns para permitir que módulos específicos dentro de node_modules sejam transformados pelo Babel,
  // isso é útil para pacotes que precisam ser compilados para funcionar com Jest, como alguns módulos do React Native e do Expo
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|react-clone-referenced-element|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|victory-.*))'
  ],
};
