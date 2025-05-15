import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';
import { uploadImage } from '@/services/uploadApi';

/**
 * Custom hook para gerenciar a seleção e upload de imagens
 * @param userToken - Token do usuário para autenticação
 * @returns Objeto contendo estados e funções para gerenciar imagens
 */
export const useImageUpload = (userToken: string | undefined) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  /**
   * Solicita permissões de acesso à galeria/câmera
   * @returns Promise<boolean> - Verdadeiro se as permissões foram concedidas
   */
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
        return false;
      }
      return true;
    }
    return true;
  };

  /**
   * Seleciona uma imagem da galeria
   */
  const pickImage = async (): Promise<void> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Usar MediaType em vez de MediaTypeOptions (que foi depreciado)
      const mediaType = ImagePicker.MediaType
        ? ImagePicker.MediaType.Images
        : 'images'; // Fallback para string 'images' se MediaType não existir

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        if (imageUri) {
          setSelectedImage(imageUri);
        } else {
          Alert.alert('Erro', 'Não foi possível obter a URI da imagem selecionada.');
        }
      }
    } catch (error) {
      // Log detalhado do erro para facilitar a depuração
      console.error('Erro ao selecionar imagem:', error);

      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = 'Não foi possível selecionar a imagem.';

      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);

        // Verificar se é um erro relacionado ao MediaType
        if (error.message.includes('MediaType') || error.message.includes('Images')) {
          errorMessage = 'Erro na configuração do seletor de imagens. Por favor, tente novamente ou contate o suporte.';
        }
      }

      Alert.alert('Erro', errorMessage);
    }
  };

  /**
   * Faz upload da imagem selecionada
   * @returns Promise<string | null> - URL da imagem enviada ou null em caso de erro
   */
  const handleImageUpload = async (): Promise<string | null> => {
    if (!selectedImage) {
      console.log('Nenhuma imagem selecionada para upload');
      return null;
    }

    // Verificação do token
    if (!userToken) {
      console.error('Token de usuário não fornecido');
      Alert.alert('Erro', 'Usuário não autenticado');
      return null;
    }

    setIsUploading(true);
    try {
      console.log('Iniciando upload da imagem...');

      // Criar um objeto FormData para enviar a imagem
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log(`Preparando imagem para upload: ${filename} (${type})`);

      // O tipo FormData do React Native é incompatível com o tipo esperado pelo TypeScript.
      // Isso ocorre porque o tipo FormData no ambiente React Native não inclui todos os métodos
      // e propriedades esperados pelo tipo FormData padrão do DOM.
      // Uma solução seria criar uma definição de tipo personalizada, mas para simplicidade,
      // usamos @ts-ignore aqui.
      // @ts-ignore
      formData.append('image', {
        uri: selectedImage,
        name: filename,
        type,
      });

      // Fazer upload da imagem
      console.log('Enviando imagem para o servidor...');
      const response = await uploadImage(userToken, formData);
      console.log('Resposta do servidor recebida:', response);

      // Verificar se a resposta contém a URL da imagem
      if (response && response.imageUrl) {
        try {
          new URL(response.imageUrl);
          console.log('URL da imagem válida:', response.imageUrl);
          return response.imageUrl;
        } catch (e) {
          console.error('URL inválida retornada pelo servidor:', response.imageUrl);
          Alert.alert('Erro', 'URL de imagem inválida retornada pelo servidor.');
          return null;
        }
      } else {
        console.error('Resposta do servidor não contém URL da imagem:', response);
        return null;
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      Alert.alert('Erro', 'Não foi possível fazer upload da imagem.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Limpa a imagem selecionada
   */
  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  return {
    selectedImage,
    isUploading,
    pickImage,
    handleImageUpload,
    clearSelectedImage,
  };
};
