// Arquivo de rotas para operações de upload de arquivos

import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import authMiddleware from '../middlewares/authMiddleware';

// Cria uma instância do Router do Express para gerenciar as rotas de upload
const router: Router = Router();

// === ROTAS DE UPLOAD ===

// Rota POST para upload de imagens
// Parâmetros:
// - Rota: /image
// - Método: POST
// - Proteção: Requer autenticação via token JWT
// - Processamento: Utiliza o middleware de upload para processar um único arquivo
// - Controlador: Função uploadImage que salva a imagem e retorna a URL
router.post('/image', authMiddleware, uploadController.upload.single('image'), uploadController.uploadImage);

// Exporta o router para ser utilizado na configuração principal da aplicação
export default router;
