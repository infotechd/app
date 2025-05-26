// src/routes/pagamentoRoutes.ts

import { Router } from 'express';
// Importa os controladores de pagamento e o middleware de autenticação
import * as pagamentoController from '../controllers/pagamentoController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser utilizados futuramente
// import { isBuyerOfContratacao } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';
// import { canRequestRefund } from '../middlewares/authorizationMiddleware';

// Inicializa o roteador Express
const router: Router = Router();

// === ROTAS DE PAGAMENTO (Protegidas por Autenticação) ===
// A autorização específica (verificação se o usuário é o comprador ou se pode estornar)
// deve ser implementada dentro dos controllers ou em middlewares de autorização adicionais.

// Rota: Inicia o processo de pagamento para uma Contratação
// Método: POST /api/pagamentos
// Casos de Uso: CU9, CU23
// Observação: O controller deve verificar se o usuário autenticado é o comprador da contratação
router.post(
  '/',
  authMiddleware,
  // isBuyerOfContratacao, // Middleware opcional
  pagamentoController.processarPagamento
);

// Rota: Lista o histórico de pagamentos do usuário logado
// Método: GET /api/pagamentos
// Observação: Função ainda precisa ser implementada
router.get(
  '/',
  authMiddleware,
  pagamentoController.listarMeusPagamentos // Função a ser criada
);

// Rota: Obtém detalhes e status de um pagamento específico
// Método: GET /api/pagamentos/:pagamentoId
// Observação: O controller deve verificar se o usuário tem permissão para visualizar este pagamento
// (se é o comprador, o prestador de serviço ou um administrador)
router.get(
  '/:pagamentoId',
  authMiddleware,
  // canViewPayment, // Middleware opcional
  pagamentoController.obterDetalhesPagamento // Função a ser criada
);


// Rota: Solicita o estorno de um pagamento
// Método: PUT /api/pagamentos/:pagamentoId/estornar
// Observação: O controller deve verificar se o usuário tem permissão para solicitar estorno
// (se é o comprador ou um administrador)
router.put( // Ou router.post
  '/:pagamentoId/estornar',
  authMiddleware,
  // canRequestRefund, // Middleware opcional
  pagamentoController.estornarPagamento
);


// === ROTAS DE WEBHOOK (NÃO protegidas por authMiddleware) ===
// Estas rotas recebem notificações de serviços externos e não requerem autenticação de usuário

// Rota: Recebe atualizações assíncronas da API de pagamento (Fintech)
// Método: POST /api/pagamentos/webhook/fintech
// Observação: O controller deve validar a autenticidade da requisição (ex: assinatura HMAC, IP)
// e atualizar o status do pagamento correspondente no banco de dados
router.post(
  '/webhook/fintech', // O nome exato da rota pode variar conforme a integração
  pagamentoController.handleWebhookFintech // Função a ser criada
);


// Exporta o router configurado
export default router;
