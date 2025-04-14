// src/routes/notificacaoRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as notificacaoController from '../controllers/notificacaoController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isNotificationOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE NOTIFICAÇÕES (Todas protegidas por authMiddleware) ===
// A AUTORIZAÇÃO (usuário só acessa/modifica suas próprias notificações, exceto Admin)
// deve ser verificada dentro dos controllers ou em middlewares adicionais.

// GET /api/notificacoes : Lista notificações do usuário logado
// Controller deve filtrar por req.user.userId e talvez por 'lida', implementar paginação.
router.get(
  '/',
  authMiddleware,
  notificacaoController.getNotificacoes
);

// PATCH /api/notificacoes/read-all : Marca todas as notificações do usuário logado como lidas (Sugestão)
// Controller deve atualizar todas as notificações onde usuarioId = req.user.userId e lida = false.
router.patch( // Usando PATCH para atualização de estado
  '/read-all',
  authMiddleware,
  notificacaoController.marcarTodasComoLidas // Função a ser criada
);

// PATCH /api/notificacoes/:notificacaoId/read : Marca uma notificação específica como lida (Sugestão)
// Usando PATCH e rota mais semântica. Controller deve verificar se req.user é dono da notificacaoId.
router.patch( // Usando PATCH em vez de PUT/:id/lida
  '/:notificacaoId/read',
  authMiddleware,
  // isNotificationOwner, // Middleware opcional
  notificacaoController.markAsRead // Controller atualiza o campo 'lida' para true
);


// DELETE /api/notificacoes/:notificacaoId : Exclui uma notificação específica
// Controller deve verificar se req.user é dono da notificacaoId.
router.delete(
  '/:notificacaoId',
  authMiddleware,
  // isNotificationOwner, // Middleware opcional
  notificacaoController.deleteNotificacao
);


// === ROTAS DE CRIAÇÃO (Restritas - Exemplo para Admin) ===

// POST /api/notificacoes/system : Admin cria uma notificação (ex: anúncio do sistema)
// Rota removida/protegida do POST / genérico. Requer Admin.
// Corpo da requisição pode especificar o destinatário (usuarioId) ou ser para todos.
// router.post(
//     '/system', // Rota específica para criação controlada
//     authMiddleware,
//     // isAdmin, // Middleware OBRIGATÓRIO
//     notificacaoController.createNotificacao // Controller lida com a criação para um ou mais usuários
// );

// Exporta o router configurado
export default router;