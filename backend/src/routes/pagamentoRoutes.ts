// src/routes/pagamentoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as pagamentoController from '../controllers/pagamentoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isBuyerOfContratacao } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';
// import { canRequestRefund } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE PAGAMENTO (Protegidas por Autenticação) ===
// A AUTORIZAÇÃO específica (é o comprador? pode estornar?) deve ser verificada
// dentro dos controllers ou em middlewares de autorização adicionais.

// POST /api/pagamentos : Inicia o processo de pagamento para uma Contratacao (CU9, CU23)
// Controller deve verificar se req.user é o buyerId da Contratacao a ser paga.
router.post(
  '/',
  authMiddleware,
  // isBuyerOfContratacao, // Middleware opcional
  pagamentoController.processarPagamento
);

// GET /api/pagamentos : Lista o histórico de pagamentos do usuário logado (Sugestão)
router.get(
  '/',
  authMiddleware,
  pagamentoController.listarMeusPagamentos // Função a ser criada
);

// GET /api/pagamentos/:pagamentoId : Obtém detalhes/status de um pagamento específico (Sugestão)
// Controller deve verificar se req.user tem permissão para ver este pagamento (buyer, prestador ou admin?)
router.get(
  '/:pagamentoId',
  authMiddleware,
  // canViewPayment, // Middleware opcional
  pagamentoController.obterDetalhesPagamento // Função a ser criada
);


// PUT ou POST /api/pagamentos/:pagamentoId/estornar : Solicita o estorno de um pagamento
// Controller deve verificar se req.user tem permissão para solicitar estorno (buyer, admin?)
router.put( // Ou router.post
  '/:pagamentoId/estornar',
  authMiddleware,
  // canRequestRefund, // Middleware opcional
  pagamentoController.estornarPagamento
);


// === ROTAS DE WEBHOOK (NÃO protegidas por authMiddleware) ===

// POST /api/pagamentos/webhook/fintech : Recebe atualizações assíncronas da APIFintech (Sugestão Essencial)
// Controller deve validar a autenticidade da requisição (ex: assinatura HMAC, IP)
// e atualizar o status do Pagamento correspondente no banco.
router.post(
  '/webhook/fintech', // O nome exato da rota pode variar
  pagamentoController.handleWebhookFintech // Função a ser criada
);


// Exporta o router configurado
export default router;