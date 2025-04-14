import { StyleSheet, Image, Platform } from 'react-native';
import React from 'react';

// Importa componentes personalizados utilizados na tela de explore
import { Collapsible } from '@/src/components/Collapsible';
import { ExternalLink } from '@/src/components/ExternalLink';
import ParallaxScrollView from '@/src/components/ParallaxScrollView';
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';
import { IconSymbol } from '@/src/components/ui/IconSymbol';

/**
 * TabTwoScreen – Tela de Explore.
 * Esta tela utiliza um efeito parallax para o header e organiza o conteúdo em seções
 * colapsáveis, permitindo que o usuário visualize informações sobre roteamento, suporte
 * multiplataforma, imagens, fontes, temas claro/escuro e animações.
 */
export default function TabTwoScreen() {
  return (
    // ParallaxScrollView é usado para criar um efeito parallax na imagem de header
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      // headerImage é definido com um ícone customizado utilizando o componente IconSymbol
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      {/* Container para o título */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>
      
      {/* Texto informativo sobre a estrutura do app */}
      <ThemedText>
        Este app inclui exemplo de código para ajudar você a começar.
      </ThemedText>
      
      {/* Seção colapsável sobre File-based routing */}
      <Collapsible title="File-based routing">
        <ThemedText>
          Este app possui duas telas:{' '}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/index.tsx
          </ThemedText>{' '}
          e{' '}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/explore.tsx
          </ThemedText>
        </ThemedText>
        <ThemedText>
          O arquivo de layout em{' '}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/_layout.tsx
          </ThemedText>{' '}
          configura o navegador de abas.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Saiba mais</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      {/* Seção colapsável sobre suporte para Android, iOS e Web */}
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          Você pode abrir este projeto no Android, iOS e na web. Para abrir a versão web, pressione{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> no terminal.
        </ThemedText>
      </Collapsible>
      
      {/* Seção colapsável sobre imagens */}
      <Collapsible title="Images">
        <ThemedText>
          Para imagens estáticas, use os sufixos{' '}
          <ThemedText type="defaultSemiBold">@2x</ThemedText> e{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> para diferentes densidades de tela.
        </ThemedText>
        {/* Exibe uma imagem local, utilizando o require com o caminho configurado */}
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Saiba mais</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      {/* Seção colapsável sobre fontes customizadas */}
      <Collapsible title="Custom fonts">
        <ThemedText>
          Abra <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> para ver como carregar{' '}
          <ThemedText style={{ fontFamily: 'SpaceMono' }}>
            fontes customizadas como esta.
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Saiba mais</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      {/* Seção colapsável sobre suporte a temas claro e escuro */}
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          Este template suporta os modos claro e escuro. O hook{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> permite verificar
          o tema atual do usuário e ajustar as cores da interface.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Saiba mais</ThemedText>
        </ExternalLink>
      </Collapsible>
      
      {/* Seção colapsável sobre animações */}
      <Collapsible title="Animations">
        <ThemedText>
          Este template inclui um exemplo de componente animado. O componente{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> utiliza a biblioteca{' '}
          <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText> para criar uma animação de saudação.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              O componente <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText> oferece um efeito parallax para a imagem do header.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  // Estilo para a imagem do header com efeito parallax
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  // Container para o título
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
