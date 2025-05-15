// src/services/uploadApi.ts

import { API_URL } from "@/config/api";

/**
 * Interface para a resposta da API de upload de imagem
 */
interface UploadImageResponse {
  message: string;
  imageUrl: string;
}

/**
 * Faz upload de uma imagem para o servidor
 * @param token - O token JWT do usuário autenticado
 * @param formData - O FormData contendo a imagem a ser enviada
 * @returns Uma Promise que resolve com a URL da imagem enviada
 * @throws Lança um erro em caso de falha
 */
export const uploadImage = async (token: string, formData: FormData): Promise<UploadImageResponse> => {
  try {
    console.log('=== ENVIANDO IMAGEM ===');

    // Validar token
    if (!token || typeof token !== 'string') {
      throw new Error('Token inválido');
    }

    // Fazer a requisição para a API
    const response = await fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Não incluir 'Content-Type' aqui, o fetch vai definir automaticamente com o boundary correto para FormData
      },
      body: formData,
    });

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao enviar imagem');
    }

    // Converter a resposta para JSON
    const data = await response.json();

    console.log('✓ Imagem enviada com sucesso!');
    return data;
  } catch (error) {
    console.error('=== ERRO AO ENVIAR IMAGEM ===', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro desconhecido ao enviar imagem');
    }
  }
};