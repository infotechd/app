// src/middlewares/authorizationMiddleware.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Função fábrica que gera middlewares para verificação de capacidades de usuário.
 * Segue o princípio DRY (Não Se Repita) evitando duplicação de código.
 * 
 * @param capabilityCheck - Função que verifica se o usuário possui a capacidade necessária
 * @param errorMessage - Mensagem de erro customizada (opcional)
 * @returns Middleware que verifica se o usuário possui a capacidade especificada
 */
export const checkCapability = (
  capabilityCheck: (req: Request) => boolean,
  errorMessage: string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verifica se req.user existe e se o usuário possui a capacidade necessária
    if (req.user && capabilityCheck(req)) {
      // Se o usuário tiver a capacidade correta, permite que a requisição continue
      next();
    } else {
      // Se não tiver a capacidade correta, retorna erro 403 (Acesso Proibido)
      res.status(403).json({ message: errorMessage });
      // Não chama next() para interromper a cadeia de execução
    }
  };
};

// Middlewares específicos criados a partir da função fábrica
/**
 * Middleware para verificar se o usuário logado é um Prestador de Serviço.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isPrestador = checkCapability(
  (req) => req.user?.isPrestador === true,
  'Acesso proibido: Requer privilégios de Prestador de Serviço.'
);

/**
 * Middleware para verificar se o usuário logado é um Administrador.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAdmin = checkCapability(
  (req) => req.user?.isAdmin === true,
  'Acesso proibido: Requer privilégios de Administrador.'
);

/**
 * Middleware para verificar se o usuário logado é um Comprador.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isComprador = checkCapability(
  (req) => req.user?.isComprador === true,
  'Acesso proibido: Requer privilégios de Comprador.'
);

/**
 * Middleware para verificar se o usuário logado é um Anunciante.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAnunciante = checkCapability(
  (req) => req.user?.isAnunciante === true,
  'Acesso proibido: Requer privilégios de Anunciante.'
);

// Exemplos de middlewares que verificam múltiplas capacidades
/**
 * Middleware para verificar se o usuário logado é um Administrador ou um Prestador.
 * Útil para rotas que podem ser acessadas por ambos os tipos de usuário.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isAdminOrPrestador = checkCapability(
  (req) => req.user?.isAdmin === true || req.user?.isPrestador === true,
  'Acesso proibido: Requer privilégios de Administrador ou Prestador de Serviço.'
);

/**
 * Middleware para verificar se o usuário logado é um Comprador ou um Anunciante.
 * Útil para rotas relacionadas a transações comerciais.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isCompradorOrAnunciante = checkCapability(
  (req) => req.user?.isComprador === true || req.user?.isAnunciante === true,
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
