// Arquivo de definição de tipos para estender as interfaces do Express

import { DecodedUserToken } from '../server';

// Estende a interface Request do Express para incluir a propriedade 'user'
// Esta extensão permite que o objeto de usuário decodificado do token JWT
// seja acessível em todas as rotas através de req.user
declare global {
  // Namespace Express contém as definições de tipos do framework Express
  namespace Express {
    // Modificação da interface Request para incluir informações do usuário autenticado
    interface Request {
      // Propriedade opcional que armazena os dados do usuário após autenticação
      user?: DecodedUserToken;
    }
  }
}

// Este arquivo não exporta nada, pois apenas estende tipos existentes do Express
