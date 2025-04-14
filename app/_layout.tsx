import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated'; // Importa o módulo para ativar animações reanimadas

// Importa o hook customizado que retorna o esquema de cores atual (claro ou escuro)
import { useColorScheme } from '@/src/hooks/useColorScheme';

// Previne que a splash screen seja ocultada automaticamente
// Isso garante que a tela de splash permaneça visível até que os assets (como fontes) estejam carregados
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Obtém o esquema de cores atual (light ou dark) para configurar o tema
  const colorScheme = useColorScheme();

  // Carrega a fonte customizada "SpaceMono" a partir da pasta de assets
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // useEffect para ocultar a splash screen quando as fontes estiverem carregadas
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Enquanto a fonte não estiver carregada, não renderiza nada
  if (!loaded) {
    return null;
  }

  return (
    // O ThemeProvider aplica o tema (claro ou escuro) de acordo com o esquema de cores atual
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Stack é utilizado para gerenciar a navegação entre telas utilizando o expo-router */}
      <Stack>
        {/* Tela de abas (tabs) com header oculto */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Tela de fallback para rotas não encontradas */}
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* StatusBar que se ajusta automaticamente ao tema */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
