// Importações de bibliotecas React e React Native
import React, { useState, useRef } from 'react';
import { 
  View,  // Componente de container básico
  Text,  // Componente para exibir texto
  StyleSheet,  // API para criar estilos
  Image,  // Componente para exibir imagens
  TouchableOpacity,  // Componente para áreas clicáveis
  Dimensions,  // API para obter dimensões da tela
  FlatList,  // Componente de lista otimizada
  Animated  // API para criar animações
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';  // Biblioteca de ícones
import type { NativeStackScreenProps } from '@react-navigation/native-stack';  // Tipos para navegação
import { RootStackParamList } from "@/navigation/types";  // Tipos de rotas da aplicação

// Define o tipo das props da tela
type OnboardingScreenProps = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Dados das telas de onboarding - Array com informações de cada slide
const onboardingData = [
  {
    id: '1', // Identificador único do slide
    title: 'Bem-vindo ao App', // Título principal do slide
    description: 'Conectando compradores e prestadores de serviços em uma plataforma única e intuitiva.', // Descrição detalhada
    icon: 'home' as keyof typeof MaterialIcons.glyphMap, // Ícone do Material Icons para representar o conceito
    iconColor: '#4A90E2', // Cor do ícone (azul)
    backgroundColor: '#E3F2FD', // Cor de fundo do slide (azul claro)
  },
  {
    id: '2',
    title: 'Encontre Serviços',
    description: 'Busque e contrate os melhores profissionais para atender suas necessidades.',
    icon: 'search' as keyof typeof MaterialIcons.glyphMap, // Ícone de busca
    iconColor: '#50C878', // Cor do ícone (verde)
    backgroundColor: '#E8F5E9', // Cor de fundo do slide (verde claro)
  },
  {
    id: '3',
    title: 'Ofereça seus Serviços',
    description: 'Cadastre suas habilidades e encontre clientes interessados em seu trabalho.',
    icon: 'build' as keyof typeof MaterialIcons.glyphMap, // Ícone de ferramentas
    iconColor: '#FF8C00', // Cor do ícone (laranja)
    backgroundColor: '#FFF3E0', // Cor de fundo do slide (laranja claro)
  },
];

/**
 * Tela de Onboarding exibida para novos usuários ou após logout.
 * Apresenta as principais funcionalidades do app em um carrossel.
 * Esta tela permite que os usuários conheçam os recursos principais do aplicativo
 * antes de começar a usá-lo.
 * 
 * Funcionalidades:
 * - Carrossel de slides com animações suaves
 * - Indicadores de página animados
 * - Botão para pular a introdução
 * - Botão para avançar ou finalizar o onboarding
 * - Adaptação automática às dimensões da tela
 */
export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  // Estado para controlar o índice do slide atual
  const [currentIndex, setCurrentIndex] = useState(0);

  // Referência para acessar o componente FlatList diretamente
  const flatListRef = useRef<FlatList>(null);

  // Valor animado para rastrear a posição de rolagem horizontal
  const scrollX = useRef(new Animated.Value(0)).current;

  // Função para avançar para o próximo slide
  const goToNextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Se estiver no último slide, navega para a tela de login
      navigation.navigate({
        name: 'Login',
        params: {}
      });
    }
  };

  // Função para pular o onboarding e ir direto para o login
  const skipOnboarding = () => {
    navigation.navigate({
      name: 'Login',
      params: {}
    });
  };

  // Renderiza cada slide do onboarding com ícone, título e descrição
  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => {
    return (
      <View 
        style={[
          styles.slide, 
          { backgroundColor: item.backgroundColor }
        ]}
      >
        {/* Container do ícone com fundo semi-transparente */}
        <View style={styles.iconContainer}>
          <MaterialIcons 
            name={item.icon} 
            size={100} 
            color={item.iconColor} 
          />
        </View>
        {/* Título do slide */}
        <Text style={styles.title}>{item.title}</Text>
        {/* Descrição detalhada do recurso */}
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  // Renderiza os indicadores de página (bolinhas) que mostram a posição atual no carrossel
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          // Define o intervalo de entrada para animação baseado na posição de cada slide
          const inputRange = [
            (index - 1) * Dimensions.get('window').width,
            index * Dimensions.get('window').width,
            (index + 1) * Dimensions.get('window').width,
          ];

          // Anima a largura do indicador - fica maior quando está no slide atual
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });

          // Anima a opacidade do indicador - fica mais opaco quando está no slide atual
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                { width: dotWidth, opacity },
                index === currentIndex ? styles.paginationDotActive : {},
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Botão de pular no canto superior direito */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={skipOnboarding}
      >
        <Text style={styles.skipButtonText}>Pular</Text>
      </TouchableOpacity>

      {/* Carrossel de slides - Exibe os slides de onboarding em formato horizontal */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          // Calcula o índice do slide atual com base na posição de rolagem
          const index = Math.round(
            event.nativeEvent.contentOffset.x / Dimensions.get('window').width
          );
          setCurrentIndex(index);
        }}
      />

      {/* Indicadores de página e botão de próximo - Seção de rodapé fixa na parte inferior da tela */}
      <View style={styles.footer}>
        {/* Exibe os indicadores de página (bolinhas) */}
        {renderPagination()}

        {/* Botão para avançar para o próximo slide ou finalizar o onboarding */}
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={goToNextSlide}
        >
          {/* Texto do botão muda para "Começar" no último slide */}
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? 'Começar' : 'Próximo'}
          </Text>
          {/* Ícone do botão muda para "login" no último slide */}
          <MaterialIcons 
            name={currentIndex === onboardingData.length - 1 ? 'login' as keyof typeof MaterialIcons.glyphMap : 'arrow-forward' as keyof typeof MaterialIcons.glyphMap} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Estilos para todos os componentes da tela
const styles = StyleSheet.create({
  // Container principal que ocupa toda a tela
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  // Botão de pular no canto superior direito
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1, // Garante que fique acima de outros elementos
    padding: 10,
  },
  // Texto do botão de pular
  skipButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  // Estilo de cada slide individual
  slide: {
    width: Dimensions.get('window').width, // Largura igual à largura da tela
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  // Container circular para o ícone de cada slide
  iconContainer: {
    width: Dimensions.get('window').width * 0.7, // 70% da largura da tela
    height: Dimensions.get('window').width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Fundo semi-transparente
  },
  // Estilo do título de cada slide
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Estilo da descrição de cada slide
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24, // Espaçamento entre linhas para melhor legibilidade
  },
  // Container do rodapé fixo na parte inferior
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Container dos indicadores de página (bolinhas)
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Estilo base para cada indicador de página
  paginationDot: {
    height: 10,
    borderRadius: 5, // Formato circular
    backgroundColor: '#333',
    marginHorizontal: 5,
  },
  // Estilo adicional para o indicador da página ativa
  paginationDotActive: {
    backgroundColor: '#4A90E2', // Azul para destacar o slide atual
  },
  // Botão de próximo/começar
  nextButton: {
    backgroundColor: '#4A90E2', // Azul
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30, // Formato arredondado
  },
  // Texto do botão de próximo/começar
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8, // Espaço entre o texto e o ícone
  },
});
