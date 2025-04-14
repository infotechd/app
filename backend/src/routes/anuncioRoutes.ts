// src/routes/anuncioRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as anuncioController from '../controllers/anuncioController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isAnunciante } from '../middlewares/authorizationMiddleware';
// import { isAnuncioOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS PÚBLICAS / PARA USUÁRIOS ===

// GET /api/anuncios/public : Lista anúncios aprovados/ativos (CU7 - parte de visualização)
router.get(
  '/public',
  // authMiddleware, // Descomentar se visualização exigir login
  anuncioController.listarAnunciosPublicos // Função a ser criada (com filtros/paginaçao)
);

// GET /api/anuncios/:anuncioId/public : Vê detalhes de um anúncio público específico
router.get(
  '/:anuncioId/public',
  // authMiddleware, // Descomentar se visualização exigir login
  anuncioController.obterDetalhesAnuncioPublico // Função a ser criada
);

// === ROTAS PRIVADAS / PARA ANUNCIANTES ===
// Todas exigem login (authMiddleware). Autorização (ser Anunciante e/ou Dono) deve ser verificada.

// POST /api/anuncios : Cria um novo anúncio (CU7 - parte de criação)
// Controller deve verificar se req.user.tipoUsuario === 'anunciante'
router.post(
  '/',
  authMiddleware,
  // isAnunciante, // Middleware opcional
  anuncioController.criarAnuncio
);

// GET /api/anuncios/my-ads : Lista os anúncios criados pelo Anunciante logado
// Controller deve verificar se req.user.tipoUsuario === 'anunciante'
router.get(
  '/my-ads',
  authMiddleware,
  // isAnunciante, // Middleware opcional
  anuncioController.listarMeusAnuncios // Função a ser criada
);

// GET /api/anuncios/:anuncioId : Obtém detalhes de um anúncio específico do Anunciante logado
// Controller deve verificar se req.user é dono do anuncioId
router.get(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional
  anuncioController.obterMeuAnuncioDetalhes // Função a ser criada
);

// PUT /api/anuncios/:anuncioId : Atualiza um anúncio existente (conteúdo, link, etc.)
// Controller deve verificar se req.user é dono do anuncioId
router.put(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional
  anuncioController.atualizarAnuncio // Nome anterior 'publicarAnuncio' removido/substituído
);

// PATCH /api/anuncios/:anuncioId/status : Anunciante submete para aprovação ou pausa/encerra (exemplo)
// Controller deve verificar se req.user é dono e se a mudança de status é permitida
router.patch(
  '/:anuncioId/status',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional
  anuncioController.atualizarStatusAnuncioAnunciante // Função a ser criada (ex: rascunho -> pendente, aprovado -> pausado)
);


// DELETE /api/anuncios/:anuncioId : Deleta um anúncio
// Controller deve verificar se req.user é dono do anuncioId
router.delete(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional
  anuncioController.deletarAnuncio // Função a ser criada
);

// === ROTAS DE ADMINISTRAÇÃO ===

// GET /api/anuncios/pending : Admin lista anúncios pendentes de aprovação (CU20)
router.get(
  '/pending',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO aqui
  anuncioController.listarAnunciosPendentes // Função a ser criada
);

// PATCH /api/anuncios/:anuncioId/review : Admin aprova ou rejeita um anúncio (CU20)
// Corpo da requisição deve indicar a ação (aprovar/rejeitar) e motivo (se rejeitar)
router.patch(
  '/:anuncioId/review',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO aqui
  anuncioController.revisarAnuncio // Função a ser criada
);

// Exporta o router configurado
export default router;