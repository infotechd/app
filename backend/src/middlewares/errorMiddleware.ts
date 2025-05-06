import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Interface for standardized error response
interface ErrorResponse {
  message: string;
  status: number;
  stack?: string;
  errors?: any;
}

/**
 * Custom error class for API errors
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
 * Global error handling middleware
 * Captures errors passed through next(error) and returns standardized error responses
 * In production, sensitive details are not exposed
 */
const errorMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error caught by middleware:', err);

  const errorResponse: ErrorResponse = {
    message: 'Ocorreu um erro interno no servidor.',
    status: 500
  };

  // Handle known error types
  if (err instanceof ApiError) {
    errorResponse.message = err.message;
    errorResponse.status = err.status;
    if (err.errors) {
      errorResponse.errors = err.errors;
    }
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Mongoose validation errors
    errorResponse.message = 'Erro de validação dos dados.';
    errorResponse.status = 400;
    errorResponse.errors = Object.values(err.errors).map(e => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    // Mongoose cast errors (e.g., invalid ObjectId)
    errorResponse.message = 'Formato de dados inválido.';
    errorResponse.status = 400;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    errorResponse.message = 'Erro de duplicação de campo único.';
    errorResponse.status = 409;
  } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    // JWT errors
    errorResponse.message = 'Erro de autenticação.';
    errorResponse.status = 401;
  } else if (err.status || err.statusCode) {
    // Error with status code
    errorResponse.message = err.message || errorResponse.message;
    errorResponse.status = err.status || err.statusCode;
  }

  // In development, include the stack trace for debugging
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Send the error response
  return res.status(errorResponse.status).json(errorResponse);
};

export default errorMiddleware;