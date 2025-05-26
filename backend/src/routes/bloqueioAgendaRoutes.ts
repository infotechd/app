// src/routes/bloqueioAgendaRoutes.ts

import { Router } from 'express';
// Importação dos controladores e middlewares necessários para as rotas de bloqueio de agenda
import * as bloqueioAgendaController from '../controllers/bloqueioAgendaController'; // Controlador responsável pelas operações de bloqueio de agenda
import authMiddleware from '../middlewares/authMiddleware';
// Importação do middleware de autorização para verificação do tipo de usuário
import { isPrestador } from '../middlewares/authorizationMiddleware'; // Middleware que verifica se o usuário é um prestador de serviços

// Criação do objeto router para definição das rotas
const router: Router = Router();

// === ROTAS DE BLOQUEIO DE AGENDA ===
// Estas rotas gerenciam os períodos em que o prestador não está disponível para atendimento
// Todas as rotas exigem autenticação e permissão de prestador de serviços
// Os prestadores só podem manipular seus próprios bloqueios de agenda

// Aplicação dos middlewares de autenticação e autorização em todas as rotas
router.use(authMiddleware); // Verifica se o usuário está autenticado no sistema
router.use(isPrestador);    // Verifica se o usuário possui o perfil de prestador de serviços

// Rota para criar um novo bloqueio de agenda
// Método POST na rota /api/bloqueios-agenda
// O corpo da requisição deve conter: { dataInicio, dataFim, motivo? }
// O ID do prestador é obtido automaticamente do usuário autenticado
router.post(
  '/',
  bloqueioAgendaController.criarBloqueio // Função do controlador que processa a criação do bloqueio
);

// Rota para listar os bloqueios de agenda do prestador autenticado
// Método GET na rota /api/bloqueios-agenda
// Aceita parâmetros de consulta para filtrar por período (exemplo: ?dataMin=...&dataMax=...)
// Os bloqueios são filtrados automaticamente pelo ID do prestador autenticado
router.get(
  '/',
  bloqueioAgendaController.listarMeusBloqueios // Função do controlador que busca e retorna os bloqueios
);

// Rota para excluir um bloqueio de agenda específico
// Método DELETE na rota /api/bloqueios-agenda/:bloqueioId
// O controlador verifica se o bloqueio pertence ao prestador autenticado antes de excluí-lo
router.delete(
  '/:bloqueioId',
  bloqueioAgendaController.deletarBloqueio // Função do controlador que processa a exclusão do bloqueio
);

// Rota opcional para atualizar um bloqueio de agenda existente
// Método PUT na rota /api/bloqueios-agenda/:bloqueioId
// O controlador verifica se o bloqueio pertence ao prestador autenticado
// router.put(
//     '/:bloqueioId',
//     bloqueioAgendaController.atualizarBloqueio // Função do controlador que processa a atualização do bloqueio
// );


// Exportação do router configurado para uso no arquivo principal da aplicação
export default router;
