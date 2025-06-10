/**
 * Utilitários para implementação de paginação padronizada em todas as rotas da API
 * Este módulo fornece funções para facilitar a implementação de paginação consistente
 * em diferentes controladores, garantindo uma experiência uniforme para os clientes.
 */

import { Request } from 'express';
import mongoose from 'mongoose';

/**
 * Interface para metadados de paginação
 */
export interface PaginationMetadata {
  totalItems: number;      // Total de itens disponíveis
  totalPages: number;      // Total de páginas
  currentPage: number;     // Página atual
  pageSize: number;        // Tamanho da página (itens por página)
  hasNextPage: boolean;    // Se existe uma próxima página
  hasPrevPage: boolean;    // Se existe uma página anterior
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];               // Array de itens para a página atual
  pagination: PaginationMetadata; // Metadados de paginação
}

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
  page?: number;           // Número da página (começa em 1)
  limit?: number;          // Número de itens por página
  maxLimit?: number;       // Limite máximo de itens por página
  defaultLimit?: number;   // Limite padrão de itens por página
}

/**
 * Extrai e valida parâmetros de paginação da requisição
 * @param req Objeto de requisição Express
 * @param options Opções de paginação
 * @returns Objeto com página e limite validados
 */
export function extractPaginationParams(
  req: Request,
  options: PaginationOptions = {}
): { page: number; limit: number } {
  // Valores padrão
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  // Extrai valores da query string
  let page = parseInt(req.query.page as string) || options.page || 1;
  let limit = parseInt(req.query.limit as string) || options.limit || defaultLimit;

  // Validação
  if (page < 1) page = 1;
  if (limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit };
}

/**
 * Calcula metadados de paginação
 * @param totalItems Total de itens disponíveis
 * @param page Página atual
 * @param limit Itens por página
 * @returns Objeto com metadados de paginação
 */
export function calculatePaginationMetadata(
  totalItems: number,
  page: number,
  limit: number
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    totalPages,
    currentPage: page,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

/**
 * Aplica paginação a uma consulta Mongoose
 * @param query Consulta Mongoose
 * @param page Página atual
 * @param limit Itens por página
 * @returns Consulta Mongoose com paginação aplicada
 */
export function applyPaginationToQuery<T>(
  query: mongoose.Query<any, any>,
  page: number,
  limit: number
): mongoose.Query<any, any> {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}

/**
 * Executa uma consulta paginada
 * @param model Modelo Mongoose
 * @param filter Filtro para a consulta
 * @param page Página atual
 * @param limit Itens por página
 * @param options Opções adicionais (sort, select, populate)
 * @returns Promise com resultado paginado
 */
export async function paginatedQuery<T>(
  model: mongoose.Model<any>,
  filter: mongoose.FilterQuery<any> = {},
  page: number,
  limit: number,
  options: {
    sort?: Record<string, 1 | -1>;
    select?: string;
    populate?: mongoose.PopulateOptions | (string | mongoose.PopulateOptions)[];
  } = {}
): Promise<PaginatedResult<T>> {
  // Executa a consulta e a contagem em paralelo para melhor performance
  const [data, totalItems] = await Promise.all([
    model
      .find(filter)
      .sort(options.sort || { createdAt: -1 })
      .select(options.select || '')
      .populate(options.populate || [])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    model.countDocuments(filter)
  ]);

  // Calcula metadados de paginação
  const pagination = calculatePaginationMetadata(totalItems, page, limit);

  // Retorna resultado paginado
  return { data, pagination };
}
