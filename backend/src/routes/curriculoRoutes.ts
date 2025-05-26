// Arquivo de rotas para gerenciamento de currículos

import { Router } from 'express';
// Importação dos controladores de currículo e middleware de autenticação
import * as curriculoController from '../controllers/curriculoController';
import authMiddleware from '../middlewares/authMiddleware';
// Middleware de autorização pode ser importado quando necessário
// import { isPrestador } from '../middlewares/authorizationMiddleware';

// Inicialização do roteador
const router: Router = Router();

// === ROTA PÚBLICA/SEMIPÚBLICA ===

// Rota para obter o currículo público de um prestador específico pelo ID
// Esta rota pode ser configurada como pública ou com autenticação básica
router.get(
  '/user/:prestadorId',
  // authMiddleware, // Ative este middleware se a visualização exigir login
  curriculoController.getPublicCurriculoByUserId // Controlador que busca o currículo público
);


// === ROTAS PRIVADAS (Requerem Autenticação e Perfil de Prestador) ===
// O middleware de autenticação garante que o usuário esteja logado
// A verificação do perfil de Prestador é feita nos controladores

// Rota para criar um novo currículo para o prestador logado
// O controlador verifica se o usuário é Prestador e se já não possui um currículo
router.post(
  '/',
  authMiddleware,
  // isPrestador, // Middleware opcional para verificação adicional
  curriculoController.createCurriculo // Controlador de criação de currículo
);

// Rota para obter o currículo do prestador logado
// O controlador verifica se o usuário é Prestador e busca o currículo pelo ID do usuário
router.get(
  '/', // Rota para acessar o próprio currículo
  authMiddleware,
  // isPrestador, // Middleware opcional para verificação adicional
  curriculoController.getCurriculoByPrestador // Controlador que busca pelo ID do usuário no token
);

// Rota para atualizar o currículo do prestador logado
// O controlador verifica se o usuário é Prestador e atualiza o currículo correspondente
router.put(
  '/', // Rota para atualizar o próprio currículo
  authMiddleware,
  // isPrestador, // Middleware opcional para verificação adicional
  curriculoController.updateCurriculo // Controlador que atualiza usando o ID do usuário no token
);

// Rota para deletar o currículo do prestador logado (Funcionalidade opcional)
// router.delete(
//     '/',
//     authMiddleware,
//     // isPrestador, // Middleware opcional para verificação adicional
//     curriculoController.deleteCurriculo // Controlador para remoção do currículo
// );


// Exportação do roteador configurado para uso na aplicação
export default router;
