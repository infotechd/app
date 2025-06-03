import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodType } from 'zod';
import logger from '../config/logger';

/**
 * Middleware para validação de dados usando Zod
 * Este middleware valida os dados recebidos nas requisições HTTP utilizando schemas do Zod.
 * Ele pode validar dados do corpo da requisição, parâmetros de consulta ou parâmetros de rota.
 * 
 * @param schema - Schema Zod para validação dos dados
 * @param source - Fonte dos dados a serem validados (body, query, params)
 */
export const validate = (schema: ZodType<any, any, any>, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log detalhado da estrutura dos dados recebidos antes da validação
      logger.debug(`[VALIDAÇÃO] Dados recebidos antes da validação (${source}):`, {
        path: req.path,
        method: req.method,
        data: JSON.stringify(req[source], null, 2)
      });

      // Realiza a validação dos dados da fonte especificada (body, query ou params) utilizando o schema Zod fornecido
      // O método parseAsync valida e também transforma os dados conforme as regras definidas no schema
      const data = await schema.parseAsync(req[source]);

      // Log dos dados após a validação e transformação pelo Zod
      logger.debug(`[VALIDAÇÃO] Dados após validação (${source}):`, {
        path: req.path,
        method: req.method,
        data: JSON.stringify(data, null, 2)
      });

      // Substitui os dados originais da requisição pelos dados já validados e transformados pelo Zod
      // Isso garante que apenas dados válidos e no formato correto sejam processados pela aplicação
      req[source] = data;

      next();
    } catch (error) {
      // Tratamento específico para erros de validação gerados pelo Zod
      // Estes erros ocorrem quando os dados não atendem às regras definidas no schema
      if (error instanceof ZodError) {
        // Registra os erros de validação no log para depuração com detalhes completos
        logger.error('=== ERRO DE VALIDAÇÃO ZOD DETALHADO ===', {
          path: req.path,
          method: req.method,
          requestBody: JSON.stringify(req[source], null, 2),
          errors: error.errors,
          formattedIssues: error.format(),
          zodErrorMessage: error.message
        });

        // Log específico para erros relacionados a campos de ID
        const idErrors = error.errors.filter(err => 
          err.path.includes('idUsuario') || 
          err.path.includes('id') || 
          err.path.join('.').includes('user.idUsuario') || 
          err.path.join('.').includes('user.id')
        );

        if (idErrors.length > 0) {
          logger.error('=== ERRO DE VALIDAÇÃO DE ID DETECTADO ===', {
            idErrors,
            requestBody: JSON.stringify(req[source], null, 2)
          });
        }

        // Formata os erros de validação para um formato mais amigável e estruturado
        // Cada erro contém o caminho do campo com problema e a mensagem descritiva
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        // Retorna resposta com status 400 (Bad Request) contendo os detalhes dos erros de validação
        return res.status(400).json({
          status: 'error',
          message: 'Erro de validação',
          errors: formattedErrors
        });
      }

      // Tratamento para outros tipos de erros inesperados durante o processo de validação
      // Registra o erro completo no log para análise posterior
      logger.error('Erro inesperado na validação:', { error });

      // Retorna resposta com status 500 (Internal Server Error)
      // Não expõe detalhes internos do erro para o cliente por questões de segurança
      return res.status(500).json({
        status: 'error',
        message: 'Erro interno do servidor durante validação'
      });
    }
  };
};

// Importação dos schemas de validação específicos para cada entidade do sistema
// Estes schemas definem as regras de validação para diferentes operações
import { createUserSchema, updateUserSchema, loginUserSchema } from '../schemas/userSchema';
import { createAnuncioSchema, updateAnuncioSchema } from '../schemas/anuncioSchema';
import { createAvaliacaoSchema, updateAvaliacaoSchema } from '../schemas/avaliacaoSchema';

// Validadores pré-configurados para operações relacionadas a Usuários
// Estes middlewares podem ser usados diretamente nas rotas para validar dados de usuários
export const validateCreateUser = validate(createUserSchema);
export const validateUpdateUser = validate(updateUserSchema);
export const validateLogin = validate(loginUserSchema);

// Validadores pré-configurados para operações relacionadas a Anúncios
// Estes middlewares validam os dados de criação e atualização de anúncios
export const validateCreateAnuncio = validate(createAnuncioSchema);
export const validateUpdateAnuncio = validate(updateAnuncioSchema);

// Validadores pré-configurados para operações relacionadas a Avaliações
// Estes middlewares garantem que os dados de avaliações estejam no formato correto
export const validateCreateAvaliacao = validate(createAvaliacaoSchema);
export const validateUpdateAvaliacao = validate(updateAvaliacaoSchema);

// Função auxiliar que cria um middleware para validar parâmetros de rota (como IDs)
// Útil para validar identificadores e outros parâmetros passados na URL
export const validateParams = (schema: ZodType<any, any, any>) => validate(schema, 'params');

// Função auxiliar que cria um middleware para validar parâmetros de consulta (query strings)
// Útil para validar filtros, opções de paginação e ordenação em requisições GET
export const validateQuery = (schema: ZodType<any, any, any>) => validate(schema, 'query');
