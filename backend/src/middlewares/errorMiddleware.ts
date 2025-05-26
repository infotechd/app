import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Interface para resposta de erro padronizada
interface ErrorResponse {
  message: string;
  status: number;
  stack?: string;
  errors?: any;
}

/**
 * Classe de erro personalizada para erros de API
 */
export class ApiError extends Error {
  status: number;
  errors?: any;

  constructor(message: string, status: number = 500, errors?: any) {
    super(message);
    this.status = status;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de tratamento global de erros
 * Captura erros passados através de next(error) e retorna respostas de erro padronizadas
 * Em produção, detalhes sensíveis não são expostos
 */
const errorMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Erro capturado pelo middleware:', err);

  const errorResponse: ErrorResponse = {
    message: 'Ocorreu um erro interno no servidor.',
    status: 500
  };

  // Trata tipos de erros conhecidos
  if (err instanceof ApiError) {
    errorResponse.message = err.message;
    errorResponse.status = err.status;
    if (err.errors) {
      errorResponse.errors = err.errors;
    }
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Erros de validação do Mongoose
    errorResponse.message = 'Erro de validação dos dados.';
    errorResponse.status = 400;
    errorResponse.errors = Object.values(err.errors).map(e => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    // Erros de conversão do Mongoose (ex: ObjectId inválido)
    errorResponse.message = 'Formato de dados inválido.';
    errorResponse.status = 400;
  } else if (err.code === 11000) {
    // Erro de chave duplicada do MongoDB
    errorResponse.message = 'Erro de duplicação de campo único.';
    errorResponse.status = 409;
  } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    // Erros de JWT
    errorResponse.message = 'Erro de autenticação.';
    errorResponse.status = 401;
  } else if (err.status || err.statusCode) {
    // Erro com código de status
    errorResponse.message = err.message || errorResponse.message;
    errorResponse.status = err.status || err.statusCode;
  }

  // Em ambiente de desenvolvimento, inclui o rastreamento de pilha para depuração
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Envia a resposta de erro
  return res.status(errorResponse.status).json(errorResponse);
};

export default errorMiddleware;
