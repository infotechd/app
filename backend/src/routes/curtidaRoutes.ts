// src/routes/curtidaRoutes.ts

import { Router } from 'express';
// Importa o controller e middlewares (assumindo que serão criados/convertidos para .ts)
import curtidaController from '../controllers/curtidaController';
import authMiddleware from '../middlewares/authMiddleware';

const router: Router = Router();

// === ROTAS DE CURTIDAS (Likes) ===
// Todas as rotas exigem autenticação

// POST /api/curtidas : Usuário curte um item (Publicacao ou Comentario)
// Corpo da requisição deve conter { itemCurtidoId, tipoItemCurtido }
// Controller deve: verificar se item existe, tentar criar Curtida (índice único previne duplicados),
//                  se sucesso, incrementar contagemLikes no item pai via $inc.
router.post(
  '/',
  authMiddleware,
  curtidaController.curtirItem // Função a ser criada
);

// DELETE /api/curtidas : Usuário descurte um item (Publicacao ou Comentario)
// Corpo da requisição deve conter { itemCurtidoId, tipoItemCurtido }
// Controller deve: tentar remover Curtida, se sucesso, decrementar contagemLikes no item pai via $inc.
router.delete(
  '/',
  authMiddleware,
  curtidaController.descurtirItem // Função a ser criada
);

// GET /api/curtidas/item : Verifica se o usuário logado curtiu um item específico (Sugestão)
// Query params: ?itemCurtidoId=...&tipoItemCurtido=...
// Controller busca por usuarioId (logado), itemCurtidoId e tipoItemCurtido. Retorna true/false ou a curtida.
router.get(
  '/item',
  authMiddleware,
  curtidaController.verificarCurtida // Função a ser criada
);

// GET /api/curtidas/user/:userId : Lista itens curtidos por um usuário específico (Sugestão)
// Controller deve verificar permissão (usuário só pode ver suas curtidas? Ou é público?)
router.get(
  '/user/:userId',
  authMiddleware,
  // canViewUserLikes, // Middleware opcional
  curtidaController.listarItensCurtidosPeloUsuario // Função a ser criada
);

// GET /api/curtidas/item/:tipoItemCurtido/:itemCurtidoId/users : Lista usuários que curtiram um item (Sugestão)
// Geralmente usado para exibir "Fulano, Ciclano e outras X pessoas curtiram"
// Controller deve implementar paginação.
router.get(
  '/item/:tipoItemCurtido/:itemCurtidoId/users',
  authMiddleware, // Ou talvez público?
  curtidaController.listarUsuariosQueCurtiramItem // Função a ser criada
);


// Exporta o router configurado
export default router;