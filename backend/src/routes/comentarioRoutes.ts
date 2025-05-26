// src/routes/comentarioRoutes.ts

import { Router } from 'express';
// Importação do controlador de comentários e middleware de autenticação
import * as comentarioController from '../controllers/comentarioController';
import authMiddleware from '../middlewares/authMiddleware';
// Middlewares de autorização que podem ser implementados futuramente
// import { isComentarioOwnerOrAdmin } from '../middlewares/authorizationMiddleware';
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Inicialização do roteador Express
const router: Router = Router();

// === ROTAS DE COMENTÁRIOS ===

// Rota POST /api/comentarios
// Descrição: Cria um novo comentário ou resposta a um comentário existente
// Requisitos: 
//   - Usuário autenticado
//   - Corpo da requisição deve incluir: publicacaoId, conteudo
//   - Opcionalmente pode incluir: respostaParaComentarioId
// Funcionamento: 
//   - Valida os dados recebidos
//   - Cria o registro de Comentario no banco de dados
//   - Incrementa o contador de comentários na publicação relacionada
router.post(
  '/',
  authMiddleware, // Middleware que verifica se o usuário está autenticado
  comentarioController.criarComentario // Controlador que processa a criação do comentário
);

// Rota GET /api/comentarios/publicacao/:publicacaoId
// Descrição: Lista todos os comentários aprovados de uma publicação específica
// Acesso: 
//   - Geralmente público (não requer autenticação)
//   - Pode ser restrito descomentando o middleware de autenticação
// Funcionamento:
//   - Busca comentários pelo ID da publicação e status 'aprovado'
//   - Implementa paginação para grandes volumes de comentários
//   - Ordena por data de criação (mais recentes primeiro)
//   - Pode incluir respostas aninhadas aos comentários principais
router.get(
  '/publicacao/:publicacaoId',
  // authMiddleware, // Descomentar esta linha se a visualização exigir login
  comentarioController.listarComentariosPorPublicacao // Controlador que lista os comentários da publicação
);

// Rota PUT /api/comentarios/:comentarioId
// Descrição: Permite que o autor edite seu próprio comentário
// Requisitos:
//   - Usuário autenticado
//   - O usuário deve ser o autor original do comentário
// Funcionamento:
//   - Verifica se o usuário autenticado é o autor do comentário
//   - Atualiza o conteúdo do comentário com os novos dados
router.put(
  '/:comentarioId',
  authMiddleware, // Middleware que verifica se o usuário está autenticado
  // isComentarioOwner, // Middleware opcional para verificar se é o autor do comentário
  comentarioController.editarComentario // Controlador que processa a edição do comentário
);

// Rota DELETE /api/comentarios/:comentarioId
// Descrição: Permite que o autor ou um administrador exclua um comentário
// Requisitos:
//   - Usuário autenticado
//   - O usuário deve ser o autor do comentário OU ter permissões de administrador
// Funcionamento:
//   - Verifica permissões do usuário (autor ou admin)
//   - Remove o comentário do banco de dados
//   - Decrementa o contador de comentários na publicação relacionada
//   - Trata as respostas associadas (exclusão em cascata ou marcação como órfãs)
router.delete(
  '/:comentarioId',
  authMiddleware, // Middleware que verifica se o usuário está autenticado
  // isComentarioOwnerOrAdmin, // Middleware opcional para verificar se é o autor ou admin
  comentarioController.deletarComentario // Controlador que processa a exclusão do comentário
);

// Rota PATCH /api/comentarios/:comentarioId/status
// Descrição: Permite que um administrador modere um comentário (aprovar ou ocultar)
// Requisitos:
//   - Usuário autenticado
//   - O usuário deve ter permissões de administrador
// Funcionamento:
//   - Verifica se o usuário tem permissões de administrador
//   - Atualiza o status do comentário (aprovado/oculto)
router.patch(
  '/:comentarioId/status',
  authMiddleware, // Middleware que verifica se o usuário está autenticado
  // isAdmin, // Middleware OBRIGATÓRIO para verificar se é administrador
  comentarioController.moderarComentario // Controlador que processa a moderação do comentário
);

// --- Sugestões de Rotas para Curtidas em Comentários ---
// Observação: Estas rotas podem ser implementadas em um arquivo separado (curtidaRoutes.ts)
// Exemplo: POST /api/comentarios/:comentarioId/like (para curtir um comentário)
// Exemplo: DELETE /api/comentarios/:comentarioId/like (para remover uma curtida)

// Exportação do roteador configurado para uso no aplicativo
export default router;
