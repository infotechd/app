
/** Dados enviados para a API ao submeter uma avaliação */
export interface ReviewData {
  receptorId: string; // ID do usuário que está sendo avaliado
  nota: number;       // Nota numérica (ex: 1 a 5)
  comentario?: string; // Comentário opcional
  // avaliadorId é inferido pelo backend via token
  // contratacaoId?: string; // Opcional: vincular avaliação a um contrato específico
}

/** Resposta esperada da API após submeter avaliação */
export interface ReviewResponse {
  message: string;
  // review?: Review; // Opcional: A API pode retornar a avaliação criada
}