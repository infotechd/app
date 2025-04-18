// src/routes/authRoutes.ts

import { Router } from 'express'; // Importa o Router do express

// Importa os controladores e middlewares (assumindo que foram/serão convertidos para .ts)
// Use import default ou nomeado conforme a exportação nos arquivos .ts correspondentes
import * as authController from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';
// Exemplo: Importar um middleware de autorização para admin
// import { isAdmin } from '../middlewares/authorizationMiddleware';

// Cria uma instância do Router do Express
const router: Router = Router();

// === ROTAS DE AUTENTICAÇÃO ===

// POST /api/auth/register : Registrar um novo usuário (CU1)
router.post('/register', authController.register);

// POST /api/auth/login : Realizar login e obter token JWT
router.post('/login', authController.login);

// POST /api/auth/logout : (Opcional) Invalidar token/cookie no lado do servidor/cliente
router.post('/logout', authMiddleware, authController.logout);

// === ROTAS DE PERFIL (Protegidas) ===

// GET /api/auth/profile : Obter dados do perfil do usuário logado
router.get('/profile', authMiddleware, authController.getProfile); // Assumindo que getProfile existe no controller

// PUT /api/auth/profile : Editar perfil do usuário logado (CU17)
router.put('/profile', authMiddleware, authController.editProfile);

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