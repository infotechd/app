// src/routes/curriculoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as curriculoController from '../controllers/curriculoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middleware de autorização específico
// import { isPrestador } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTA PÚBLICA/SEMIPÚBLICA (Sugestão) ===

// GET /api/curriculos/user/:prestadorId : Obtém o currículo público de um prestador específico
// Pode ser pública ou exigir apenas autenticação básica (authMiddleware)
router.get(
  '/user/:prestadorId',
  // authMiddleware, // Descomentar se visualização exigir login
  curriculoController.getPublicCurriculoByUserId // Função a ser criada
);


// === ROTAS PRIVADAS (Requer Autenticação e ser Prestador) ===
// O middleware authMiddleware garante o login.
// A verificação se é Prestador e age sobre o próprio currículo deve ocorrer nos controllers.

// POST /api/curriculos : Cria o currículo do prestador logado (CU2)
// Controller deve verificar se é Prestador e se já não existe currículo para ele.
router.post(
  '/',
  authMiddleware,
  // isPrestador, // Middleware opcional
  curriculoController.createCurriculo
);

// GET /api/curriculos : Obtém o currículo do prestador logado (CU2)
// Controller deve verificar se é Prestador e buscar pelo req.user.userId.
router.get(
  '/', // Rota implícita para "meu currículo"
  authMiddleware,
  // isPrestador, // Middleware opcional
  curriculoController.getCurriculoByPrestador // Busca pelo ID do usuário no token
);

// PUT /api/curriculos : Atualiza o currículo do prestador logado (CU2)
// Controller deve verificar se é Prestador e atualizar pelo req.user.userId.
router.put(
  '/', // Rota implícita para "meu currículo"
  authMiddleware,
  // isPrestador, // Middleware opcional
  curriculoController.updateCurriculo // Atualiza usando o ID do usuário no token
);

// DELETE /api/curriculos : (Opcional) Deleta o currículo do prestador logado
// router.delete(
//     '/',
//     authMiddleware,
//     // isPrestador, // Middleware opcional
//     curriculoController.deleteCurriculo // Função a ser criada
// );


// Exporta o router configurado
export default router;