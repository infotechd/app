// Arquivo de rotas para publicações da comunidade

import { Router } from 'express';
// Importação dos controladores e middlewares necessários
import * as publicacaoController from '../controllers/publicacaoComunidadeController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser utilizados
// import { isOwnerOrAdmin } from '../middlewares/authorizationMiddleware';
// import { isOwner } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Inicialização do router
const router: Router = Router();

// === ROTAS PÚBLICAS (ou requerem apenas login básico) ===

// Rota: GET /api/comunidade
// Descrição: Retorna a lista de publicações aprovadas para o feed principal
// Caso de Uso: CU8
// Observação: O controlador filtra por status 'aprovado' e implementa paginação/ordenação
router.get(
  '/',
  // authMiddleware, // Ative este middleware se o feed exigir autenticação
  publicacaoController.getPublicacoesAprovadas
);

// Rota: GET /api/comunidade/:publicacaoId
// Descrição: Obtém os detalhes de uma publicação específica que já foi aprovada
// Observação: O controlador verifica se o status é 'aprovado'
router.get(
  '/:publicacaoId',
  // authMiddleware, // Ative este middleware se a visualização exigir autenticação
  publicacaoController.getPublicacaoAprovadaById
);

// === ROTAS PRIVADAS (Requerem Autenticação) ===

// Rota: POST /api/comunidade
// Descrição: Cria uma nova publicação (post ou evento) na comunidade
// Caso de Uso: CU8
// Observação: Requer autenticação e pode ter verificações adicionais de permissão
router.post(
  '/',
  authMiddleware,
  publicacaoController.createPublicacao
);

// Rota: PUT /api/comunidade/:publicacaoId
// Descrição: Permite que o autor edite sua própria publicação
// Observação: O controlador verifica se o usuário autenticado é o autor da publicação
router.put(
  '/:publicacaoId',
  authMiddleware,
  // isOwner, // Middleware opcional para verificação de propriedade
  publicacaoController.updateMinhaPublicacao
);

// Rota: DELETE /api/comunidade/:publicacaoId
// Descrição: Permite que o autor ou um administrador exclua uma publicação
// Caso de Uso: CU8
// Observação: O controlador verifica se o usuário é o autor OU um administrador
router.delete(
  '/:publicacaoId',
  authMiddleware,
  // isOwnerOrAdmin, // Middleware opcional para verificação de propriedade ou admin
  publicacaoController.deletePublicacao
);

// === ROTAS DE ADMINISTRAÇÃO (Requerem Autenticação + Admin) ===

// Rota: PATCH /api/comunidade/:publicacaoId/status
// Descrição: Permite que um administrador aprove, rejeite ou oculte uma publicação
// Observação: O corpo da requisição deve conter o novo status e possivelmente um motivo
router.patch(
  '/:publicacaoId/status',
  authMiddleware,
  // isAdmin, // Middleware obrigatório para verificação de administrador
  publicacaoController.moderarPublicacao
);

// Rota: GET /api/comunidade/pending
// Descrição: Permite que um administrador liste as publicações pendentes de aprovação
// router.get(
//     '/pending',
//     authMiddleware,
//     // isAdmin, // Middleware obrigatório para verificação de administrador
//     publicacaoController.listarPublicacoesPendentes
// );

// === ROTAS DE INTERAÇÃO ===
// Observação: As rotas para likes e comentários foram movidas para seus próprios arquivos
// É necessário criar os arquivos comentarioRoutes.ts e curtidaRoutes.ts

// Exportação do router configurado
export default router;
