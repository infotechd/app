import { Image, StyleSheet, Platform } from 'react-native';
import React from 'react';

// Importa componentes customizados do design system do app
import { HelloWave } from '@/src/components/HelloWave';
import ParallaxScrollView from '@/src/components/ParallaxScrollView';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';

/**
 * HomeScreen – Tela principal (Home) do app.
 *
 * Esta tela utiliza o ParallaxScrollView para criar um efeito visual de parallax no header.
 * Exibe um logotipo, um título de boas-vindas, e instruções organizadas em três etapas:
 *  - Step 1: Instrução para editar a tela de home.
 *  - Step 2: Dica para explorar a aba "Explore".
 *  - Step 3: Instrução para resetar o projeto.
 *
 * A exibição das instruções utiliza Platform.select para adaptar os atalhos de teclado conforme a plataforma (iOS, Android e Web).
 */
export default function HomeScreen() {
  return (
    <ParallaxScrollView
      // Define cores de fundo para o header para modos claro e escuro
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      // Define a imagem do header, utilizando um componente Image com uma imagem estática local
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Container para o título e o componente de animação HelloWave */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      {/* Container para o Step 1: Instrução para editar a tela */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      
      {/* Container para o Step 2: Dica para explorar a aba "Explore" */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      
      {/* Container para o Step 3: Instrução para resetar o projeto */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

// Estilos utilizados na tela
const styles = StyleSheet.create({
  // Container do título, alinhado horizontalmente e com espaçamento
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Estilo para os containers de cada etapa (steps)
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  // Estilo para a imagem do logotipo do React com efeito parallax
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
