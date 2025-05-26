// src/routes/anuncioRoutes.ts

import { Router } from 'express';
// Importa os controladores de anúncios e middleware de autenticação
import * as anuncioController from '../controllers/anuncioController';
import authMiddleware from '../middlewares/authMiddleware';
// Importa os middlewares de validação para anúncios
import { validateCreateAnuncio, validateUpdateAnuncio } from '../middlewares/zodValidationMiddleware';
// Middlewares de autorização que podem ser implementados futuramente
// import { isAnunciante } from '../middlewares/authorizationMiddleware';
// import { isAnuncioOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Inicializa o roteador Express para gerenciar as rotas de anúncios
const router: Router = Router();

// === ROTAS PÚBLICAS / PARA USUÁRIOS ===
// Seção de rotas que podem ser acessadas sem autenticação ou por qualquer usuário autenticado

// Rota para listar todos os anúncios aprovados e ativos
// Implementa o caso de uso CU7 (parte de visualização)
router.get(
  '/public',
  // authMiddleware, // Descomentar se a visualização precisar de login
  anuncioController.listarAnunciosPublicos // Controlador que implementará filtros e paginação
);

// Rota para visualizar os detalhes completos de um anúncio específico que está público
router.get(
  '/:anuncioId/public',
  // authMiddleware, // Descomentar se a visualização precisar de login
  anuncioController.obterDetalhesAnuncioPublico // Controlador para obter detalhes do anúncio
);

// === ROTAS PRIVADAS / PARA ANUNCIANTES ===
// Seção de rotas que exigem autenticação (authMiddleware)
// O sistema deve verificar se o usuário é um anunciante e/ou dono do anúncio

// Rota para criar um novo anúncio
// Implementa o caso de uso CU7 (parte de criação)
// O controlador verificará se o usuário tem o tipo 'anunciante'
router.post(
  '/',
  authMiddleware,
  // isAnunciante, // Middleware opcional para verificação adicional
  validateCreateAnuncio, // Middleware para validar os dados do anúncio
  anuncioController.criarAnuncio
);

// Rota para listar todos os anúncios criados pelo anunciante logado
// O controlador verificará se o usuário tem o tipo 'anunciante'
router.get(
  '/my-ads',
  authMiddleware,
  // isAnunciante, // Middleware opcional para verificação adicional
  anuncioController.listarMeusAnuncios // Controlador para listar anúncios do usuário
);

// Rota para obter detalhes completos de um anúncio específico do anunciante logado
// O controlador verificará se o usuário é o dono do anúncio solicitado
router.get(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional para verificação adicional
  anuncioController.obterMeuAnuncioDetalhes // Controlador para obter detalhes do anúncio
);

// Rota para atualizar informações de um anúncio existente (conteúdo, link, etc.)
// O controlador verificará se o usuário é o dono do anúncio
router.put(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional para verificação adicional
  validateUpdateAnuncio, // Middleware para validar os dados de atualização do anúncio
  anuncioController.atualizarAnuncio // Controlador para atualizar o anúncio
);

// Rota para alterar o status de um anúncio (submeter para aprovação, pausar ou encerrar)
// O controlador verificará se o usuário é o dono e se a mudança de status é permitida
router.patch(
  '/:anuncioId/status',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional para verificação adicional
  anuncioController.atualizarStatusAnuncioAnunciante // Controlador para atualizar status (ex: rascunho -> pendente, aprovado -> pausado)
);

// Rota para excluir um anúncio
// O controlador verificará se o usuário é o dono do anúncio
router.delete(
  '/:anuncioId',
  authMiddleware,
  // isAnuncioOwner, // Middleware opcional para verificação adicional
  anuncioController.deletarAnuncio // Controlador para excluir o anúncio
);

// === ROTAS DE ADMINISTRAÇÃO ===
// Seção de rotas exclusivas para administradores do sistema

// Rota para listar todos os anúncios pendentes de aprovação
// Implementa o caso de uso CU20 (moderação de anúncios)
router.get(
  '/pending',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO para verificar se o usuário é administrador
  anuncioController.listarAnunciosPendentes // Controlador para listar anúncios pendentes
);

// Rota para aprovar ou rejeitar um anúncio
// Implementa o caso de uso CU20 (moderação de anúncios)
// O corpo da requisição deve conter a ação (aprovar/rejeitar) e motivo (caso seja rejeição)
router.patch(
  '/:anuncioId/review',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO para verificar se o usuário é administrador
  anuncioController.revisarAnuncio // Controlador para aprovar/rejeitar anúncios
);

// Exporta o roteador configurado para ser utilizado no arquivo principal da aplicação
export default router;
