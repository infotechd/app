import { z } from 'zod';

// É uma boa prática importar os Enums do modelo para garantir consistência
// Isso garante que os valores aceitos no schema sejam exatamente os mesmos definidos no modelo
import { EstadoBrasilEnum, CategoriaServicoEnum } from '../models/OfertaServico';

/**
 * Schema para validação de parâmetros de busca de ofertas públicas
 * 
 * Este schema valida os parâmetros de consulta (query params) enviados nas requisições
 * para busca e filtragem de ofertas de serviço públicas. É utilizado pelo middleware
 * validateSearchPublicOfertas para garantir que os parâmetros estejam no formato correto
 * antes de serem processados pelo controlador.
 */
export const searchPublicOfertasSchema = z.object({
  // Parâmetros de paginação
  // Valida que page seja uma string contendo apenas dígitos (número inteiro)
  page: z.string().regex(/^\d+$/).optional(),

  // Valida que limit seja uma string contendo apenas dígitos (número inteiro)
  limit: z.string().regex(/^\d+$/).optional(),

  // Parâmetro para busca textual
  // Permite buscar ofertas que contenham o texto informado no título ou descrição
  textoPesquisa: z.string().optional(),

  // Filtro de preço máximo
  // Valida que precoMax seja uma string representando um número com até 2 casas decimais
  // Exemplo: "100" ou "100.50"
  precoMax: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),

  // Filtro de categorias
  // Aceita tanto uma única categoria quanto um array de categorias
  // Utiliza os valores do enum CategoriaServicoEnum para garantir que apenas categorias válidas sejam aceitas
  categorias: z.union([
    z.nativeEnum(CategoriaServicoEnum),                // Uma única categoria
    z.array(z.nativeEnum(CategoriaServicoEnum))        // Array de categorias
  ]).optional(),

  // Filtro de localização por estado
  // Utiliza o enum EstadoBrasilEnum para garantir que apenas estados válidos sejam aceitos
  estado: z.nativeEnum(EstadoBrasilEnum).optional(),

  // Filtro de localização por cidade
  // Só é aplicado se o estado também for informado
  cidade: z.string().optional(),

  // Parâmetro de ordenação dos resultados
  // Exemplo: "preco" (ascendente) ou "-preco" (descendente)
  // Múltiplos campos podem ser especificados separados por vírgula: "preco,-createdAt"
  sort: z.string().optional(),

  // Validação para o campo de tipo de prestador (PF/PJ)
  // Permite filtrar ofertas por tipo de prestador (pessoa física ou jurídica)
  tipoPrestador: z.enum(['pessoa_fisica', 'pessoa_juridica']).optional(),
});
