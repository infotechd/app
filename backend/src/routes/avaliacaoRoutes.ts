// src/routes/avaliacaoRoutes.ts

import { Router } from 'express';
// Importa o módulo Router do Express para definir as rotas da API
import * as avaliacaoController from '../controllers/avaliacaoController';
// Importa todos os controladores relacionados às avaliações
import authMiddleware from '../middlewares/authMiddleware';
// Importa o middleware de autenticação para proteger rotas que exigem login
// Middlewares de autorização específicos podem ser adicionados conforme necessário
// import { canEvaluate, isAvaliacaoOwner } from '../middlewares/authorizationMiddleware';

const router: Router = Router();
// Cria uma instância do Router para definir as rotas de avaliação

// === ROTAS DE AVALIAÇÃO ===

// Rota para registrar uma nova avaliação
// Requer autenticação do usuário
// O controlador verifica se:
// - O autor participou da contratação
// - O receptor é o outro participante da contratação
// - A contratação está concluída
// - O autor ainda não avaliou o receptor para esta contratação
router.post(
  '/',
  authMiddleware,
  // Middleware que verifica se o usuário está autenticado
  // Poderia usar middleware adicional para verificar permissões específicas
  avaliacaoController.registrarAvaliacao
  // Função do controlador que processa a requisição
);

// Rota para listar todas as avaliações recebidas por um usuário específico
// Identificado pelo parâmetro userId na URL
// Pode ser configurada como pública ou protegida dependendo das regras de negócio
router.get(
  '/user/:userId',
  // authMiddleware, // Pode ser adicionado se a rota precisar de autenticação
  avaliacaoController.listarAvaliacoesRecebidas
  // Função do controlador que busca e retorna as avaliações recebidas
);

// Rota para listar avaliações de uma contratação específica
// Requer autenticação do usuário
// O controlador deve verificar se o usuário logado participou da contratação
router.get(
  '/contratacao/:contratacaoId',
  authMiddleware,
  // Middleware que verifica se o usuário está autenticado
  // Poderia usar middleware adicional para verificar participação na contratação
  avaliacaoController.listarAvaliacoesDaContratacao
  // Função do controlador que busca e retorna as avaliações da contratação
);

// Rota para editar uma avaliação existente
// Requer autenticação do usuário
// O controlador deve verificar se:
// - O usuário logado é o autor da avaliação
// - A edição ainda é permitida (por exemplo, dentro de um prazo após a criação)
router.put(
  '/:avaliacaoId',
  authMiddleware,
  // Middleware que verifica se o usuário está autenticado
  // Poderia usar middleware adicional para verificar propriedade da avaliação
  avaliacaoController.editarAvaliacao
  // Função do controlador que processa a atualização da avaliação
);

// Rota para deletar uma avaliação (comentada/desativada)
// Requer autenticação do usuário
// O controlador deve verificar se o usuário logado é o autor da avaliação ou um administrador
// router.delete(
//     '/:avaliacaoId',
//     authMiddleware,
//     // Middleware que verifica se o usuário está autenticado
//     // Poderia usar middleware adicional para verificar propriedade ou permissões de admin
//     avaliacaoController.deleteAvaliacao
//     // Função do controlador que processa a exclusão da avaliação
// );


// Exporta o router configurado com todas as rotas definidas
export default router;
