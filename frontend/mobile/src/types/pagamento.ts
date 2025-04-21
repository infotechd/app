
/**
 * Define os métodos de pagamento aceitos.
 * Baseado no placeholder do input original.
 */
export type PaymentMethod = 'cartao' | 'boleto' | 'pix';

/** Dados enviados para a API de processamento de pagamento */
export interface PaymentData {
  contratacaoId: string;
  valor: number; // Valor numérico
  metodo: PaymentMethod; // Usa o tipo definido
  // Adicionar outros campos se necessário (ex: detalhes do cartão - CUIDADO COM SEGURANÇA)
}

/** Resposta esperada da API de pagamento */
export interface PaymentResponse {
  message: string;
  // A API pode retornar detalhes da transação
  // transactionId?: string;
  // statusPagamento?: string;
}