// src/integrations/stripeIntegration.ts

/**
 * Módulo de integração com a API de pagamento Stripe.
 */
import Stripe from 'stripe';

// --- Interfaces ---

// Interface que define os parâmetros necessários para processar um pagamento
interface ProcessPaymentParams {
  amount: number; // Valor em centavos
  currency?: string; // Moeda utilizada, exemplo: 'brl'
  paymentMethodId: string; // Identificador do método de pagamento gerado no frontend
  customerId?: string; // Identificador do cliente no Stripe (opcional, mas recomendado)
  description?: string; // Descrição da transação para o Stripe
  metadata?: { [key: string]: string | number | null }; // Metadados adicionais (exemplo: contratacaoId, userId)
  idempotencyKey?: string; // Chave para prevenir processamento duplicado da mesma transação
}

// Tipo que padroniza os resultados retornados pelas funções de integração
type StripeResult<T> =
  | { success: true; data: T }
  | {
  success: false;
  error: string; // Mensagem principal do erro
  type?: Stripe.StripeRawError; // Tipo do erro retornado pelo Stripe
  code?: string; // Código específico do erro
  decline_code?: string; // Código de recusa do cartão, quando aplicável
  status?: number; // Código de status HTTP, quando aplicável
  details?: any; // Detalhes adicionais sobre o erro
};

// --- Inicialização do Cliente Stripe ---

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("ERRO FATAL de Configuração: STRIPE_SECRET_KEY não definida no .env");
  // Poderíamos lançar um erro aqui, mas isso causaria falha na inicialização da aplicação
  // Por segurança, seria melhor não continuar sem a chave em ambiente de produção
  // throw new Error("Chave secreta do Stripe não configurada.");
}

// Inicializa o cliente Stripe com a chave secreta e especifica a versão da API
// Especificar a versão da API é importante para evitar quebras inesperadas quando o Stripe atualiza sua API
const stripe = new Stripe(stripeSecretKey || 'sk_test_invalidkey', { // Usa uma chave inválida como fallback para evitar crash total da aplicação
  apiVersion: '2025-03-31.basil', // Versão específica da API compatível com a biblioteca
  typescript: true, // Ativa os recursos de tipagem TypeScript da biblioteca
});

// --- Funções de Integração ---

/**
 * Cria e tenta confirmar uma intenção de pagamento (PaymentIntent) no Stripe.
 * NOTA: Esta abordagem de confirmação imediata pode necessitar de tratamento de autenticação forte (SCA/3D Secure) no frontend
 * ou um fluxo baseado em webhooks para confirmação final do pagamento.
 *
 * @param params - Parâmetros necessários para o processamento do pagamento.
 * @returns Promise<StripeResult<Stripe.PaymentIntent>> - Objeto contendo resultado de sucesso/falha e dados da intenção de pagamento ou informações de erro.
 */
export async function processPayment(params: ProcessPaymentParams): Promise<StripeResult<Stripe.PaymentIntent>> {
  const { amount, currency = 'brl', paymentMethodId, customerId, description, metadata, idempotencyKey } = params;

  // Realiza validação básica dos parâmetros essenciais
  if (!paymentMethodId || !amount || amount <= 0) {
    return { success: false, error: 'Parâmetros inválidos para processar pagamento (amount, paymentMethodId obrigatórios).' };
  }
  if (!stripeSecretKey) return { success: false, error: 'Erro interno de configuração do servidor (Stripe).' };


  try {
    console.log(`[Stripe] Criando PaymentIntent: ${amount} ${currency.toUpperCase()}`);

    // Configura as opções para a chave de idempotência, se fornecida
    const requestOptions: Stripe.RequestOptions | undefined = idempotencyKey
      ? { idempotencyKey: idempotencyKey }
      : undefined;

    // Cria a intenção de pagamento e tenta confirmá-la imediatamente
    const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Arredonda para garantir que o valor seja inteiro (em centavos)
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      customer: customerId, // Associa a transação ao cliente no Stripe, quando disponível
      confirm: true, // Solicita confirmação imediata
      confirmation_method: 'automatic', // Modo automático permite que o Stripe determine o fluxo adequado
      return_url: process.env.STRIPE_RETURN_URL, // URL de retorno após ações como autenticação 3DS
      description: description,
      metadata: metadata, // Dados adicionais úteis para rastreamento (ex: ID da contratação)
      // off_session: false, // Quando false, indica que o cliente está presente durante a transação
      // error_on_requires_action: false, // Quando false, retorna status requires_action em vez de erro
    }, requestOptions); // Aplica as opções de idempotência, se configuradas

    // IMPORTANTE: O controller que utiliza esta função DEVE verificar o status do paymentIntent
    console.log(`[Stripe] PaymentIntent ${paymentIntent.id} criado com status: ${paymentIntent.status}`);
    return { success: true, data: paymentIntent };

  } catch (error: unknown) {
    console.error('[Stripe] Erro ao processar pagamento:', error);
    // Tratamento específico para erros do Stripe
    if ((error as Stripe.errors.StripeError)?.type) {
      const stripeError = error as Stripe.errors.StripeError;
      return {
        success: false,
        error: stripeError.message, // Mensagem principal do erro
        code: stripeError.code,
        decline_code: stripeError.decline_code, // Código específico para recusas de cartão
        details: stripeError // Objeto completo do erro para registro interno
      };
    } else {
      // Tratamento para outros tipos de erro (ex: problemas de rede)
      return {
        success: false,
        error: 'Erro inesperado ao se comunicar com o gateway de pagamento.',
        details: (error instanceof Error) ? error.message : String(error)
      };
    }
  }
}

/**
 * Cria um estorno (reembolso) para uma intenção de pagamento específica no Stripe.
 *
 * @param paymentIntentId - O identificador da intenção de pagamento (`pi_...`) que será estornada.
 * @param amount? - O valor a ser estornado (em centavos). Quando omitido, estorna o valor total da transação.
 * @param reason? - O motivo do estorno (opcional).
 * @param idempotencyKey? - Chave de idempotência para evitar operações duplicadas (opcional).
 * @returns Promise<StripeResult<Stripe.Refund>> - Objeto com resultado de sucesso/falha e dados do estorno ou informações de erro.
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason,
  idempotencyKey?: string
): Promise<StripeResult<Stripe.Refund>> {
  if (!paymentIntentId) {
    return { success: false, error: 'ID do PaymentIntent é obrigatório para estorno.' };
  }
  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    return { success: false, error: 'Valor do estorno inválido.' };
  }
  if (!stripeSecretKey) return { success: false, error: 'Erro interno de configuração do servidor (Stripe).' };


  try {
    console.log(`[Stripe] Criando Refund para PaymentIntent: ${paymentIntentId} (Amount: ${amount ?? 'Total'})`);
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount) : undefined, // Estorna um valor específico ou o valor total da transação
      reason: reason,
      // metadata: { ... } // Possibilidade de adicionar metadados personalizados ao estorno
    };

    const requestOptions: Stripe.RequestOptions | undefined = idempotencyKey
      ? { idempotencyKey: idempotencyKey }
      : undefined;

    const refund: Stripe.Refund = await stripe.refunds.create(refundParams, requestOptions);

    console.log(`[Stripe] Refund ${refund.id} criado com status: ${refund.status}`);
    return { success: true, data: refund };

  } catch (error: unknown) {
    console.error('[Stripe] Erro ao processar estorno:', error);
    if ((error as Stripe.errors.StripeError)?.type) {
      const stripeError = error as Stripe.errors.StripeError;
      return { success: false, error: stripeError.message, code: stripeError.code };
    } else {
      return { success: false, error: 'Erro inesperado ao solicitar estorno.', details: (error instanceof Error) ? error.message : String(error) };
    }
  }
}


// --- Tratamento de Webhooks (Exemplo Estrutural) ---

/**
 * Constrói e verifica um evento de webhook recebido do Stripe.
 * Fundamental para receber notificações assíncronas sobre mudanças de status dos pagamentos.
 *
 * @param body - O corpo bruto da requisição do webhook (Buffer ou string).
 * @param signature - O cabeçalho 'stripe-signature' da requisição.
 * @returns Stripe.Event - O objeto de evento verificado e validado.
 * @throws Error - Se a assinatura for inválida ou a chave secreta do webhook não estiver configurada.
 */
export function constructWebhookEvent(body: Buffer | string, signature: string | string[] | Buffer | undefined): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Chave secreta específica para o endpoint do webhook

  if (!webhookSecret) {
    console.error("ERRO FATAL de Configuração: STRIPE_WEBHOOK_SECRET não definida no .env");
    throw new Error('Chave secreta do webhook não configurada no servidor.');
  }
  if (!signature) {
    throw new Error('Assinatura do webhook ausente.');
  }

  // Utiliza a biblioteca Stripe para verificar a assinatura e construir o objeto de evento
  // Esta verificação é crucial para proteger contra requisições falsificadas
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  console.log(`[Stripe Webhook] Evento recebido e verificado: ${event.type} (${event.id})`);
  return event;
}

// NOTA: A lógica para processar os diferentes tipos de eventos (ex: 'payment_intent.succeeded') 
// e atualizar o banco de dados deve ser implementada no controller que chama esta função
// (ex: handleWebhookFintech em pagamentoController.ts).

// As funções podem ser exportadas individualmente ou como um objeto
// export default { processPayment, processRefund, constructWebhookEvent };
