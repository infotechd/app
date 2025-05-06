// src/middlewares/validationMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { TipoUsuarioEnum } from '../models/User';

// Função auxiliar para processar os resultados da validação
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validação para registro de usuário
export const registerValidation = [
  body('nome')
    .notEmpty().withMessage('Nome é obrigatório')
    .isString().withMessage('Nome deve ser uma string')
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
  
  body('email')
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  
  body('telefone')
    .optional()
    .isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  
  body('cpfCnpj')
    .notEmpty().withMessage('CPF/CNPJ é obrigatório')
    .isString().withMessage('CPF/CNPJ deve ser uma string')
    .custom((value) => {
      // Validação básica de CPF (11 dígitos) ou CNPJ (14 dígitos)
      const cleanedValue = value.replace(/\D/g, '');
      if (cleanedValue.length !== 11 && cleanedValue.length !== 14) {
        throw new Error('CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos');
      }
      return true;
    }),
  
  body('tipoUsuario')
    .notEmpty().withMessage('Tipo de usuário é obrigatório')
    .isIn(Object.values(TipoUsuarioEnum)).withMessage('Tipo de usuário inválido'),
  
  body('endereco')
    .optional()
    .isObject().withMessage('Endereço deve ser um objeto'),
  
  body('foto')
    .optional()
    .isString().withMessage('Foto deve ser uma string (URL ou Base64)'),
  
  validateRequest
];

// Validação para login de usuário
export const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória'),
  
  validateRequest
];

// Validação para edição de perfil
export const editProfileValidation = [
  body('nome')
    .optional()
    .isString().withMessage('Nome deve ser uma string')
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
  
  body('telefone')
    .optional()
    .isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  
  body('endereco')
    .optional()
    .isObject().withMessage('Endereço deve ser um objeto'),
  
  body('foto')
    .optional()
    .isString().withMessage('Foto deve ser uma string (URL ou Base64)'),
  
  body('senha')
    .optional()
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  
  validateRequest
];