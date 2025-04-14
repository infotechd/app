module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // Configuração para projetos Expo
    plugins: ['react-native-reanimated/plugin'], // Plugin necessário para animações/reanimated
  };
};