// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

// Importa a interface do payload do usuário (ajuste o caminho e o conteúdo conforme necessário)
// Assumindo que foi definida em server.ts ou um arquivo de tipos compartilhado
import { DecodedUserToken } from '../server'; // Ou importe de um arquivo de tipos dedicado

// Estende a interface Request do Express para incluir a propriedade 'user' opcional
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUserToken; // Adiciona a propriedade user tipada
    }
  }
}

/**
 * Middleware de Autenticação JWT.
 * Verifica o token no cookie 'token' ou no header 'Authorization'.
 * Anexa o payload decodificado a req.user se o token for válido.
 * Retorna 401 se o token estiver ausente ou for inválido.
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Tenta extrair o token do cookie HttpOnly chamado 'token'
  let token: string | undefined = req.cookies?.token;

  // 2. Se não encontrou no cookie, tenta extrair do header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    // Verifica se o header existe e está no formato "Bearer <token>"
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; // Pega a parte do token
    }
  }

  // 3. Se nenhum token foi encontrado
  if (!token) {
    // Usar 'return' aqui encerra a execução da função do middleware
    res.status(401).json({ message: 'Acesso não autorizado: Token não fornecido.' });
    return; // Importante retornar para não chamar next() implicitamente
  }

  // 4. Verifica e decodifica o token
  try {
    // Garante que JWT_SECRET existe (já validado no server.ts, mas boa prática verificar de novo)
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada no servidor.');
    }

    // Verifica o token (síncrono ou assíncrono - versão síncrona usada aqui por simplicidade no try/catch)
    // Para versão assíncrona, use jwt.verify com callback ou Promises
    const decoded = jwt.verify(token, secret) as DecodedUserToken; // Faz type assertion para nossa interface

    // 5. Anexa os dados do usuário à requisição
    req.user = decoded;

    // 6. Passa para o próximo middleware ou rota
    next();

  } catch (error) {
    // Se jwt.verify lança um erro (token inválido, expirado, etc.)
    console.error('Erro de autenticação JWT:', (error as Error).message); // Log opcional do erro
    res.status(401).json({ message: 'Acesso não autorizado: Token inválido ou expirado.' });
    // Não chama next() pois a requisição não deve prosseguir
  }
};

// Exporta o middleware
export default authMiddleware;