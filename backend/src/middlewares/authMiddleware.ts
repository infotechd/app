// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { promisify } from 'util';

// Importa a interface do payload do usuário (ajuste o caminho e o conteúdo conforme necessário)
// Assumindo que foi definida em server.ts ou um arquivo de tipos compartilhado
import { DecodedUserToken } from '../server'; // Ou importe de um arquivo de tipos dedicado
import { TipoUsuarioEnum } from '../models/User'; // Importa o enum para validação
import logger from '../config/logger'; // Importa o logger Winston configurado

// A interface Request do Express foi estendida no arquivo src/types/express.d.ts

// Cria uma versão promisificada do jwt.verify
const verifyAsync = promisify<string, string, any>(jwt.verify);

/**
 * Middleware de Autenticação JWT.
 * Verifica o token no cookie 'token' ou no header 'Authorization'.
 * Anexa o payload decodificado a req.user se o token for válido.
 * Retorna 401 se o token estiver ausente ou for inválido.
 * 
 * Usa verificação assíncrona de JWT para evitar bloqueio da thread principal.
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  // 4. Verifica e decodifica o token de forma assíncrona
  try {
    // Garante que JWT_SECRET existe (já validado no server.ts, mas boa prática verificar de novo)
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada no servidor.');
    }

    // Verifica o token de forma assíncrona usando a versão promisificada
    const decoded = await verifyAsync(token, secret);

    // Valida se o token decodificado contém os campos esperados antes de fazer type assertion
    if (!isValidDecodedToken(decoded)) {
      res.status(401).json({ message: 'Acesso não autorizado: Token com estrutura inválida.' });
      return;
    }

    // 5. Anexa os dados do usuário à requisição (agora com garantia de estrutura válida)
    req.user = decoded as DecodedUserToken;

    // 6. Passa para o próximo middleware ou rota
    next();

  } catch (error) {
    // Se jwt.verify lança um erro (token inválido, expirado, etc.)
    logger.error('Erro de autenticação JWT', { error }); // Log completo do erro usando Winston
    res.status(401).json({ message: 'Acesso não autorizado: Token inválido ou expirado.' });
    // Não chama next() pois a requisição não deve prosseguir
  }
};

/**
 * Função que valida se o objeto decodificado do token contém todos os campos esperados
 * com os tipos corretos conforme a interface DecodedUserToken.
 * 
 * @param decoded - O objeto decodificado do token JWT
 * @returns boolean - true se o objeto contém todos os campos esperados, false caso contrário
 */
function isValidDecodedToken(decoded: unknown): decoded is DecodedUserToken {
  // Verifica se decoded é um objeto e não é null
  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  // Verifica se o objeto tem a propriedade userId do tipo string
  if (!('userId' in decoded) || typeof (decoded as any).userId !== 'string' || !(decoded as any).userId) {
    return false;
  }

  // Verifica se o objeto tem a propriedade tipoUsuario e se é um valor válido do enum
  if (!('tipoUsuario' in decoded) || 
      typeof (decoded as any).tipoUsuario !== 'string' || 
      !Object.values(TipoUsuarioEnum).includes((decoded as any).tipoUsuario as TipoUsuarioEnum)) {
    return false;
  }

  // Se passou por todas as verificações, o objeto é válido
  return true;
}

// Exporta o middleware
export default authMiddleware;
