// src/routes/bloqueioAgendaRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão/criação para .ts)
import * as bloqueioAgendaController from '../controllers/bloqueioAgendaController'; // Controller a ser criado
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middleware de autorização específico
import { isPrestador } from '../middlewares/authorizationMiddleware'; // Middleware a ser criado (verifica se req.user.tipoUsuario === 'prestador')

const router: Router = Router();

// === ROTAS DE BLOQUEIO DE AGENDA (Requer Autenticação e ser Prestador) ===
// Todas as rotas abaixo devem ser acessadas apenas por usuários do tipo 'prestador'
// e geralmente só podem manipular os *seus próprios* bloqueios.

// Aplica authMiddleware e isPrestador a todas as rotas neste router
router.use(authMiddleware); // Garante que o usuário está logado
router.use(isPrestador);    // Garante que o usuário é um prestador

// POST /api/bloqueios-agenda : Cria um novo bloqueio de tempo para o prestador logado
// Corpo da requisição deve conter: { dataInicio, dataFim, motivo? }
// Controller usará req.user.userId como prestadorId.
router.post(
  '/',
  bloqueioAgendaController.criarBloqueio // Função a ser criada
);

// GET /api/bloqueios-agenda : Lista os bloqueios de tempo do prestador logado
// Pode aceitar query params para filtrar por data (ex: ?dataMin=...&dataMax=...)
// Controller buscará bloqueios usando req.user.userId como prestadorId.
router.get(
  '/',
  bloqueioAgendaController.listarMeusBloqueios // Função a ser criada
);

// DELETE /api/bloqueios-agenda/:bloqueioId : Deleta um bloqueio de tempo específico
// Controller deve verificar se o bloqueio com :bloqueioId pertence ao req.user.userId antes de deletar.
router.delete(
  '/:bloqueioId',
  bloqueioAgendaController.deletarBloqueio // Função a ser criada
);

// PUT /api/bloqueios-agenda/:bloqueioId : (Opcional) Atualiza um bloqueio de tempo
// Controller deve verificar se o bloqueio pertence ao req.user.userId.
// router.put(
//     '/:bloqueioId',
//     bloqueioAgendaController.atualizarBloqueio // Função a ser criada
// );


// Exporta o router configurado
export default router;