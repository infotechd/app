// src/routes/treinamentoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as treinamentoController from '../controllers/treinamentoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isAnunciante } from '../middlewares/authorizationMiddleware';
// import { isTreinamentoOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS PÚBLICAS (ou requerem apenas login básico) ===

// GET /api/treinamentos : Lista treinamentos publicados (CU25)
// Controller deve filtrar por status: 'publicado'
router.get(
  '/',
  // authMiddleware, // Descomentar se a listagem exigir login
  treinamentoController.getPublicTreinamentos // Nome atual, talvez renomear para getPublicTreinamentos
);

// GET /api/treinamentos/:treinamentoId : Obtém detalhes de um treinamento publicado específico (CU25)
// Controller deve verificar se status é 'publicado' ou se usuário tem permissão especial
router.get(
  '/:treinamentoId',
  // authMiddleware, // Descomentar se a visualização exigir login
  treinamentoController.getPublicTreinamentoById // Nome atual, talvez renomear para getPublicTreinamentoById
);


// === ROTAS PRIVADAS / PARA ANUNCIANTES ===
// Exigem login (authMiddleware). Autorização (ser Anunciante e/ou Dono) deve ser verificada.

// POST /api/treinamentos : Cria um novo treinamento (CU26)
// Controller deve verificar se req.user.tipoUsuario === 'anunciante'
router.post(
  '/',
  authMiddleware,
  // isAnunciante, // Middleware opcional
  treinamentoController.createTreinamento
);

// GET /api/treinamentos/my-trainings : Lista os treinamentos criados pelo Anunciante logado (Sugestão)
// Controller deve verificar se req.user.tipoUsuario === 'anunciante'
router.get(
  '/my-trainings',
  authMiddleware,
  // isAnunciante, // Middleware opcional
  treinamentoController.listarMeusTreinamentos // Função a ser criada
);

// PUT /api/treinamentos/:treinamentoId : Atualiza um treinamento existente (CU26)
// Controller deve verificar se req.user é dono do treinamentoId
router.put(
  '/:treinamentoId',
  authMiddleware,
  // isTreinamentoOwner, // Middleware opcional
  treinamentoController.updateTreinamento
);

// DELETE /api/treinamentos/:treinamentoId : Deleta um treinamento (Sugestão)
// Controller deve verificar se req.user é dono do treinamentoId (ou Admin)
router.delete(
  '/:treinamentoId',
  authMiddleware,
  // isTreinamentoOwnerOrAdmin, // Middleware opcional
  treinamentoController.deleteTreinamento // Função a ser criada
);


// === ROTAS DE ADMINISTRAÇÃO (Exemplo - Se houver moderação) ===

// GET /api/treinamentos/pending : Admin lista treinamentos pendentes de revisão
// router.get(
//     '/pending',
//     authMiddleware,
//     isAdmin, // Middleware OBRIGATÓRIO
//     treinamentoController.listarTreinamentosPendentes // Função a ser criada
// );

// PATCH /api/treinamentos/:treinamentoId/review : Admin aprova ou rejeita um treinamento
// router.patch(
//     '/:treinamentoId/review',
//     authMiddleware,
//     isAdmin, // Middleware OBRIGATÓRIO
//     treinamentoController.revisarTreinamento // Função a ser criada
// );

// === ROTAS DE INSCRIÇÃO (Devem ir para inscricaoTreinamentoRoutes.ts) ===
// Lembrete: Criar rotas separadas para:
// - POST /api/treinamentos/:treinamentoId/inscricoes (Usuário se inscreve)
// - GET /api/inscricoes/my (Usuário lista suas inscrições)
// - PATCH /api/inscricoes/:inscricaoId (Usuário atualiza progresso)


// Exporta o router configurado
export default router;