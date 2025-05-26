// Arquivo de rotas de autenticação

import { Router } from 'express'; // Importa o módulo Router do Express para gerenciar rotas
import rateLimit from 'express-rate-limit'; // Importa o módulo para limitar requisições

// Importa os controladores de autenticação
import * as authController from '../controllers/authController';
// Importa o middleware de autenticação para proteger rotas
import authMiddleware from '../middlewares/authMiddleware';
// Importa os middlewares de validação usando Zod para validar dados de entrada
import { validateCreateUser, validateLogin, validateUpdateUser } from '../middlewares/zodValidationMiddleware';
// Middleware de autorização para admin (comentado para uso futuro)
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Configuração do limitador de requisições para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos de janela de tempo
  max: 5, // Máximo de 5 tentativas por IP
  message: { message: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.' },
  standardHeaders: true, // Inclui informações de limite nos cabeçalhos
  legacyHeaders: false, // Desativa cabeçalhos antigos
});

// Configuração do limitador de requisições para registro de usuários
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora de janela de tempo
  max: 3, // Máximo de 3 registros por IP
  message: { message: 'Muitos registros detectados. Por favor, tente novamente mais tarde.' },
  standardHeaders: true, // Inclui informações de limite nos cabeçalhos
  legacyHeaders: false, // Desativa cabeçalhos antigos
});

// Inicializa o roteador do Express
const router: Router = Router();

// === ROTAS DE AUTENTICAÇÃO ===

// Rota para registrar um novo usuário (Caso de Uso 1)
// Usa limitador de requisições e validação de dados
router.post('/register', registerLimiter, validateCreateUser, authController.register);

// Rota para realizar login e obter token JWT
// Usa limitador de requisições e validação de dados
router.post('/login', loginLimiter, validateLogin, authController.login);

// Rota para realizar logout e invalidar token
// Requer autenticação prévia
router.post('/logout', authMiddleware, authController.logout);

// === ROTAS DE PERFIL (Protegidas) ===

// Rota para obter dados do perfil do usuário logado
// Requer autenticação prévia
router.get('/profile', authMiddleware, authController.getProfile);

// Rota para editar perfil do usuário logado (Caso de Uso 17)
// Requer autenticação prévia e validação de dados
router.put('/profile', authMiddleware, validateUpdateUser, authController.editProfile);

// Rota para excluir conta do usuário logado (Caso de Uso 12)
// Requer autenticação prévia
router.delete('/profile', authMiddleware, authController.deleteAccount);

// Rota para alterar email do usuário logado
// Requer autenticação prévia
router.post('/change-email', authMiddleware, authController.changeEmail);

// === ROTAS DE ADMINISTRAÇÃO (Protegidas e Autorizadas) ===

// Rota para listar todos os usuários
// Requer autenticação e permissões de administrador
router.get(
  '/users',
  authMiddleware, // Primeiro verifica se o usuário está autenticado
  // isAdmin,     // Depois verifica se tem permissões de administrador (comentado)
  authController.listUsers
);

// Exporta o roteador para uso no arquivo principal da aplicação
export default router;
