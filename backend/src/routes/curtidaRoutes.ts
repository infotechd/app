// Arquivo de rotas para gerenciamento de curtidas

import { Router } from 'express';
// Importação do controlador de curtidas e middleware de autenticação
import curtidaController from '../controllers/curtidaController';
import authMiddleware from '../middlewares/authMiddleware';

// Inicialização do roteador Express
const router: Router = Router();

// === ROTAS DE CURTIDAS ===
// Todas as rotas abaixo necessitam de autenticação do usuário

// Rota para curtir um item (Publicação ou Comentário)
// Recebe no corpo da requisição: itemCurtidoId e tipoItemCurtido
// O controlador verifica se o item existe, cria a curtida e incrementa o contador de curtidas
router.post(
  '/',
  authMiddleware,
  curtidaController.curtirItem
);

// Rota para remover curtida de um item (Publicação ou Comentário)
// Recebe no corpo da requisição: itemCurtidoId e tipoItemCurtido
// O controlador remove a curtida e decrementa o contador de curtidas no item
router.delete(
  '/',
  authMiddleware,
  curtidaController.descurtirItem
);

// Rota para verificar se o usuário logado curtiu um item específico
// Recebe como parâmetros de consulta: itemCurtidoId e tipoItemCurtido
// O controlador busca pela curtida usando o ID do usuário logado e retorna verdadeiro/falso ou a curtida
router.get(
  '/item',
  authMiddleware,
  curtidaController.verificarCurtida
);

// Rota para listar todos os itens curtidos por um usuário específico
// Recebe o ID do usuário como parâmetro de rota
// O controlador verifica as permissões de visualização antes de retornar os dados
router.get(
  '/user/:userId',
  authMiddleware,
  // Middleware opcional para verificação de permissões
  curtidaController.listarItensCurtidosPeloUsuario
);

// Rota para listar todos os usuários que curtiram um item específico
// Recebe o tipo do item e o ID do item como parâmetros de rota
// Utilizado para exibir informações como "Fulano, Ciclano e outras X pessoas curtiram"
// O controlador implementa paginação para otimizar a resposta
router.get(
  '/item/:tipoItemCurtido/:itemCurtidoId/users',
  authMiddleware,
  curtidaController.listarUsuariosQueCurtiramItem
);

// Exportação do roteador configurado
export default router;
