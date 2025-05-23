// src/middlewares/authorizationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { TipoUsuarioEnum } from '../models/User'; // Importa o Enum de tipos de usuário

/**
 * Factory function que gera middlewares para verificação de roles de usuário.
 * Segue o princípio DRY (Don't Repeat Yourself) evitando duplicação de código.
 * 
 * @param role - O tipo de usuário (role) a ser verificado
 * @param errorMessage - Mensagem de erro customizada (opcional)
 * @returns Middleware que verifica se o usuário possui a role especificada
 */
export const checkRole = (role: TipoUsuarioEnum, errorMessage?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verifica se req.user existe e se o tipoUsuario corresponde à role especificada
    if (req.user && req.user.tipoUsuario === role) {
      // Se o usuário tiver a role correta, permite que a requisição continue
      next();
    } else {
      // Se não tiver a role correta, retorna erro 403 Forbidden
      const defaultMessage = `Acesso proibido: Requer privilégios de ${role}.`;
      res.status(403).json({ message: errorMessage || defaultMessage });
      // Não chama next() para interromper a cadeia de execução
    }
  };
};

/**
 * Factory function que gera middlewares para verificação de múltiplas roles de usuário.
 * Permite verificar se o usuário possui pelo menos uma das roles especificadas.
 * 
 * @param roles - Array de tipos de usuário (roles) a serem verificados
 * @param errorMessage - Mensagem de erro customizada (opcional)
 * @returns Middleware que verifica se o usuário possui pelo menos uma das roles especificadas
 */
export const checkAnyRole = (roles: TipoUsuarioEnum[], errorMessage?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verifica se req.user existe e se o tipoUsuario está entre as roles especificadas
    if (req.user && roles.includes(req.user.tipoUsuario as TipoUsuarioEnum)) {
      // Se o usuário tiver pelo menos uma das roles, permite que a requisição continue
      next();
    } else {
      // Se não tiver nenhuma das roles, retorna erro 403 Forbidden
      const rolesStr = roles.join(' ou ');
      const defaultMessage = `Acesso proibido: Requer privilégios de ${rolesStr}.`;
      res.status(403).json({ message: errorMessage || defaultMessage });
      // Não chama next() para interromper a cadeia de execução
    }
  };
};

// Middlewares específicos criados a partir da factory function
/**
 * Middleware para verificar se o usuário logado é um Prestador de Serviço.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isPrestador = checkRole(
  TipoUsuarioEnum.PRESTADOR, 
  'Acesso proibido: Requer privilégios de Prestador de Serviço.'
);

/**
 * Middleware para verificar se o usuário logado é um Administrador.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAdmin = checkRole(
  TipoUsuarioEnum.ADMIN,
  'Acesso proibido: Requer privilégios de Administrador.'
);

/**
 * Middleware para verificar se o usuário logado é um Comprador.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isComprador = checkRole(
  TipoUsuarioEnum.COMPRADOR,
  'Acesso proibido: Requer privilégios de Comprador.'
);

/**
 * Middleware para verificar se o usuário logado é um Anunciante.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAnunciante = checkRole(
  TipoUsuarioEnum.ANUNCIANTE,
  'Acesso proibido: Requer privilégios de Anunciante.'
);

// Exemplos de middlewares que verificam múltiplas roles
/**
 * Middleware para verificar se o usuário logado é um Administrador ou um Prestador.
 * Útil para rotas que podem ser acessadas por ambos os tipos de usuário.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAdminOrPrestador = checkAnyRole(
  [TipoUsuarioEnum.ADMIN, TipoUsuarioEnum.PRESTADOR],
  'Acesso proibido: Requer privilégios de Administrador ou Prestador de Serviço.'
);

/**
 * Middleware para verificar se o usuário logado é um Comprador ou um Anunciante.
 * Útil para rotas relacionadas a transações comerciais.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isCompradorOrAnunciante = checkAnyRole(
  [TipoUsuarioEnum.COMPRADOR, TipoUsuarioEnum.ANUNCIANTE],
  'Acesso proibido: Requer privilégios de Comprador ou Anunciante.'
);

// Exemplo: Middleware para verificar se é dono de um recurso (mais complexo)
/*
export const isResourceOwner = (model: any, paramIdName: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const resourceId = req.params[paramIdName];
        const userId = req.user?.userId;

        if (!userId || !mongoose.Types.ObjectId.isValid(resourceId)) {
            res.status(400).json({ message: 'Requisição inválida.'});
            return;
        }

        try {
            const resource = await model.findById(resourceId);
            // Adapte a verificação de propriedade (ex: resource.userId, resource.anuncianteId)
            if (!resource || String(resource.userId) !== String(userId)) {
                res.status(403).json({ message: 'Acesso proibido: Você não é o proprietário deste recurso.' });
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
*/
