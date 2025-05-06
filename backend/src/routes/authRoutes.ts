// src/routes/authRoutes.ts

import { Router } from 'express'; // Importa o Router do express
import rateLimit from 'express-rate-limit';

// Importa os controladores e middlewares (assumindo que foram/serão convertidos para .ts)
// Use import default ou nomeado conforme a exportação nos arquivos .ts correspondentes
import * as authController from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
// Importa os middlewares de validação
import { registerValidation, loginValidation, editProfileValidation } from '../middlewares/validationMiddleware';
// Exemplo: Importar um middleware de autorização para admin
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Configuração do rate limiter para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 tentativas por IP
  message: { message: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.' },
  standardHeaders: true, // Retorna informações de limite no cabeçalho `RateLimit-*`
  legacyHeaders: false, // Desabilita os cabeçalhos `X-RateLimit-*`
});

// Configuração do rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // limite de 3 registros por IP
  message: { message: 'Muitos registros detectados. Por favor, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Cria uma instância do Router do Express
const router: Router = Router();

// === ROTAS DE AUTENTICAÇÃO ===

// POST /api/auth/register : Registrar um novo usuário (CU1)
router.post('/register', registerLimiter, registerValidation, authController.register);

// POST /api/auth/login : Realizar login e obter token JWT
router.post('/login', loginLimiter, loginValidation, authController.login);

// POST /api/auth/logout : (Opcional) Invalidar token/cookie no lado do servidor/cliente
router.post('/logout', authMiddleware, authController.logout);

// === ROTAS DE PERFIL (Protegidas) ===

// GET /api/auth/profile : Obter dados do perfil do usuário logado
router.get('/profile', authMiddleware, authController.getProfile); // Assumindo que getProfile existe no controller

// PUT /api/auth/profile : Editar perfil do usuário logado (CU17)
router.put('/profile', authMiddleware, editProfileValidation, authController.editProfile);

// DELETE /api/auth/profile : Excluir conta do usuário logado (CU12)
router.delete('/profile', authMiddleware, authController.deleteAccount);

// === ROTAS DE ADMINISTRAÇÃO (Exemplo - Protegidas e Autorizadas) ===

// GET /api/auth/users : Listar todos os usuários (Requer Admin)
router.get(
  '/users',
  authMiddleware, // 1º: Garante que está logado
  // isAdmin,     // 2º: (Exemplo) Garante que é um administrador
  authController.listUsers
);

// Exporta o router configurado para ser usado no server.ts
export default router;
