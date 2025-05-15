// src/controllers/uploadController.ts
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configuração do armazenamento para o multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o diretório de destino para os uploads
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Cria o diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o arquivo usando UUID
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceita apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas'));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter,
});

/**
 * Controller para upload de imagens
 * Recebe uma imagem e retorna a URL para acessá-la
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // O middleware multer já processou o arquivo e adicionou à requisição
    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado' });
      return;
    }

    // Constrói a URL para acessar a imagem
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/${req.file.filename}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    // Retorna a URL da imagem
    res.status(200).json({
      message: 'Imagem enviada com sucesso',
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};