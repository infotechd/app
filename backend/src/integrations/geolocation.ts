// src/integrations/geolocation.ts

/**
 * Módulo de integração com a API de Geocoding do Google Maps.
 */
import axios, { AxiosResponse, AxiosError } from 'axios';

// --- Interfaces ---

// Interface para a estrutura de localização na resposta do Google API
interface GoogleLocation {
  lat: number;
  lng: number;
}

// Interface para a geometria na resposta do Google API
interface GoogleGeometry {
  location: GoogleLocation;
  // Outros campos como location_type, viewport, etc., podem ser adicionados se necessário
}

// Interface para um resultado na resposta do Google API
interface GoogleGeocodeResult {
  geometry: GoogleGeometry;
  formatted_address?: string; // Endereço formatado retornado pelo Google
  // Outros campos como address_components, place_id, etc.
}

// Interface para a resposta completa da API de Geocoding do Google
interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string; // Presente se status não for OK
}

// Interface para o resultado padronizado da nossa função
type GeolocationResult =
  | { success: true; location: GoogleLocation; formattedAddress?: string } // Inclui endereço formatado
  | { success: false; error: string; status?: string; details?: any };

// --- Constantes ---
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

  // Validação de entrada básica
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
          address: address.trim(), // Envia endereço sem espaços extras
          key: apiKey,
          // language: 'pt-BR', // Opcional: para tentar obter resultados em português
          // region: 'BR'     // Opcional: para influenciar resultados para o Brasil
        },
        timeout: 5000 // Exemplo: Timeout de 5 segundos
      }
    );

    // Verifica o status da resposta da API do Google
    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      // Pega a localização do primeiro resultado (mais provável)
      const location = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address; // Pega endereço formatado
      console.log(`Geocodificação para "${address}" bem-sucedida: ${formattedAddress}`);
      return { success: true, location, formattedAddress };
    } else {
      // Trata outros status retornados pelo Google (ZERO_RESULTS, etc.)
      console.warn(`Google Geocoding API retornou status: ${response.data.status} para o endereço: "${address}"`);
      return { success: false, error: `Falha na geocodificação: ${response.data.status}`, status: response.data.status };
    }

  } catch (error: unknown) {
    // Tratamento de erro Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Erro na API Google Geocoding: Status ${axiosError.response?.status}`, axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: `Erro de comunicação com o serviço de geolocalização (${axiosError.response?.status || 'Erro de Rede'}).`,
        status: (axiosError.response?.data as any)?.status || undefined, // Tenta pegar status do erro do google
        details: axiosError.response?.data // Detalhes do erro da API
      };
    } else {
      // Outros erros
      console.error('Erro inesperado em getCoordinates:', error);
      return {
        success: false,
        error: 'Erro interno do servidor ao processar geolocalização.',
        details: error instanceof Error ? { message: error.message } : String(error)
      };
    }
  }
}

// export default { getCoordinates }; // Ou export direto