// Arquivo: src/controllers/uploadController.ts
// Controlador responsável pelo gerenciamento de uploads de arquivos
import { Request, Response, NextFunction } from 'express';
import express from 'express';
// Import Express namespace for type definitions
import { Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configuração do armazenamento para o multer
// Define como e onde os arquivos enviados serão armazenados
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o diretório de destino para os uploads
    // Cria um caminho para a pasta 'uploads' na raiz do projeto
    const uploadDir = path.join(__dirname, '../../uploads');

    // Cria o diretório se não existir
    // Verifica se a pasta existe e a cria caso necessário
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Chama o callback com o diretório de destino
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o arquivo usando UUID
    // Isso evita conflitos de nomes e sobrescrita de arquivos
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para aceitar apenas imagens
// Função que verifica se o arquivo enviado é uma imagem válida
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceita apenas arquivos cujo MIME type começa com 'image/'
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // Rejeita arquivos que não são imagens
    cb(new Error('Apenas imagens são permitidas'));
  }
};

// Configuração do multer
// Exporta o middleware configurado para ser usado nas rotas
export const upload = multer({
  storage, // Usa a configuração de armazenamento definida acima
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB para o tamanho do arquivo
  },
  fileFilter, // Usa o filtro de arquivos definido acima
});

/**
 * Controlador para upload de imagens
 * Recebe uma imagem do cliente, salva no servidor e retorna a URL para acessá-la
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verifica se existe um arquivo na requisição
    // O middleware multer já processou o arquivo e o adicionou à requisição
    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado' });
      return;
    }

    // Constrói a URL para acessar a imagem
    // Combina o protocolo, host e caminho relativo para formar a URL completa
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/${req.file.filename}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    // Retorna a resposta com a URL da imagem
    // Envia um JSON com mensagem de sucesso e a URL para o cliente
    res.status(200).json({
      message: 'Imagem enviada com sucesso',
      imageUrl,
    });
  } catch (error) {
    // Passa qualquer erro para o middleware de tratamento de erros
    next(error);
  }
};
