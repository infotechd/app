// src/integrations/geolocation.ts

/**
 * Módulo de integração com a API de Geocoding do Google Maps.
 */
import axios, { AxiosResponse, AxiosError } from 'axios';

// --- Interfaces ---

// Interface que define a estrutura de coordenadas geográficas (latitude e longitude) retornadas pela API do Google
interface GoogleLocation {
  lat: number;
  lng: number;
}

// Interface que define a estrutura de geometria retornada pela API do Google, contendo a localização
interface GoogleGeometry {
  location: GoogleLocation;
  // Outros campos como location_type, viewport, etc., podem ser adicionados se necessário
}

// Interface que define a estrutura de um resultado individual retornado pela API de Geocodificação do Google
interface GoogleGeocodeResult {
  geometry: GoogleGeometry;
  formatted_address?: string; // Endereço formatado retornado pelo Google
  // Outros campos como address_components, place_id, etc.
}

// Interface que define a estrutura completa da resposta da API de Geocodificação do Google
interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string; // Presente se status não for OK
}

// Tipo que define o formato padronizado do resultado retornado pela nossa função de geocodificação
type GeolocationResult =
  | { success: true; location: GoogleLocation; formattedAddress?: string } // Resultado bem-sucedido com localização e endereço formatado
  | { success: false; error: string; status?: string; details?: any }; // Resultado com falha, incluindo mensagem de erro e detalhes

// --- Constantes ---
// URL base da API de Geocodificação do Google
const GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// --- Função de Integração ---

/**
 * Converte um endereço em coordenadas geográficas (latitude e longitude)
 * utilizando a API de Geocoding do Google Maps.
 *
 * @param address - Endereço (string) a ser geocodificado.
 * @returns Promise<GeolocationResult> - Objeto indicando sucesso/falha.
 */
export async function getCoordinates(address: string): Promise<GeolocationResult> {
  const apiKey = process.env.Maps_API_KEY;

  // Realiza validação básica do endereço fornecido
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return { success: false, error: 'Endereço inválido fornecido.' };
  }
  if (!apiKey) {
    console.error('Erro de Configuração: Maps_API_KEY não definida no .env');
    return { success: false, error: 'Erro interno de configuração do servidor.' };
  }

  try {
    const response: AxiosResponse<GoogleGeocodeResponse> = await axios.get(
      GOOGLE_GEOCODING_API_URL,
      {
        params: {
          address: address.trim(), // Remove espaços extras do endereço
          key: apiKey,
          // language: 'pt-BR', // Opcional: para tentar obter resultados em português
          // region: 'BR'     // Opcional: para influenciar resultados para o Brasil
        },
        timeout: 5000 // Define um tempo limite de 5 segundos para a requisição
      }
    );

    // Verifica se a API retornou resultados válidos
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      // Obtém as coordenadas do primeiro resultado (geralmente o mais relevante)
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address; // Obtém o endereço formatado
      console.log(`Geocodificação para "${address}" bem-sucedida: ${formattedAddress}`);
      return { success: true, location, formattedAddress };
    } else {
      // Trata casos em que a API não retornou resultados válidos
      console.warn(`Google Geocoding API retornou status: ${response.data.status} para o endereço: "${address}"`);
      return { success: false, error: `Falha na geocodificação: ${response.data.status}`, status: response.data.status };
    }

  } catch (error: unknown) {
    // Tratamento específico para erros da biblioteca Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Erro na API Google Geocoding: Status ${axiosError.response?.status}`, axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: `Erro de comunicação com o serviço de geolocalização (${axiosError.response?.status || 'Erro de Rede'}).`,
        status: (axiosError.response?.data as any)?.status || undefined, // Obtém o status de erro da resposta da API
        details: axiosError.response?.data // Armazena detalhes adicionais do erro
      };
    } else {
      // Tratamento para outros tipos de erros não relacionados ao Axios
      console.error('Erro inesperado em getCoordinates:', error);
      return {
        success: false,
        error: 'Erro interno do servidor ao processar geolocalização.',
        details: error instanceof Error ? { message: error.message } : String(error)
      };
    }
  }
}

// Exportação alternativa: export default { getCoordinates };
