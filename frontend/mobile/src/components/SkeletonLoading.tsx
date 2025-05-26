import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

interface SkeletonLoadingProps {
  count?: number;
}

/**
 * Componente que exibe um esqueleto de carregamento para as ofertas
 * Mostra uma animação de shimmer para indicar que o conteúdo está carregando
 */
const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({ count = 5 }) => {
  // Referência para a animação do shimmer
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Efeito para iniciar a animação do shimmer
  useEffect(() => {
    // Função para animar o shimmer em loop
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800, // Duração um pouco maior para um efeito mais suave
          useNativeDriver: false,
          // Não podemos usar easing aqui pois não temos acesso ao Easing do react-native-reanimated
        })
      ).start();
    };

    startShimmerAnimation();

    // Limpa a animação quando o componente é desmontado
    return () => {
      shimmerAnim.stopAnimation();
    };
  }, [shimmerAnim]);

  // Interpolações para o efeito shimmer
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0.3, 0.6, 0.8, 0.6, 0.3, 0.3],
  });

  // Obtém a largura da tela para calcular o tamanho do shimmer
  const screenWidth = Dimensions.get('window').width;

  // Renderiza múltiplos esqueletos baseado na prop count
  const renderSkeletons = () => {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <View key={i} style={styles.itemContainer}>
          {/* Overlay para o efeito shimmer - agora com gradiente simulado */}
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                width: screenWidth * 1.5,
                backgroundColor: 'white',
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />

          {/* Título da oferta */}
          <View style={styles.itemTitle} />

          {/* Preço */}
          <View style={styles.itemDetail} />

          {/* Nome do prestador */}
          <View style={[styles.itemDetail, styles.prestadorName]} />

          {/* Categoria */}
          <View style={styles.itemDetail} />

          {/* Localização */}
          <View style={styles.itemDetail} />
        </View>
      );
    }
    return skeletons;
  };

  return <View style={styles.container}>{renderSkeletons()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemTitle: {
    height: 20,
    backgroundColor: '#e9ecef',
    marginBottom: 12,
    borderRadius: 4,
    width: '85%',
  },
  itemDetail: {
    height: 16,
    backgroundColor: '#e9ecef',
    marginBottom: 10,
    borderRadius: 4,
    width: '60%',
  },
  prestadorName: {
    width: '75%',
    marginBottom: 12, // Espaço maior para o nome do prestador
  },
});

export default SkeletonLoading;
