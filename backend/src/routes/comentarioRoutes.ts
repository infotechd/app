// src/routes/comentarioRoutes.ts

import { Router } from 'express';
// Importa o controller e middlewares (assumindo que serão criados/convertidos para .ts)
import * as comentarioController from '../controllers/comentarioController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Middlewares de autorização
// import { isComentarioOwnerOrAdmin } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE COMENTÁRIOS ===

// POST /api/comentarios : Cria um novo comentário (ou resposta)
// Requer autenticação. Corpo da req deve incluir publicacaoId, conteudo, e opcionalmente respostaParaComentarioId.
// Controller deve: validar dados, criar Comentario, incrementar contagemComentarios na PublicacaoComunidade.
router.post(
  '/',
  authMiddleware, // Precisa estar logado para comentar
  comentarioController.criarComentario // Função a ser criada
);

// GET /api/comentarios/publicacao/:publicacaoId : Lista comentários (aprovados) de uma publicação
// Geralmente pública. Controller deve implementar paginação e buscar por publicacaoId e status='aprovado'.
// Pode ordenar por createdAt. Pode carregar respostas aninhadas se necessário.
router.get(
  '/publicacao/:publicacaoId',
  // authMiddleware, // Descomentar se a visualização exigir login
  comentarioController.listarComentariosPorPublicacao // Função a ser criada
);

// PUT /api/comentarios/:comentarioId : Autor edita seu próprio comentário
// Requer autenticação. Controller deve verificar se req.user é o autor do comentário.
router.put(
  '/:comentarioId',
  authMiddleware,
  // isComentarioOwner, // Middleware opcional
  comentarioController.editarComentario // Função a ser criada
);

// DELETE /api/comentarios/:comentarioId : Autor ou Admin deleta um comentário
// Requer autenticação. Controller deve verificar se req.user é o autor OU admin.
// Precisa decrementar contagemComentarios na Publicacao se for comentário principal.
// Precisa decidir o que fazer com as respostas (deletar em cascata? marcar como órfã?).
router.delete(
  '/:comentarioId',
  authMiddleware,
  // isComentarioOwnerOrAdmin, // Middleware opcional
  comentarioController.deletarComentario // Função a ser criada
);

// PATCH /api/comentarios/:comentarioId/status : Admin modera um comentário (aprova/oculta) (Opcional)
// Requer autenticação e permissão de Admin.
router.patch(
  '/:comentarioId/status',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO
  comentarioController.moderarComentario // Função a ser criada
);

// --- Rotas para Likes de Comentários (Podem ficar em curtidaRoutes.ts) ---
// Ex: POST /api/comentarios/:comentarioId/like
// Ex: DELETE /api/comentarios/:comentarioId/like

// Exporta o router configurado
export default router;