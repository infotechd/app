
/**
 * Define os métodos de pagamento aceitos no sistema.
 * Esta é uma união de tipos que limita as opções de pagamento disponíveis.
 * Baseado no placeholder do input original.
 */
export type MetodoPagamento = 'cartao' | 'boleto' | 'pix';
// English alias for MetodoPagamento
export type PaymentMethod = MetodoPagamento;

/**
 * Interface que define a estrutura dos dados enviados para a API de processamento de pagamento.
 * Esta estrutura é utilizada quando um usuário realiza um pagamento no sistema.
 */
export interface DadosPagamento {
  contratacaoId: string; // Identificador único da contratação associada ao pagamento
  valor: number; // Valor numérico do pagamento a ser processado
  metodo: MetodoPagamento; // Método de pagamento selecionado pelo usuário (usa o tipo definido acima)
  // Adicionar outros campos se necessário (ex: detalhes do cartão - CUIDADO COM SEGURANÇA)
}
// English alias for DadosPagamento
export type PaymentData = DadosPagamento;

/**
 * Interface que define a estrutura da resposta recebida da API de pagamento.
 * Esta estrutura é utilizada para processar o retorno após uma tentativa de pagamento.
 */
export interface RespostaPagamento {
  message: string; // Mensagem de retorno da API de pagamento (sucesso, erro, etc.)
  // A API pode retornar detalhes adicionais da transação
  // transactionId?: string; // Identificador único da transação gerado pela API de pagamento
  // statusPagamento?: string; // Status atual do pagamento (aprovado, pendente, recusado, etc.)
}
// English alias for RespostaPagamento
export type PaymentResponse = RespostaPagamento;
