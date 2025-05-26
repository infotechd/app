// src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';
import { promisify } from 'util';

// Importa a interface do payload do usuário
// Definida no arquivo server.ts
import { DecodedUserToken } from '../server';
// Importa o enum para validação de tipo de usuário
import { TipoUsuarioEnum } from '../models/User';
// Importa o logger configurado para registrar erros
import logger from '../config/logger';

// A interface Request do Express foi estendida no arquivo src/types/express.d.ts

// Cria uma versão promisificada da função jwt.verify para uso com async/await
const verifyAsync = promisify<string, string, any>(jwt.verify);

/**
 * Middleware de Autenticação JWT.
 * Este middleware realiza a autenticação do usuário através de tokens JWT.
 * 
 * Funcionamento:
 * - Busca o token no cookie 'token' ou no header 'Authorization'
 * - Verifica a validade e autenticidade do token usando a chave secreta
 * - Anexa os dados do usuário decodificados à requisição (req.user)
 * - Retorna código 401 se o token estiver ausente, inválido ou expirado
 * 
 * Benefícios:
 * - Usa verificação assíncrona para não bloquear a thread principal
 * - Implementa verificações de segurança contra tokens malformados
 * - Suporta múltiplos métodos de envio do token (cookie ou header)
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // 1. Tenta extrair o token do cookie HttpOnly chamado 'token'
  // O cookie é a forma preferida de armazenar o token por questões de segurança
  let token: string | undefined = req.cookies?.token;

  // 2. Se não encontrou no cookie, tenta extrair do header Authorization
  // Esta é uma alternativa comum para clientes que não suportam cookies
  if (!token) {
    const authHeader = req.headers.authorization;
    // Verifica se o header existe e está no formato "Bearer <token>" conforme padrão OAuth 2.0
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; // Extrai a parte do token após "Bearer "
    }
  }

  // 3. Se nenhum token foi encontrado após tentar ambas as fontes
  // Retorna erro 401 (Não Autorizado) para indicar que autenticação é necessária
  if (!token) {
    // Encerra a execução da função do middleware com resposta de erro
    res.status(401).json({ message: 'Acesso não autorizado: Token não fornecido.' });
    return; // Retorno explícito para evitar a execução do próximo middleware
  }

  // 4. Verifica e decodifica o token JWT de forma assíncrona
  try {
    // Obtém a chave secreta usada para assinar o token
    // Verifica se a variável de ambiente está configurada corretamente
    const secret = process.env.JWT_SECRET as string;
    if (!secret) {
      throw new Error('Chave secreta JWT não configurada no servidor.');
    }

    // Verifica a autenticidade do token e extrai os dados contidos nele
    const decoded = await verifyAsync(token, secret);

    // Valida se o token decodificado possui a estrutura esperada
    // Isso evita problemas de segurança com tokens malformados
    if (!isValidDecodedToken(decoded)) {
      res.status(401).json({ message: 'Acesso não autorizado: Token com estrutura inválida.' });
      return;
    }

    // 5. Anexa os dados do usuário à requisição para uso nas rotas protegidas
    // Isso permite que as rotas acessem informações do usuário autenticado
    req.user = decoded as DecodedUserToken;

    // 6. Passa o controle para o próximo middleware ou rota na cadeia
    next();

  } catch (error) {
    // Captura erros de verificação do token (expirado, assinatura inválida, etc.)
    // Registra o erro no sistema de logs para análise posterior
    logger.error('Erro de autenticação JWT', { error });
    // Retorna resposta de erro ao cliente
    res.status(401).json({ message: 'Acesso não autorizado: Token inválido ou expirado.' });
    // Não chama next() para interromper o fluxo da requisição
  }
};

/**
 * Função que valida se o objeto decodificado do token contém todos os campos esperados
 * com os tipos corretos conforme a interface DecodedUserToken.
 * Esta função atua como uma type guard para garantir a segurança do tipo.
 * 
 * @param decoded - O objeto decodificado do token JWT
 * @returns boolean - true se o objeto contém todos os campos esperados, false caso contrário
 */
function isValidDecodedToken(decoded: unknown): decoded is DecodedUserToken {
  // Primeiro passo: verifica se decoded é um objeto válido e não nulo
  // Esta verificação básica é essencial antes de acessar propriedades
  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  // Segundo passo: verifica se o objeto possui a propriedade userId
  // A propriedade deve ser uma string não vazia para ser considerada válida
  if (!('userId' in decoded) || typeof (decoded as any).userId !== 'string' || !(decoded as any).userId) {
    return false;
  }

  // Terceiro passo: verifica se o objeto possui a propriedade tipoUsuario
  // Além de ser string, o valor deve corresponder a um dos tipos definidos no enum TipoUsuarioEnum
  // Isso garante que apenas tipos de usuário válidos sejam aceitos
  if (!('tipoUsuario' in decoded) || 
      typeof (decoded as any).tipoUsuario !== 'string' || 
      !Object.values(TipoUsuarioEnum).includes((decoded as any).tipoUsuario as TipoUsuarioEnum)) {
    return false;
  }

  // Se o objeto passou por todas as verificações acima, ele é considerado válido
  // e pode ser tratado com segurança como um objeto do tipo DecodedUserToken
  return true;
}

// Exporta o middleware
export default authMiddleware;
