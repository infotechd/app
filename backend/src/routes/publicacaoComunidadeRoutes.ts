// src/routes/publicacaoComunidadeRoutes.ts

import { Router } from 'express';
// Importa os controladores e middlewares (assumindo conversão para .ts)
import * as publicacaoController from '../controllers/publicacaoComunidadeController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar middlewares de autorização específicos
// import { isOwnerOrAdmin } from '../middlewares/authorizationMiddleware';
// import { isOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

const router: Router = Router();

// === ROTAS PÚBLICAS (ou requerem apenas login básico) ===

// GET /api/comunidade : Lista publicações aprovadas (feed principal) (CU8)
// Controller deve filtrar por status: 'aprovado' e implementar paginação/ordenação
router.get(
  '/',
  // authMiddleware, // Descomentar se feed exigir login
  publicacaoController.getPublicacoesAprovadas // Nome mais específico
);

// GET /api/comunidade/:publicacaoId : Obtém detalhes de uma publicação específica (aprovada)
// Controller deve verificar status: 'aprovado'
router.get(
  '/:publicacaoId',
  // authMiddleware, // Descomentar se visualização exigir login
  publicacaoController.getPublicacaoAprovadaById // Função a ser criada
);

// === ROTAS PRIVADAS (Requerem Autenticação) ===

// POST /api/comunidade : Cria uma nova publicação (post ou evento) (CU8)
// Controller pode verificar permissões adicionais se necessário
router.post(
  '/',
  authMiddleware,
  publicacaoController.createPublicacao
);

// PUT /api/comunidade/:publicacaoId : Autor edita sua própria publicação (Sugestão)
// Controller deve verificar se req.user é o autor da publicação
router.put(
  '/:publicacaoId',
  authMiddleware,
  // isOwner, // Middleware opcional
  publicacaoController.updateMinhaPublicacao // Função a ser criada
);


// DELETE /api/comunidade/:publicacaoId : Autor ou Admin deleta uma publicação (CU8)
// Controller deve verificar se req.user é o autor OU admin
router.delete(
  '/:publicacaoId',
  authMiddleware,
  // isOwnerOrAdmin, // Middleware opcional
  publicacaoController.deletePublicacao
);


// === ROTAS DE ADMINISTRAÇÃO (Requerem Autenticação + Admin) ===

// PATCH /api/comunidade/:publicacaoId/status : Admin aprova/rejeita/oculta publicação (Moderação)
// Corpo da requisição deve conter o novo status e talvez um motivo.
router.patch(
  '/:publicacaoId/status',
  authMiddleware,
  // isAdmin, // Middleware OBRIGATÓRIO
  publicacaoController.moderarPublicacao // Renomeado de 'moderarPublicacao', recebe status no body
);

// GET /api/comunidade/pending : Admin lista publicações pendentes de aprovação
// router.get(
//     '/pending',
//     authMiddleware,
//     // isAdmin, // Middleware OBRIGATÓRIO
//     publicacaoController.listarPublicacoesPendentes // Função a ser criada
// );


// === ROTAS DE INTERAÇÃO (Likes/Comentários - MOVIDAS para seus próprios arquivos) ===
// Lembrete: Criar comentarioRoutes.ts e curtidaRoutes.ts
// router.post('/:publicacaoId/comentario', authMiddleware, publicacaoController.addComentario); // REMOVIDA daqui


// Exporta o router configurado
export default router;