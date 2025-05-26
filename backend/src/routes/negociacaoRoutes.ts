// src/routes/negociacaoRoutes.ts

import { Router } from 'express';
// Importa os controladores de negociação e middleware de autenticação
import * as negociacaoController from '../controllers/negociacaoController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que poderiam ser utilizados
// import { isBuyerOfContratacaoForNegociacao } from '../middlewares/authorizationMiddleware';
// import { isProviderOfNegociacao } from '../middlewares/authorizationMiddleware';
// import { isBuyerOfNegociacao } from '../middlewares/authorizationMiddleware';

// Cria uma instância do roteador Express
const router: Router = Router();

// === ROTAS DE NEGOCIAÇÃO (Todas protegidas por authMiddleware) ===
// A autorização específica (é o comprador? é o prestador? o status permite?)
// deve ser verificada dentro dos controllers ou em middlewares adicionais.

// Rota para criar uma nova negociação
// POST /api/negociacoes : Comprador inicia uma negociação para uma Contratação (CU21)
// O controller verifica se o usuário é o comprador da Contratação e se pode iniciar
router.post(
  '/',
  authMiddleware,
  // isBuyerOfContratacaoForNegociacao, // Middleware opcional
  negociacaoController.criarNegociacao
);

// Rota para listar negociações de uma contratação específica
// GET /api/negociacoes/contratacao/:contratacaoId : Obtém a(s) negociação(ões) de uma Contratação
// O controller verifica se o usuário é participante da Contratação
router.get(
  '/contratacao/:contratacaoId',
  authMiddleware,
  // isParticipantOfContratacao, // Middleware opcional
  negociacaoController.listarNegociacoesPorContratacao // Função a ser implementada
);

// Rota para obter detalhes de uma negociação específica
// GET /api/negociacoes/:negociacaoId : Obtém detalhes e histórico de uma Negociação
// O controller verifica se o usuário é participante (comprador ou prestador) da Negociação
router.get(
  '/:negociacaoId',
  authMiddleware,
  // isParticipantOfNegociacao, // Middleware opcional
  negociacaoController.obterDetalhesNegociacao // Função a ser implementada
);

// Rota para o prestador responder a uma negociação
// PUT /api/negociacoes/:negociacaoId/responder : Prestador responde à negociação (propõe, aceita, rejeita)
// O controller verifica se o usuário é o prestador da Negociação e se o status permite resposta
router.put(
  '/:negociacaoId/responder', // Rota explícita para a ação de responder
  authMiddleware,
  // isProviderOfNegociacao, // Middleware opcional
  negociacaoController.responderNegociacao
);

// Rota para finalizar uma negociação
// PUT /api/negociacoes/:negociacaoId/finalizar : Comprador ou Prestador aceita/rejeita a última proposta
// O controller verifica se o usuário é participante e se o status permite finalizar
// A ação (aceitar/rejeitar) é enviada no corpo da requisição
router.put(
  '/:negociacaoId/finalizar',
  authMiddleware,
  // isParticipantAndCanFinalize, // Middleware opcional
  negociacaoController.finalizarNegociacao // Função a ser implementada (substitui confirmarNegociacao)
);

// Exporta o roteador configurado para uso na aplicação
export default router;
