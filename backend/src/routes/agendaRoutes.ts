// Arquivo de rotas para gerenciamento da agenda

import { Router } from 'express';
// Importação dos controladores de agenda e middleware de autenticação
import * as agendaController from '../controllers/agendaController';
import authMiddleware from '../middlewares/authMiddleware';
// Possibilidade de importar middlewares específicos de autorização
// import { isPrestador } from '../middlewares/authorizationMiddleware';

// Criação do roteador para as rotas de agenda
const router: Router = Router();

// === CONFIGURAÇÃO DAS ROTAS DE AGENDA ===
// Todas as rotas são protegidas pelo middleware de autenticação
// A verificação de autorização (se o usuário pode acessar/modificar sua própria agenda)
// deve ser implementada nos controladores ou em middlewares adicionais

// Rota GET para buscar a agenda do prestador que está autenticado
router.get(
  '/',
  authMiddleware,
  // isPrestador, // Middleware que poderia verificar se o usuário é um prestador
  agendaController.getAgenda // Controlador que busca os dados da agenda
);

// Rota PUT para atualizar o status de um compromisso específico na agenda
router.put(
  '/:agendaId/compromisso/:compromissoId',
  authMiddleware,
  // isPrestador, // Middleware que poderia verificar se o usuário é um prestador
  // isAgendaOwner, // Middleware que poderia verificar se o usuário é dono da agenda
  agendaController.updateCompromissoStatus // Controlador que atualiza o status do compromisso
);

// Exportação do roteador configurado para uso na aplicação
export default router;
