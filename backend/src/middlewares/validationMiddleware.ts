// Middleware de validação - Responsável por validar dados de entrada nas requisições

// Importação de tipos e funções necessárias para o middleware
import { Request, Response, NextFunction } from 'express'; // Tipos do Express para requisição, resposta e próxima função
import { body, validationResult } from 'express-validator'; // Funções para validação de campos do corpo da requisição
import { TipoUsuarioEnum } from '../models/User'; // Enum com os tipos de usuário permitidos no sistema

// Função auxiliar que processa os resultados da validação
// Verifica se existem erros e retorna resposta de erro ou continua o fluxo da requisição
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req); // Coleta todos os erros de validação encontrados
  if (!errors.isEmpty()) {
    // Se houver erros, retorna status 400 (Bad Request) com a lista de erros
    return res.status(400).json({ errors: errors.array() });
  }
  // Se não houver erros, permite que a requisição continue
  next();
};

// Array de validações para o registro de novos usuários no sistema
// Contém regras para validar todos os campos necessários no cadastro
export const registerValidation = [
  // Validação do campo nome
  body('nome')
    .notEmpty().withMessage('Nome é obrigatório') // Verifica se o campo não está vazio
    .isString().withMessage('Nome deve ser uma string') // Verifica se é uma string
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'), // Verifica o tamanho mínimo

  // Validação do campo email
  body('email')
    .notEmpty().withMessage('Email é obrigatório') // Verifica se o campo não está vazio
    .isEmail().withMessage('Email inválido') // Verifica se é um formato de email válido
    .normalizeEmail(), // Normaliza o email (remove espaços, converte para minúsculas, etc)

  // Validação do campo senha
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória') // Verifica se o campo não está vazio
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres') // Verifica o tamanho mínimo
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'), // Verifica a complexidade da senha

  // Validação do campo telefone (opcional)
  body('telefone')
    .optional() // Campo não obrigatório
    .isMobilePhone('pt-BR').withMessage('Telefone inválido'), // Verifica se é um telefone válido no formato brasileiro

  // Validação do campo CPF/CNPJ
  body('cpfCnpj')
    .notEmpty().withMessage('CPF/CNPJ é obrigatório') // Verifica se o campo não está vazio
    .isString().withMessage('CPF/CNPJ deve ser uma string') // Verifica se é uma string
    .custom((value) => {
      // Validação personalizada para verificar o formato do CPF ou CNPJ
      const cleanedValue = value.replace(/\D/g, ''); // Remove caracteres não numéricos
      if (cleanedValue.length !== 11 && cleanedValue.length !== 14) {
        throw new Error('CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos');
      }
      return true;
    }),

  // Validação do tipo de usuário
  body('tipoUsuario')
    .notEmpty().withMessage('Tipo de usuário é obrigatório') // Verifica se o campo não está vazio
    .isIn(Object.values(TipoUsuarioEnum)).withMessage('Tipo de usuário inválido'), // Verifica se o valor está entre os tipos permitidos

  // Validação do campo endereço (opcional)
  body('endereco')
    .optional() // Campo não obrigatório
    .isObject().withMessage('Endereço deve ser um objeto'), // Verifica se é um objeto

  // Validação do campo foto (opcional)
  body('foto')
    .optional() // Campo não obrigatório
    .isString().withMessage('Foto deve ser uma string (URL ou Base64)'), // Verifica se é uma string

  // Aplica a função de validação que verifica os erros e retorna resposta adequada
  validateRequest
];

// Array de validações para o processo de login de usuários
// Contém regras para validar os campos necessários para autenticação
export const loginValidation = [
  // Validação do campo email
  body('email')
    .notEmpty().withMessage('Email é obrigatório') // Verifica se o campo não está vazio
    .isEmail().withMessage('Email inválido') // Verifica se é um formato de email válido
    .normalizeEmail(), // Normaliza o email (remove espaços, converte para minúsculas, etc)

  // Validação do campo senha
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória'), // Verifica se o campo não está vazio

  // Aplica a função de validação que verifica os erros e retorna resposta adequada
  validateRequest
];

// Array de validações para a edição de perfil de usuário
// Contém regras para validar os campos que podem ser atualizados no perfil
// Todos os campos são opcionais, pois o usuário pode atualizar apenas alguns deles
export const editProfileValidation = [
  // Validação do campo nome (opcional)
  body('nome')
    .optional() // Campo não obrigatório
    .isString().withMessage('Nome deve ser uma string') // Verifica se é uma string
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'), // Verifica o tamanho mínimo

  // Validação do campo telefone (opcional)
  body('telefone')
    .optional() // Campo não obrigatório
    .isMobilePhone('pt-BR').withMessage('Telefone inválido'), // Verifica se é um telefone válido no formato brasileiro

  // Validação do campo endereço (opcional)
  body('endereco')
    .optional() // Campo não obrigatório
    .isObject().withMessage('Endereço deve ser um objeto'), // Verifica se é um objeto

  // Validação do campo foto (opcional)
  body('foto')
    .optional() // Campo não obrigatório
    .isString().withMessage('Foto deve ser uma string (URL ou Base64)'), // Verifica se é uma string

  // Validação do campo senha (opcional)
  body('senha')
    .optional() // Campo não obrigatório
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres') // Verifica o tamanho mínimo
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'), // Verifica a complexidade da senha

  // Aplica a função de validação que verifica os erros e retorna resposta adequada
  validateRequest
];
