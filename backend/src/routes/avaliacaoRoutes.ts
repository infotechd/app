// src/routes/avaliacaoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as avaliacaoController from '../controllers/avaliacaoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { canEvaluate, isAvaliacaoOwner } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE AVALIAÇÃO ===

// POST /api/avaliacoes : Registra uma nova avaliação para uma Contratacao concluída (CU10)
// Requer autenticação. Controller deve validar se o autor participou da contratação,
// se o receptor é o outro participante, se a contratação está concluída,
// e se o autor ainda não avaliou o receptor para esta contratação.
router.post(
  '/',
  authMiddleware,
  // canEvaluate, // Middleware opcional para encapsular validações
  avaliacaoController.registrarAvaliacao
);

// GET /api/avaliacoes/user/:userId : Lista avaliações RECEBIDAS por um usuário (Sugestão)
// Pode ser pública ou requerer autenticação dependendo da regra
router.get(
  '/user/:userId',
  // authMiddleware, // Opcional
  avaliacaoController.listarAvaliacoesRecebidas // Função a ser criada
);

// GET /api/avaliacoes/contratacao/:contratacaoId : Lista avaliações de uma contratação específica (Sugestão)
// Requer autenticação. Controller deve verificar se o usuário logado participou da contratação.
router.get(
  '/contratacao/:contratacaoId',
  authMiddleware,
  // isParticipantOfContratacao, // Middleware opcional
  avaliacaoController.listarAvaliacoesDaContratacao // Função a ser criada
);

// PUT /api/avaliacoes/:avaliacaoId : Edita uma avaliação existente (Se permitido pelas regras de negócio)
// Requer autenticação. Controller deve verificar se o usuário logado é o autor da avaliação
// e se a edição ainda é permitida (ex: dentro de X tempo após criação).
router.put(
  '/:avaliacaoId',
  authMiddleware,
  // isAvaliacaoOwner, // Middleware opcional
  avaliacaoController.editarAvaliacao
);

// DELETE /api/avaliacoes/:avaliacaoId : Deleta uma avaliação (Se permitido)
// Requer autenticação. Controller deve verificar se o usuário logado é o autor ou um admin.
// router.delete(
//     '/:avaliacaoId',
//     authMiddleware,
//     // isAvaliacaoOwnerOrAdmin, // Middleware opcional
//     avaliacaoController.deleteAvaliacao // Função a ser criada
// );


// Exporta o router configurado
export default router;