// src/routes/agendaRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as agendaController from '../controllers/agendaController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isPrestador } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS DE AGENDA (Todas protegidas por authMiddleware) ===
// A AUTORIZAÇÃO (usuário só acessa/modifica sua própria agenda)
// deve ser verificada dentro dos controllers ou em middlewares adicionais.

// GET /api/agenda : Busca a agenda do prestador autenticado
router.get(
  '/',
  authMiddleware,
  // isPrestador, // Middleware opcional para verificar se é prestador
  agendaController.getAgenda // Função a ser criada
);

// PUT /api/agenda/:agendaId/compromisso/:compromissoId : Atualiza o status de um compromisso específico
router.put(
  '/:agendaId/compromisso/:compromissoId',
  authMiddleware,
  // isPrestador, // Middleware opcional
  // isAgendaOwner, // Middleware opcional para verificar se é dono da agenda
  agendaController.updateCompromissoStatus // Função a ser criada
);

// Exporta o router configurado
export default router;