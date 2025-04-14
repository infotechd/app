import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

// Importa componentes temáticos para garantir a consistência do design (suporte a temas claro/escuro)
import { ThemedText } from '@/src/components/ThemedText';
import { ThemedView } from '@/src/components/ThemedView';

/**
 * NotFoundScreen – Tela de "Não Encontrado"
 * Exibe uma mensagem de erro indicando que a tela solicitada não existe,
 * e fornece um link para redirecionar o usuário para a tela inicial.
 */
export default function NotFoundScreen() {
  return (
    <>
      {/* Configura o título da barra de navegação para essa tela */}
      <Stack.Screen options={{ title: 'Oops!' }} />
      
      {/* Container principal utilizando o componente temático para manter a consistência visual */}
      <ThemedView style={styles.container}>
        {/* Mensagem principal informando que a tela não existe */}
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        
        {/* Link para redirecionar o usuário para a tela inicial */}
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

// Definição de estilos para a tela "Not Found"
const styles = StyleSheet.create({
  container: {
    flex: 1,               // Ocupa todo o espaço disponível
    alignItems: 'center',  // Alinha os elementos horizontalmente ao centro
    justifyContent: 'center', // Centraliza os elementos verticalmente
    padding: 20,           // Espaçamento interno para conforto visual
  },
  link: {
    marginTop: 15,         // Espaço acima do link para separação dos elementos
    paddingVertical: 15,   // Espaçamento vertical para tornar o link mais clicável
  },
});
