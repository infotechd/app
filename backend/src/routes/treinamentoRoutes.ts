// src/routes/treinamentoRoutes.ts

import { Router } from 'express';
// Importação dos controladores e middlewares necessários para as rotas de treinamento
import * as treinamentoController from '../controllers/treinamentoController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser implementados futuramente
// import { isAnunciante } from '../middlewares/authorizationMiddleware';
// import { isTreinamentoOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Criação do roteador para as rotas de treinamento
const router: Router = Router();

// === ROTAS PÚBLICAS (ou requerem apenas login básico) ===

// Rota: GET /api/treinamentos
// Função: Lista todos os treinamentos com status 'publicado' (CU25)
// Observação: O controlador deve aplicar filtro por status 'publicado'
router.get(
  '/',
  // authMiddleware, // Ativar se for necessário autenticação para listar
  treinamentoController.getPublicTreinamentos
);

// Rota: GET /api/treinamentos/:treinamentoId
// Função: Obtém detalhes de um treinamento específico que esteja publicado (CU25)
// Observação: O controlador deve verificar se o status é 'publicado' ou se o usuário possui permissão especial
router.get(
  '/:treinamentoId',
  // authMiddleware, // Ativar se for necessário autenticação para visualizar
  treinamentoController.getPublicTreinamentoById
);


// === ROTAS PRIVADAS / PARA ANUNCIANTES ===
// Estas rotas exigem autenticação (authMiddleware) e verificação de autorização (ser Anunciante e/ou Proprietário)

// Rota: POST /api/treinamentos
// Função: Cria um novo treinamento (CU26)
// Observação: O controlador deve verificar se o usuário é do tipo 'anunciante'
router.post(
  '/',
  authMiddleware,
  // isAnunciante, // Middleware opcional para verificação adicional
  treinamentoController.createTreinamento
);

// Rota: GET /api/treinamentos/my-trainings
// Função: Lista os treinamentos criados pelo anunciante que está logado
// Observação: O controlador deve verificar se o usuário é do tipo 'anunciante'
router.get(
  '/my-trainings',
  authMiddleware,
  // isAnunciante, // Middleware opcional para verificação adicional
  treinamentoController.listarMeusTreinamentos // Função que precisa ser implementada
);

// Rota: PUT /api/treinamentos/:treinamentoId
// Função: Atualiza um treinamento existente (CU26)
// Observação: O controlador deve verificar se o usuário é o proprietário do treinamento
router.put(
  '/:treinamentoId',
  authMiddleware,
  // isTreinamentoOwner, // Middleware opcional para verificação adicional
  treinamentoController.updateTreinamento
);

// Rota: DELETE /api/treinamentos/:treinamentoId
// Função: Remove um treinamento do sistema
// Observação: O controlador deve verificar se o usuário é o proprietário do treinamento ou um administrador
router.delete(
  '/:treinamentoId',
  authMiddleware,
  // isTreinamentoOwnerOrAdmin, // Middleware opcional para verificação adicional
  treinamentoController.deleteTreinamento // Função que precisa ser implementada
);


// === ROTAS DE ADMINISTRAÇÃO (Para moderação de conteúdo) ===

// Rota: GET /api/treinamentos/pending
// Função: Permite que administradores listem treinamentos pendentes de revisão
// router.get(
//     '/pending',
//     authMiddleware,
//     isAdmin, // Middleware obrigatório para garantir que apenas administradores acessem
//     treinamentoController.listarTreinamentosPendentes // Função que precisa ser implementada
// );

// Rota: PATCH /api/treinamentos/:treinamentoId/review
// Função: Permite que administradores aprovem ou rejeitem um treinamento
// router.patch(
//     '/:treinamentoId/review',
//     authMiddleware,
//     isAdmin, // Middleware obrigatório para garantir que apenas administradores acessem
//     treinamentoController.revisarTreinamento // Função que precisa ser implementada
// );

// === ROTAS DE INSCRIÇÃO (A serem implementadas em inscricaoTreinamentoRoutes.ts) ===
// Observação: É necessário criar rotas separadas para:
// - POST /api/treinamentos/:treinamentoId/inscricoes (Para usuários se inscreverem)
// - GET /api/inscricoes/my (Para usuários listarem suas inscrições)
// - PATCH /api/inscricoes/:inscricaoId (Para usuários atualizarem seu progresso)


// Exportação do roteador configurado para uso na aplicação
export default router;
