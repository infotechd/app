// src/routes/ofertaRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo que foram/serão convertidos para .ts)
import  * as ofertaController from '../controllers/ofertaController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isPrestador } from '../middlewares/authorizationMiddleware';
// import { isOfertaOwner } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS PÚBLICAS / PARA COMPRADORES ===

// GET /api/ofertas/search : Busca/lista ofertas disponíveis (CU4)
// Pode ou não requerer authMiddleware dependendo da regra de negócio
router.get('/search', /* authMiddleware (opcional), */ ofertaController.searchPublicOfertas);

// GET /api/ofertas/:ofertaId/public : Vê detalhes de uma oferta específica
// Pode ou não requerer authMiddleware
router.get('/:ofertaId/public', /* authMiddleware (opcional), */ ofertaController.getPublicOfertaById);


// === ROTAS PRIVADAS / PARA PRESTADORES ===
// Todas as rotas abaixo exigem que o usuário esteja logado (authMiddleware)
// A lógica de autorização (ser Prestador e/ou Dono da oferta) deve estar nos controllers ou middlewares específicos

// POST /api/ofertas : Cria uma nova oferta (CU3)
// Requer que o usuário logado seja um Prestador
router.post(
  '/',
  authMiddleware,
  // isPrestador, // Exemplo de middleware de autorização
  ofertaController.createOferta
);

// GET /api/ofertas/my-offers : Lista as ofertas criadas pelo Prestador logado (CU3)
// Renomeado de GET / para clareza
// Requer que o usuário logado seja um Prestador
router.get(
  '/my-offers',
  authMiddleware,
  // isPrestador, // Exemplo de middleware de autorização
  ofertaController.listOfertasByPrestador
);

// GET /api/ofertas/:ofertaId : Obtém detalhes de uma oferta específica do Prestador logado (para edição, etc.)
// Requer que o usuário logado seja o Prestador dono da oferta
router.get(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Exemplo
  // isOfertaOwner, // Exemplo
  ofertaController.getOwnOfertaDetails // Exemplo de nome de controller
);


// PUT /api/ofertas/:ofertaId : Atualiza uma oferta existente (CU3)
// Requer que o usuário logado seja o Prestador dono da oferta
router.put(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Exemplo
  // isOfertaOwner, // Exemplo
  ofertaController.updateOferta
);

// DELETE /api/ofertas/:ofertaId : Deleta uma oferta (CU3)
// Requer que o usuário logado seja o Prestador dono da oferta
router.delete(
  '/:ofertaId',
  authMiddleware,
  // isPrestador, // Exemplo
  // isOfertaOwner, // Exemplo
  ofertaController.deleteOferta
);


// Exporta o router configurado
export default router;