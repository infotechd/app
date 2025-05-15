import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodType } from 'zod';
import logger from '../config/logger';

/**
 * Middleware para validação de dados usando Zod
 * @param schema - Schema Zod para validação
 * @param source - Fonte dos dados a serem validados (body, query, params)
 */
export const validate = (schema: ZodType<any, any, any>, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida os dados da fonte especificada usando o schema Zod
      const data = await schema.parseAsync(req[source]);

      // Substitui os dados originais pelos dados validados e transformados pelo Zod
      req[source] = data;

      next();
    } catch (error) {
      // Trata erros de validação do Zod
      if (error instanceof ZodError) {
        logger.debug('Erro de validação Zod:', { errors: error.errors });

        // Formata os erros de validação para um formato amigável
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Erro de validação',
          errors: formattedErrors
        });
      }

      // Trata outros tipos de erros
      logger.error('Erro inesperado na validação:', { error });
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor durante validação'
      });
    }
  };
};

// Exporta validadores específicos para os schemas criados
import { createUserSchema, updateUserSchema, loginUserSchema } from '../schemas/userSchema';
import { createAnuncioSchema, updateAnuncioSchema } from '../schemas/anuncioSchema';
import { createAvaliacaoSchema, updateAvaliacaoSchema } from '../schemas/avaliacaoSchema';

// Validadores para User
export const validateCreateUser = validate(createUserSchema);
export const validateUpdateUser = validate(updateUserSchema);
export const validateLogin = validate(loginUserSchema);

// Validadores para Anuncio
export const validateCreateAnuncio = validate(createAnuncioSchema);
export const validateUpdateAnuncio = validate(updateAnuncioSchema);

// Validadores para Avaliacao
export const validateCreateAvaliacao = validate(createAvaliacaoSchema);
export const validateUpdateAvaliacao = validate(updateAvaliacaoSchema);

// Função auxiliar para validar parâmetros de rota (como IDs)
export const validateParams = (schema: ZodType<any, any, any>) => validate(schema, 'params');

// Função auxiliar para validar query strings
export const validateQuery = (schema: ZodType<any, any, any>) => validate(schema, 'query');
