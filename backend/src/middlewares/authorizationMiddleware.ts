// src/middlewares/authorizationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { TipoUsuarioEnum } from '../models/User'; // Importa o Enum de tipos de usuário

/**
 * Middleware para verificar se o usuário logado é um Prestador de Serviço.
 * Assume que o authMiddleware já foi executado e populou req.user.
 */
export const isPrestador = (req: Request, res: Response, next: NextFunction): void => {
  // Verifica se req.user existe e se o tipoUsuario é PRESTADOR
  if (req.user && req.user.tipoUsuario === TipoUsuarioEnum.PRESTADOR) {
    // Se for Prestador, permite que a requisição continue para a próxima função (controller)
    next();
  } else {
    // Se não estiver logado como Prestador, retorna erro 403 Forbidden
    res.status(403).json({ message: 'Acesso proibido: Requer privilégios de Prestador de Serviço.' });
    // Não chama next() para interromper a cadeia de execução
  }
};

// Você pode adicionar outras funções de autorização aqui e exportá-las também
// Exemplo:
/*
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.tipoUsuario === TipoUsuarioEnum.ADMIN) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso proibido: Requer privilégios de Administrador.' });
  }
};
*/

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