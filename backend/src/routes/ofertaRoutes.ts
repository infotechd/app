// src/routes/ofertaRoutes.ts

import { Router } from 'express';
// Importa os controladores de oferta e middleware de autenticação
import  * as ofertaController from '../controllers/ofertaController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser implementados futuramente
// import { isPrestador } from '../middlewares/authorizationMiddleware';
// import { isOfertaOwner } from '../middlewares/authorizationMiddleware';

// Inicializa o roteador Express
const router: Router = Router();

// === ROTAS PÚBLICAS / PARA COMPRADORES ===

// Rota para buscar e listar ofertas disponíveis para o público (Caso de Uso 4)
// A autenticação pode ser opcional dependendo das regras de negócio
router.get('/search', /* authMiddleware (opcional), */ ofertaController.searchPublicOfertas);

// Rota para visualizar detalhes públicos de uma oferta específica pelo ID
// A autenticação pode ser opcional para esta rota
router.get('/:ofertaId/public', /* authMiddleware (opcional), */ ofertaController.getPublicOfertaById);


// === ROTAS PRIVADAS / PARA PRESTADORES ===
// Todas as rotas a seguir necessitam que o usuário esteja autenticado (authMiddleware)
// A verificação de permissões (ser Prestador e/ou Dono da oferta) deve ser implementada nos controladores ou middlewares específicos

// Rota para criar uma nova oferta (Caso de Uso 3)
// Requer que o usuário autenticado tenha perfil de Prestador
router.post(
  '/',
  authMiddleware,
  // isPrestador, // Middleware de autorização que pode ser implementado
  ofertaController.createOferta
);

// Rota para listar todas as ofertas criadas pelo Prestador autenticado (Caso de Uso 3)
// Esta rota foi renomeada de GET / para /my-offers para maior clareza
// Requer que o usuário autenticado tenha perfil de Prestador
router.get(
  '/my-offers',
  authMiddleware,
  // isPrestador, // Middleware de autorização que pode ser implementado
  ofertaController.listOfertasByPrestador
);

// Rota para obter detalhes completos de uma oferta específica do Prestador autenticado (para edição e outras operações)
// Requer que o usuário autenticado seja o Prestador proprietário da oferta
router.get(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.getOwnOfertaDetails
);


// Rota para atualizar uma oferta existente (Caso de Uso 3)
// Requer que o usuário autenticado seja o Prestador proprietário da oferta
router.put(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.updateOferta
);

// Rota para excluir uma oferta existente (Caso de Uso 3)
// Requer que o usuário autenticado seja o Prestador proprietário da oferta
router.delete(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Middleware de verificação de perfil
  // isOfertaOwner, // Middleware de verificação de propriedade
  ofertaController.deleteOferta
);


// Exporta o roteador configurado para uso no aplicativo
export default router;
