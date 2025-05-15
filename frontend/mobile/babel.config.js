module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // Configuração para projetos Expo
    plugins: [
      'react-native-reanimated/plugin', // Plugin necessário para animações/reanimated
      [
        'module-resolver', // Plugin para resolver path aliases
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src'
          }
        }
      ]
    ]
  };
};
