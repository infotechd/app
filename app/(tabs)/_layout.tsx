// Importa o componente Tabs do expo-router para gerenciar a navegação por abas
import { Tabs } from 'expo-router';
import React from 'react';
// Importa o objeto Platform para definir estilos específicos para cada plataforma
import { Platform } from 'react-native';

// Importa componentes personalizados e constantes
import { HapticTab } from '@/src/components/HapticTab';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import TabBarBackground from '@/src/components/ui/TabBarBackground';
import { Colors } from '@/src/constants/Colors';
// Hook customizado para obter o esquema de cores (light/dark)
import { useColorScheme } from '@/src/hooks/useColorScheme';

/**
 * TabLayout – Componente responsável pelo layout de abas do aplicativo.
 * Configura as opções das abas, incluindo ícones, estilo da barra e comportamento em cada plataforma.
 */
export default function TabLayout() {
  // Obtém o esquema de cores (light ou dark) para adaptar a UI
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // Define a cor ativa das abas de acordo com o esquema de cores
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Oculta o cabeçalho padrão para uma navegação mais limpa
        headerShown: false,
        // Utiliza um botão customizado com feedback háptico para as abas
        tabBarButton: HapticTab,
        // Define um fundo customizado para a barra de abas
        tabBarBackground: TabBarBackground,
        // Configura o estilo da barra de abas de forma diferente para iOS e outras plataformas
        tabBarStyle: Platform.select({
          ios: {
            // Em iOS, posiciona a barra de forma absoluta para permitir efeitos de blur
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      {/* Define a primeira aba: Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          // Define o ícone da aba utilizando o componente IconSymbol
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      {/* Define a segunda aba: Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          // Ícone customizado para a aba Explore
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
