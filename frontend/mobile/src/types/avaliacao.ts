
/**
 * Interface ReviewData (Dados de Avaliação)
 * 
 * Descrição: Define a estrutura dos dados enviados para a API ao submeter uma avaliação.
 * Esta interface é utilizada para padronizar o formato dos dados de avaliação
 * que serão enviados para o servidor.
 */
export interface ReviewData {
  receptorId: string; // ID do usuário que está sendo avaliado
  nota: number;       // Nota numérica (ex: 1 a 5)
  comentario?: string; // Comentário opcional
  // avaliadorId é inferido pelo backend via token
  // contratacaoId?: string; // Opcional: vincular avaliação a um contrato específico
}

/**
 * Interface ReviewResponse (Resposta de Avaliação)
 * 
 * Descrição: Define a estrutura da resposta esperada da API após submeter uma avaliação.
 * Esta interface padroniza o formato dos dados recebidos do servidor após
 * o envio de uma avaliação.
 */
export interface ReviewResponse {
  message: string;    // Mensagem de retorno da API
  // review?: Review; // Opcional: A API pode retornar a avaliação criada
}
