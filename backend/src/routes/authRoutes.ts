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
  limit: 3, // Máximo de 3 tentativas por IP (reduzido de 5 para maior segurança)
  message: { message: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.' },
  standardHeaders: true, // Inclui informações de limite nos cabeçalhos
  legacyHeaders: false, // Desativa cabeçalhos antigos
});

// Configuração do limitador de requisições para login com bloqueio mais longo
// Usado após muitas tentativas falhas para implementar bloqueio progressivo
const strictLoginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora de janela de tempo
  limit: 5, // Máximo de 5 tentativas por hora após bloqueio inicial
  message: { 
    message: 'Acesso temporariamente bloqueado devido a muitas tentativas de login. Tente novamente em 1 hora.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas contra o limite
});

// Configuração do limitador de requisições para registro de usuários
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora de janela de tempo
  limit: 3, // Máximo de 3 registros por IP (reduzido de 7 para maior segurança)
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
// Usa dois limitadores de requisições em sequência para implementar bloqueio progressivo
// Primeiro aplica o limitador normal, depois o estrito para tentativas excessivas
router.post('/login', loginLimiter, strictLoginLimiter, validateLogin, authController.login);

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

// Configuração do limitador de requisições para renovação de token
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos de janela de tempo
  limit: 10, // Máximo de 10 renovações por IP em 15 minutos
  message: { message: 'Muitas tentativas de renovação de token. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rota para renovar o token de acesso usando um refresh token
// Não requer autenticação, mas usa limitador de requisições
router.post('/refresh-token', refreshTokenLimiter, authController.refreshToken);

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
