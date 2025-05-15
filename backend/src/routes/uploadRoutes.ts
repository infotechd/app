// src/routes/uploadRoutes.ts

import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import authMiddleware from '../middlewares/authMiddleware';

// Cria uma instância do Router do Express
const router: Router = Router();

// === ROTAS DE UPLOAD ===

// POST /api/upload/image : Upload de imagem (protegido por autenticação)
// O middleware upload.single('image') processa o arquivo enviado com o campo 'image'
router.post('/image', authMiddleware, uploadController.upload.single('image'), uploadController.uploadImage);

// Exporta o router configurado para ser usado no server.ts
export default router;