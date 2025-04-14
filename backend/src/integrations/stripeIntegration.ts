// src/integrations/stripeIntegration.ts

/**
 * Módulo de integração com a API de pagamento Stripe.
 */
import Stripe from 'stripe';

// --- Interfaces ---

// Interface para os parâmetros da função processPayment
interface ProcessPaymentParams {
  amount: number; // Em centavos
  currency?: string; // ex: 'brl'
  paymentMethodId: string; // ID do PaymentMethod gerado no frontend
  customerId?: string; // ID do Cliente Stripe (opcional, mas recomendado)
  description?: string; // Descrição para o Stripe
  metadata?: { [key: string]: string | number | null }; // Metadados (ex: contratacaoId, userId)
  idempotencyKey?: string; // Chave para evitar processamento duplicado
}

// Interface para o resultado padronizado retornado pelas funções
type StripeResult<T> =
  | { success: true; data: T }
  | {
  success: false;
  error: string; // Mensagem de erro principal
  type?: Stripe.StripeRawError; // Tipo do erro Stripe (ex: card_error)
  code?: string; // Código específico do erro
  decline_code?: string; // Código de recusa do cartão
  status?: number; // Status HTTP (se aplicável)
  details?: any; // Detalhes adicionais do erro
};

// --- Inicialização do Cliente Stripe ---

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error("ERRO FATAL de Configuração: STRIPE_SECRET_KEY não definida no .env");
  // Lançar erro ou definir um cliente inválido para evitar erros em tempo de execução?
  // Por segurança, é melhor não continuar sem a chave em muitos casos.
  // throw new Error("Chave secreta do Stripe não configurada.");
}

// Inicializa o cliente Stripe com a chave secreta e uma versão da API
// É recomendado especificar a versão da API para evitar quebras inesperadas
const stripe = new Stripe(stripeSecretKey || 'sk_test_invalidkey', { // Usa chave inválida se não configurada para evitar crash total
  apiVersion: '2025-03-31.basil', // Use a versão compatível com a biblioteca Stripe
  typescript: true, // Habilita type hints da biblioteca Stripe
});

// --- Funções de Integração ---

/**
 * Cria e tenta confirmar um PaymentIntent no Stripe.
 * NOTA: Esta abordagem de confirmação imediata pode exigir tratamento de SCA/3D Secure no frontend
 * ou um fluxo baseado em webhooks para confirmação final.
 *
 * @param params - Parâmetros do pagamento (amount, paymentMethodId, etc.).
 * @returns Promise<StripeResult<Stripe.PaymentIntent>> - Objeto com sucesso/falha e dados do PaymentIntent ou erro.
 */
export async function processPayment(params: ProcessPaymentParams): Promise<StripeResult<Stripe.PaymentIntent>> {
  const { amount, currency = 'brl', paymentMethodId, customerId, description, metadata, idempotencyKey } = params;

  // Validação básica (melhor feita antes de chamar esta função)
  if (!paymentMethodId || !amount || amount <= 0) {
    return { success: false, error: 'Parâmetros inválidos para processar pagamento (amount, paymentMethodId obrigatórios).' };
  }
  if (!stripeSecretKey) return { success: false, error: 'Erro interno de configuração do servidor (Stripe).' };


  try {
    console.log(`[Stripe] Criando PaymentIntent: ${amount} ${currency.toUpperCase()}`);

    // Opções para a chave de idempotência
    const requestOptions: Stripe.RequestOptions | undefined = idempotencyKey
      ? { idempotencyKey: idempotencyKey }
      : undefined;

    // Cria o PaymentIntent já tentando confirmar
    const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Garante que é inteiro (centavos)
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      customer: customerId, // Associar ao cliente Stripe, se existir
      confirm: true, // Tenta confirmar agora
      confirmation_method: 'automatic', // 'automatic' é mais comum com confirm: true, permite Stripe decidir o fluxo (manual pode ser necessário em casos específicos)
      return_url: process.env.STRIPE_RETURN_URL, // URL para onde o usuário volta após ações (ex: 3DS) - NECESSÁRIO para alguns fluxos
      description: description,
      metadata: metadata, // Envia metadados úteis (ex: ID da sua contratação)
      // off_session: false, // Indica que o cliente está presente (sessão ativa)
      // error_on_requires_action: false, // Se false (default), retorna PI com status requires_action em vez de erro
    }, requestOptions); // Passa opções com idempotencyKey se houver

    // IMPORTANTE: O controller que chama esta função PRECISA verificar paymentIntent.status
    console.log(`[Stripe] PaymentIntent ${paymentIntent.id} criado com status: ${paymentIntent.status}`);
    return { success: true, data: paymentIntent };

  } catch (error: unknown) {
    console.error('[Stripe] Erro ao processar pagamento:', error);
    // Trata erros específicos do Stripe
    if ((error as Stripe.errors.StripeError)?.type) {
      const stripeError = error as Stripe.errors.StripeError;
      return {
        success: false,
        error: stripeError.message, // Mensagem principal do erro Stripe
        code: stripeError.code,
        decline_code: stripeError.decline_code, // Específico para erros de cartão
        details: stripeError // Pode retornar o objeto de erro completo para log interno se necessário
      };
    } else {
      // Outros erros (ex: rede)
      return {
        success: false,
        error: 'Erro inesperado ao se comunicar com o gateway de pagamento.',
        details: (error instanceof Error) ? error.message : String(error)
      };
    }
  }
}

/**
 * Cria um estorno (refund) para um PaymentIntent específico no Stripe.
 *
 * @param paymentIntentId - O ID do PaymentIntent (`pi_...`) a ser estornado.
 * @param amount? - O valor a ser estornado (em centavos). Se omitido, estorna o valor total.
 * @param reason? - O motivo do estorno (opcional).
 * @param idempotencyKey? - Chave de idempotência (opcional).
 * @returns Promise<StripeResult<Stripe.Refund>> - Objeto com sucesso/falha e dados do Refund ou erro.
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
      amount: amount ? Math.round(amount) : undefined, // Estorna valor específico ou total
      reason: reason,
      // metadata: { ... } // Pode adicionar metadados ao estorno
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


// --- Webhook Handling (Exemplo Estrutural) ---

/**
 * Constrói e verifica um evento de webhook do Stripe.
 * Essencial para receber atualizações assíncronas de pagamento.
 *
 * @param body - O corpo raw da requisição do webhook (Buffer ou string).
 * @param signature - O header 'stripe-signature' da requisição.
 * @returns Stripe.Event - O objeto de evento verificado.
 * @throws Error - Se a assinatura for inválida ou a chave do endpoint estiver faltando.
 */
export function constructWebhookEvent(body: Buffer | string, signature: string | string[] | Buffer | undefined): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Chave específica do endpoint do webhook

  if (!webhookSecret) {
    console.error("ERRO FATAL de Configuração: STRIPE_WEBHOOK_SECRET não definida no .env");
    throw new Error('Webhook secret não configurado no servidor.');
  }
  if (!signature) {
    throw new Error('Assinatura do webhook ausente.');
  }

  // Usa a biblioteca Stripe para verificar a assinatura e construir o evento
  // Isso protege contra requisições forjadas. Lança exceção se inválido.
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  console.log(`[Stripe Webhook] Evento recebido e verificado: ${event.type} (${event.id})`);
  return event;
}

// NOTA: A lógica para *processar* o 'event.type' (ex: 'payment_intent.succeeded') e
// atualizar o banco de dados deve ficar no controller que chama constructWebhookEvent
// (ex: handleWebhookFintech em pagamentoController.ts).

// Pode exportar as funções individualmente ou em um objeto
// export default { processPayment, processRefund, constructWebhookEvent };