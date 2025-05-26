// src/integrations/backgroundCheck.ts

/**
 * Módulo de integração com API externa de verificação de antecedentes.
 */
import axios, { AxiosResponse, AxiosError } from 'axios';

// --- Interfaces ---

// Interface que define os dados do usuário que serão enviados para a API externa
// Os campos devem ser ajustados conforme as exigências da API real
interface UserDataPayload {
  cpf: string; // CPF do usuário
  nomeCompleto: string; // Nome completo do usuário
  dataNascimento: string; // Data de nascimento no formato 'YYYY-MM-DD'
  // Outros campos necessários para a API
}

// Interface que define a estrutura da resposta de sucesso esperada da API externa
// Deve ser ajustada conforme a estrutura real da resposta da API
interface BackgroundCheckApiResponse {
  statusVerificacao: 'APROVADO' | 'REPROVADO' | 'PENDENTE' | 'INCONCLUSIVO'; // Status da verificação
  detalhes?: string; // Detalhes adicionais sobre a verificação
  protocolo?: string; // Número de protocolo da verificação
  // Outros campos que podem ser retornados pela API
}

// Tipo que define o formato padronizado do resultado retornado pela nossa função
// Pode ser um objeto de sucesso com os dados ou um objeto de erro com detalhes
type BackgroundCheckResult =
  | { success: true; data: BackgroundCheckApiResponse }
  | { success: false; error: string; status?: number; details?: any };

// --- Função de Integração ---

/**
 * Envia uma requisição POST para a API de verificação de antecedentes criminais.
 *
 * @param userData - Objeto contendo os dados do usuário validados.
 * @returns Promise<BackgroundCheckResult> - Objeto indicando sucesso ou falha.
 */
export async function checkBackground(userData: UserDataPayload): Promise<BackgroundCheckResult> {
  const apiUrl = process.env.BACKGROUND_API_URL;
  const apiKey = process.env.BACKGROUND_API_KEY;

  // Verifica se as variáveis de ambiente necessárias estão configuradas
  if (!apiUrl || !apiKey) {
    console.error('Erro de Configuração: BACKGROUND_API_URL ou BACKGROUND_API_KEY não definidas no .env');
    return { success: false, error: 'Erro interno de configuração do servidor.' };
  }

  try {
    console.log(`Enviando verificação de antecedentes para: ${apiUrl}`); // Log de execução sem expor dados sensíveis

    const response: AxiosResponse<BackgroundCheckApiResponse> = await axios.post(
      apiUrl,
      userData, // Envia os dados do usuário no corpo da requisição
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`, // Utiliza autenticação via Bearer Token
          'Content-Type': 'application/json',
          // Outros cabeçalhos específicos que a API possa exigir
        },
        timeout: 15000 // Define um tempo limite de 15 segundos para a requisição
      }
    );

    // Verifica se a resposta da API externa é válida
    if (response.status === 200 && response.data /* && response.data.statusVerificacao */ ) {
      // TODO: Ajustar a extração de dados de acordo com a estrutura real da resposta da API
      console.log(`Resposta da verificação de antecedentes recebida: Status ${response.data.statusVerificacao}`);
      return { success: true, data: response.data };
    } else {
      // Trata o caso em que a API retorna código 200 mas com dados em formato inesperado
      console.error('Resposta inesperada da API de Background Check:', response.status, response.data);
      return { success: false, error: 'Resposta inválida recebida da API de verificação.', status: response.status, details: response.data };
    }

  } catch (error: unknown) {
    // Tratamento específico para erros relacionados às requisições Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Erro na API de Background Check: Status ${axiosError.response?.status}`, axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: `Falha na comunicação com o serviço de verificação (${axiosError.response?.status || 'Erro de Rede'}).`,
        status: axiosError.response?.status,
        details: axiosError.response?.data // Armazena detalhes do erro retornados pela API externa
      };
    } else {
      // Tratamento para outros tipos de erros não relacionados diretamente ao Axios
      console.error('Erro inesperado em checkBackground:', error);
      return {
        success: false,
        error: 'Erro interno do servidor ao processar verificação de antecedentes.',
        details: (error instanceof Error) ? error.message : String(error)
      };
    }
  }
}

// Opção alternativa de exportação da função dentro de um objeto
// export default { checkBackground };
