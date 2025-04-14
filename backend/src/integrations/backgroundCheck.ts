// src/integrations/backgroundCheck.ts

/**
 * Módulo de integração com API externa de verificação de antecedentes.
 */
import axios, { AxiosResponse, AxiosError } from 'axios';

// --- Interfaces ---

// Interface para os dados do usuário enviados à API externa
// Ajuste os campos conforme a API real exigir
interface UserDataPayload {
  cpf: string; // Exemplo
  nomeCompleto: string; // Exemplo
  dataNascimento: string; // Exemplo: Formato 'YYYY-MM-DD'
  // Outros campos necessários...
}

// Interface para a resposta de SUCESSO esperada da API externa
// Ajuste conforme a estrutura real da resposta da API
interface BackgroundCheckApiResponse {
  statusVerificacao: 'APROVADO' | 'REPROVADO' | 'PENDENTE' | 'INCONCLUSIVO'; // Exemplo
  detalhes?: string;
  protocolo?: string;
  // Outros campos retornados...
}

// Interface para o resultado padronizado retornado por nossa função
type BackgroundCheckResult =
  | { success: true; data: BackgroundCheckApiResponse }
  | { success: false; error: string; status?: number; details?: any };

// --- Função de Integração ---

/**
 * Envia uma requisição POST para a API de verificação de antecedentes criminais.
 *
 * @param userData - Objeto contendo os dados do usuário validados.
 * @returns Promise<BackgroundCheckResult> - Objeto indicando sucesso/falha.
 */
export async function checkBackground(userData: UserDataPayload): Promise<BackgroundCheckResult> {
  const apiUrl = process.env.BACKGROUND_API_URL;
  const apiKey = process.env.BACKGROUND_API_KEY;

  // Valida se as variáveis de ambiente essenciais estão configuradas
  if (!apiUrl || !apiKey) {
    console.error('Erro de Configuração: BACKGROUND_API_URL ou BACKGROUND_API_KEY não definidas no .env');
    return { success: false, error: 'Erro interno de configuração do servidor.' };
  }

  try {
    console.log(`Enviando verificação de antecedentes para: ${apiUrl}`); // Log sem dados sensíveis

    const response: AxiosResponse<BackgroundCheckApiResponse> = await axios.post(
      apiUrl,
      userData, // Dados do usuário no corpo da requisição
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`, // Autenticação Bearer Token
          'Content-Type': 'application/json',
          // Outros headers específicos da API, se necessário
        },
        timeout: 15000 // Exemplo: Timeout de 15 segundos
      }
    );

    // Valida a resposta da API externa (exemplo básico)
    if (response.status === 200 && response.data /* && response.data.statusVerificacao */ ) {
      // TODO: Adaptar a extração de dados conforme a resposta REAL da API
      console.log(`Resposta da verificação de antecedentes recebida: Status ${response.data.statusVerificacao}`);
      return { success: true, data: response.data };
    } else {
      // Se a API externa retornar 200 mas com dados inesperados
      console.error('Resposta inesperada da API de Background Check:', response.status, response.data);
      return { success: false, error: 'Resposta inválida recebida da API de verificação.', status: response.status, details: response.data };
    }

  } catch (error: unknown) {
    // Tratamento de erro aprimorado para erros do Axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(`Erro na API de Background Check: Status ${axiosError.response?.status}`, axiosError.response?.data || axiosError.message);
      return {
        success: false,
        error: `Falha na comunicação com o serviço de verificação (${axiosError.response?.status || 'Erro de Rede'}).`,
        status: axiosError.response?.status,
        details: axiosError.response?.data // Pode conter detalhes úteis do erro da API externa
      };
    } else {
      // Outros erros inesperados
      console.error('Erro inesperado em checkBackground:', error);
      return {
        success: false,
        error: 'Erro interno do servidor ao processar verificação de antecedentes.',
        details: (error instanceof Error) ? error.message : String(error)
      };
    }
  }
}

// Pode exportar a função diretamente ou dentro de um objeto
// export default { checkBackground };