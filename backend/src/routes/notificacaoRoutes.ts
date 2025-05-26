// src/routes/notificacaoRoutes.ts

import { Router } from 'express';
// Importação dos controladores de notificação e middleware de autenticação
import * as notificacaoController from '../controllers/notificacaoController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser implementados futuramente:
// import { isNotificationOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === CONFIGURAÇÃO DAS ROTAS DE NOTIFICAÇÕES ===
// Todas as rotas são protegidas pelo middleware de autenticação
// A verificação de autorização (se o usuário pode acessar/modificar suas próprias notificações)
// deve ser implementada nos controladores ou em middlewares adicionais

// Rota para listar todas as notificações do usuário autenticado
// O controlador deve filtrar as notificações pelo ID do usuário logado
// e possivelmente pelo status de leitura, além de implementar paginação
router.get(
  '/',
  authMiddleware,
  notificacaoController.getNotificacoes
);

// Rota para marcar todas as notificações do usuário como lidas
// O controlador deve atualizar todas as notificações não lidas do usuário autenticado
router.patch(
  '/read-all',
  authMiddleware,
  notificacaoController.marcarTodasComoLidas
);

// Rota para marcar uma notificação específica como lida
// Utiliza o método PATCH para atualizar apenas o status de leitura
// O controlador deve verificar se o usuário é o proprietário da notificação
router.patch(
  '/:notificacaoId/read',
  authMiddleware,
  // isNotificationOwner, // Middleware que pode ser implementado para verificação de propriedade
  notificacaoController.markAsRead
);

// Rota para excluir uma notificação específica
// O controlador deve verificar se o usuário é o proprietário da notificação
router.delete(
  '/:notificacaoId',
  authMiddleware,
  // isNotificationOwner, // Middleware que pode ser implementado para verificação de propriedade
  notificacaoController.deleteNotificacao
);

// === ROTAS ADMINISTRATIVAS (RESTRITAS) ===

// Rota para criação de notificações pelo administrador do sistema
// Esta rota está comentada e deve ser implementada apenas para usuários com privilégios de administrador
// O corpo da requisição pode especificar um destinatário específico ou todos os usuários
// router.post(
//     '/system',
//     authMiddleware,
//     // isAdmin, // Middleware necessário para verificar se o usuário é administrador
//     notificacaoController.createNotificacao
// );

// Exportação do roteador configurado
export default router;
