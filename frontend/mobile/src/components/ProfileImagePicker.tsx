import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useImageUpload } from '@/hooks/useImageUpload';

/**
 * Interface que define as propriedades do componente ProfileImagePicker
 * @param currentImageUrl - URL da imagem atual do perfil
 * @param userToken - Token de autenticação do usuário
 * @param onImageSelected - Função de callback chamada quando uma imagem é selecionada
 * @param onImageUploaded - Função de callback chamada quando uma imagem é enviada com sucesso
 * @param disabled - Flag que indica se o componente está desabilitado
 */
interface ProfileImagePickerProps {
  currentImageUrl?: string;
  userToken?: string;
  onImageSelected?: (imageUri: string) => void;
  onImageUploaded?: (imageUrl: string) => void;
  disabled?: boolean;
}

/**
 * Componente para seleção e exibição de imagem de perfil
 * Permite ao usuário selecionar, visualizar e fazer upload de imagens de perfil
 */
export const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  currentImageUrl,
  userToken,
  onImageSelected,
  onImageUploaded,
  disabled = false,
}) => {
  /**
   * Hook personalizado que fornece funcionalidades para seleção e upload de imagens
   * Retorna estados e funções para gerenciar o processo de upload
   */
  const {
    selectedImage,     // URI da imagem selecionada da galeria
    isUploading,       // Estado que indica se o upload está em andamento
    pickImage,         // Função para abrir o seletor de imagens
    handleImageUpload, // Função para realizar o upload da imagem
    clearSelectedImage, // Função para limpar a imagem selecionada
  } = useImageUpload(userToken);

  // Estado para armazenar a URL da imagem após o upload
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState<string | null>(currentImageUrl || null);

  // Log para depuração - valor inicial de uploadedImageUrl
  React.useEffect(() => {
    console.log('[ProfileImagePicker] Estado inicial de uploadedImageUrl:', uploadedImageUrl);
    console.log('[ProfileImagePicker] Prop currentImageUrl:', currentImageUrl);
  }, []);

  // Estado para controlar a visibilidade do overlay
  const [showOverlay, setShowOverlay] = React.useState(false);

  // Animação para o efeito de pulsação no ícone da câmera
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Animação para o efeito de rotação no indicador de carregamento
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  // Animação para a opacidade do overlay
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  /**
   * Funções para controlar a visibilidade do overlay da imagem
   */

  // Função para mostrar o overlay com animação de fade in
  const showImageOverlay = () => {
    setShowOverlay(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Função para esconder o overlay com animação de fade out
  const hideImageOverlay = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowOverlay(false);
    });
  };

  /**
   * Efeito para criar e iniciar a animação de pulsação do ícone da câmera
   * Cria uma sequência de animações que aumenta e diminui o tamanho do ícone
   */
  React.useEffect(() => {
    const pulsate = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ]);

    // Inicia a animação em loop
    Animated.loop(pulsate).start();

    // Função de limpeza para parar a animação quando o componente for desmontado
    return () => {
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);

  /**
   * Efeito para criar e iniciar a animação de rotação durante o upload da imagem
   * Ativa a animação apenas quando isUploading for verdadeiro
   */
  React.useEffect(() => {
    if (isUploading) {
      const spin = Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      // Inicia a animação em loop
      Animated.loop(spin).start();
    } else {
      // Reseta a animação quando o upload termina
      spinAnim.setValue(0);
    }

    // Função de limpeza para parar a animação quando o componente for desmontado
    return () => {
      spinAnim.stopAnimation();
    };
  }, [isUploading, spinAnim]);

  // Interpolação para criar o efeito de rotação de 0 a 360 graus
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  /**
   * Função para fazer upload da imagem e notificar o componente pai
   * Utiliza o hook useCallback para evitar recriações desnecessárias da função
   */
  const uploadImage = useCallback(async () => {
    if (!selectedImage) {
      console.log('Nenhuma imagem selecionada para upload');
      return;
    }

    console.log('[ProfileImagePicker] Iniciando upload da imagem selecionada...');
    const newUploadedImageUrl = await handleImageUpload();

    if (newUploadedImageUrl) {
      console.log('[ProfileImagePicker] Imagem enviada com sucesso. URL recebida:', newUploadedImageUrl);

      // Atualiza o estado interno sempre com a nova URL
      console.log('[ProfileImagePicker] Atualizando uploadedImageUrl de', uploadedImageUrl, 'para', newUploadedImageUrl);
      setUploadedImageUrl(newUploadedImageUrl);

      // Notifica o componente pai sobre a nova URL da imagem
      // IMPORTANTE: Sempre notificar o componente pai, mesmo que a URL seja a mesma
      if (onImageUploaded) {
        console.log('[ProfileImagePicker] Chamando onImageUploaded com:', newUploadedImageUrl);
        // Garantir que a URL seja passada corretamente para o componente pai
        setTimeout(() => {
          onImageUploaded(newUploadedImageUrl);
          console.log('[ProfileImagePicker] onImageUploaded chamado com sucesso');
        }, 0);
      } else {
        console.warn('[ProfileImagePicker] onImageUploaded não está definido, não foi possível notificar o componente pai');
      }

      // Limpa a imagem selecionada, pois já foi processada
      clearSelectedImage();
    } else {
      console.error('[ProfileImagePicker] Falha ao fazer upload da imagem: URL não retornada');
    }
  }, [selectedImage, handleImageUpload, onImageUploaded, uploadedImageUrl, clearSelectedImage]);

  /**
   * Efeito para sincronizar o estado interno com a prop currentImageUrl
   * Atualiza o estado uploadedImageUrl quando a prop currentImageUrl mudar
   * e for diferente do valor atual de uploadedImageUrl
   */
  React.useEffect(() => {
    console.log('[ProfileImagePicker] Efeito de sincronização acionado');
    console.log('[ProfileImagePicker] currentImageUrl:', currentImageUrl);
    console.log('[ProfileImagePicker] uploadedImageUrl atual:', uploadedImageUrl);

    if (currentImageUrl && currentImageUrl !== uploadedImageUrl) {
      console.log('[ProfileImagePicker] currentImageUrl mudou para:', currentImageUrl, '. Atualizando uploadedImageUrl.');
      setUploadedImageUrl(currentImageUrl);
    } else {
      console.log('[ProfileImagePicker] Nenhuma atualização necessária para uploadedImageUrl');
    }
  }, [currentImageUrl, uploadedImageUrl]);

  /**
   * Efeito para processar a seleção de imagem
   * Notifica o componente pai e inicia o upload automático quando uma imagem é selecionada
   */
  React.useEffect(() => {
    if (selectedImage && onImageSelected) {
      console.log('Imagem selecionada:', selectedImage);
      onImageSelected(selectedImage);

      // Automaticamente fazer upload da imagem quando ela é selecionada
      console.log('Iniciando upload automático da imagem...');
      uploadImage();
    }
  }, [selectedImage, onImageSelected, uploadImage]);

  /**
   * Determina qual imagem exibir na interface
   * Prioridade: 1) imagem enviada, 2) imagem selecionada, 3) imagem atual
   */
  const imageToDisplay = uploadedImageUrl || selectedImage || currentImageUrl;

  /**
   * Renderização do componente
   */
  return (
    <View style={styles.imageContainer}>
      {/* Container da imagem com overlay */}
      <TouchableOpacity 
        style={styles.imageWrapper}
        onPress={pickImage}
        onPressIn={showImageOverlay}
        onPressOut={hideImageOverlay}
        disabled={disabled || isUploading}
        activeOpacity={0.9}
      >
        {/* Exibe a imagem selecionada ou a foto atual do perfil */}
        {imageToDisplay ? (
          <Image
            source={{ uri: imageToDisplay }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.profileImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>Sem foto</Text>
          </View>
        )}

        {/* Overlay com ícone de câmera - visível durante upload ou quando pressionado */}
        {(showOverlay || isUploading) && (
          <Animated.View 
            style={[
              styles.overlay, 
              { opacity: isUploading ? 1 : overlayOpacity }
            ]}
          >
            {isUploading ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <ActivityIndicator size="large" color="#ffffff" />
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialIcons name="photo-camera" size={32} color="#ffffff" />
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Indicador de toque - sempre visível exceto durante upload */}
        {!isUploading && (
          <View style={styles.editBadge}>
            <MaterialIcons name="edit" size={16} color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Texto de status */}
      {isUploading ? (
        <Text style={styles.statusText}>Atualizando foto de perfil...</Text>
      ) : (
        <Text style={styles.statusText}>Toque na foto para alterar</Text>
      )}

      {/* Botão para cancelar a seleção da imagem (visível apenas quando uma nova imagem é selecionada e não está fazendo upload) */}
      {selectedImage && !isUploading && (
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={clearSelectedImage}
          disabled={disabled}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Estilos para o componente ProfileImagePicker
 * Define a aparência visual de todos os elementos do seletor de imagem
 */
const styles = StyleSheet.create({
  // Container principal que envolve todo o componente
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // Wrapper da imagem com efeitos de sombra
  imageWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  // Estilo da imagem de perfil
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#fff',
  },
  // Estilo para o placeholder quando não há imagem
  placeholderImage: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Texto exibido no placeholder
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  // Overlay que aparece ao pressionar a imagem ou durante o upload
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  // Badge de edição que aparece no canto inferior direito da imagem
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#4a80f5',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Texto de status exibido abaixo da imagem
  statusText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  // Botão de cancelamento para remover a imagem selecionada
  cancelButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // Texto dos botões
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
});

/**
 * Exportação padrão do componente ProfileImagePicker
 */
export default ProfileImagePicker;
