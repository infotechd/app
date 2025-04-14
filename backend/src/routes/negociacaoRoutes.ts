// src/routes/negociacaoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as negociacaoController from '../controllers/negociacaoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isBuyerOfContratacaoForNegociacao } from '../middlewares/authorizationMiddleware';
// import { isProviderOfNegociacao } from '../middlewares/authorizationMiddleware';
// import { isBuyerOfNegociacao } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE NEGOCIAÇÃO (Todas protegidas por authMiddleware) ===
// A AUTORIZAÇÃO específica (é o Buyer? é o Prestador? status permite?)
// deve ser verificada dentro dos controllers ou em middlewares adicionais.

// POST /api/negociacoes : Buyer inicia uma negociação para uma Contratacao (CU21)
// Controller deve verificar se req.user é o buyer da Contratacao e se pode iniciar.
router.post(
  '/',
  authMiddleware,
  // isBuyerOfContratacaoForNegociacao, // Middleware opcional
  negociacaoController.criarNegociacao
);

// GET /api/negociacoes/contratacao/:contratacaoId : Obtém a(s) negociação(ões) de uma Contratacao (Sugestão)
// Controller deve verificar se req.user é participante da Contratacao.
router.get(
  '/contratacao/:contratacaoId',
  authMiddleware,
  // isParticipantOfContratacao, // Middleware opcional
  negociacaoController.listarNegociacoesPorContratacao // Função a ser criada
);

// GET /api/negociacoes/:negociacaoId : Obtém detalhes e histórico de uma Negociacao (Sugestão)
// Controller deve verificar se req.user é participante (buyer ou prestador) da Negociacao.
router.get(
  '/:negociacaoId',
  authMiddleware,
  // isParticipantOfNegociacao, // Middleware opcional
  negociacaoController.obterDetalhesNegociacao // Função a ser criada
);


// PUT /api/negociacoes/:negociacaoId : Prestador responde à negociação (propõe, aceita, rejeita)
// Controller deve verificar se req.user é o prestador da Negociacao e se o status permite resposta.
router.put(
  '/:negociacaoId/responder', // Tornando a rota mais explícita para a ação
  authMiddleware,
  // isProviderOfNegociacao, // Middleware opcional
  negociacaoController.responderNegociacao
);

// PUT /api/negociacoes/:negociacaoId/finalizar : Buyer ou Prestador aceita/rejeita a última proposta
// Controller deve verificar se req.user é participante e se o status permite finalizar.
// A ação (aceitar/rejeitar) viria no corpo da requisição.
router.put(
  '/:negociacaoId/finalizar',
  authMiddleware,
  // isParticipantAndCanFinalize, // Middleware opcional
  negociacaoController.finalizarNegociacao // Função a ser criada (substitui confirmarNegociacao)
);


// Exporta o router configurado
export default router;