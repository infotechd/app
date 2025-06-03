import { z } from 'zod';

/**
 * Esquema Zod para StatusOferta
 * 
 * Este esquema define os possíveis estados de uma oferta:
 * - rascunho: oferta em criação
 * - pronta: oferta publicada e ativa
 * - inativa: oferta temporariamente indisponível
 * - arquivada: oferta permanentemente indisponível
 */
export const statusOfertaSchema = z.enum(['rascunho', 'pronta', 'inativa', 'arquivada']);

// Inferência de tipo a partir do esquema
export type StatusOferta = z.infer<typeof statusOfertaSchema>;

/**
 * Esquema Zod para categorias (categorias de serviço)
 * 
 * Define um array de strings que representa as categorias de serviço.
 * Requer pelo menos uma categoria para ser válido.
 */
export const categoriasSchema = z.array(z.string()).min(1, { 
  message: "Pelo menos uma categoria é obrigatória" 
});

/**
 * Esquema Zod para estados (estados brasileiros)
 * 
 * Define uma enumeração com todos os estados do Brasil.
 */
export const estadoSchema = z.enum([
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
]);

/**
 * Esquema Zod para localização
 * 
 * Define um objeto com estado (obrigatório) e cidade (opcional).
 */
export const localizacaoSchema = z.object({
  estado: estadoSchema,
  cidade: z.string().optional()
});

/**
 * Esquema Zod para HorarioDisponivel
 * 
 * Define um objeto com horário de início e fim, ambos no formato HH:MM.
 * Inclui validação para garantir que o horário de fim seja posterior ao de início.
 */
export const horarioDisponivelSchema = z.object({
  inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: "Formato de hora inválido. Use HH:MM (ex: 09:30)" 
  }),
  fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: "Formato de hora inválido. Use HH:MM (ex: 17:00)" 
  }),
}).refine(data => {
  // Validar que a hora de fim é depois da hora de início
  const inicio = data.inicio.split(':').map(Number);
  const fim = data.fim.split(':').map(Number);

  const inicioMinutos = inicio[0] * 60 + inicio[1];
  const fimMinutos = fim[0] * 60 + fim[1];

  return fimMinutos > inicioMinutos;
}, {
  message: "A hora de fim deve ser posterior à hora de início",
  path: ["fim"]
});

// Inferência de tipo a partir do esquema
export type HorarioDisponivel = z.infer<typeof horarioDisponivelSchema>;

/**
 * Esquema Zod para RecorrenciaSemanal
 * 
 * Define um objeto com dia da semana (0-6, onde 0 é domingo) e
 * um array de horários disponíveis para esse dia.
 */
export const recorrenciaSemanalSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horarios: z.array(horarioDisponivelSchema).min(1, { 
    message: "Pelo menos um horário deve ser fornecido" 
  }),
});

// Inferência de tipo a partir do esquema
export type RecorrenciaSemanal = z.infer<typeof recorrenciaSemanalSchema>;

/**
 * Esquema Zod para Disponibilidade
 * 
 * Define um objeto com informações sobre disponibilidade do prestador:
 * - recorrenciaSemanal: padrão semanal de disponibilidade (opcional)
 * - duracaoMediaMinutos: duração média do serviço em minutos (opcional)
 * - observacoes: informações adicionais sobre disponibilidade (opcional)
 */
export const disponibilidadeSchema = z.object({
  recorrenciaSemanal: z.array(recorrenciaSemanalSchema).optional(),
  duracaoMediaMinutos: z.number().positive().optional(),
  observacoes: z.string().optional(),
});

// Inferência de tipo a partir do esquema
export type Disponibilidade = z.infer<typeof disponibilidadeSchema>;

/**
 * Esquema Zod para Oferta
 * 
 * Define a estrutura completa de uma oferta de serviço, incluindo:
 * - Informações básicas (descrição, preço, status)
 * - Disponibilidade do prestador
 * - Categorias e localização do serviço
 * - Informações sobre o prestador
 * - Datas de criação e atualização
 */
export const ofertaSchema = z.object({
  _id: z.string(),
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  preco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  status: statusOfertaSchema,
  disponibilidade: z.union([
    disponibilidadeSchema,
    z.string()
  ]),
  prestadorId: z.union([
    z.string(),
    z.object({ _id: z.string() })
  ]),
  categorias: categoriasSchema,
  localizacao: localizacaoSchema,

  // Campos opcionais
  dataCriacao: z.string().optional(),
  dataAtualizacao: z.string().optional(),

  // Campos para exibir informações do prestador
  nomePrestador: z.string().optional(),
  prestadorNome: z.string().optional(),
  prestadorInfo: z.object({ nome: z.string().optional() }).optional(),
  prestador: z.union([
    z.object({ nome: z.string().optional() }),
    z.string()
  ]).optional(),
});

// Inferência de tipo a partir do esquema
export type Oferta = z.infer<typeof ofertaSchema>;

/**
 * Esquema Zod para DadosOferta (criação/atualização)
 * 
 * Define os campos necessários para criar ou atualizar uma oferta.
 * É uma versão simplificada do esquema Oferta, sem campos gerados pelo sistema.
 */
export const dadosOfertaSchema = z.object({
  descricao: z.string().min(1, { message: "Descrição é obrigatória" }),
  preco: z.number().positive({ message: "Preço deve ser um valor positivo" }),
  status: statusOfertaSchema,
  disponibilidade: disponibilidadeSchema,
  categorias: categoriasSchema,
  localizacao: localizacaoSchema,
});

// Inferência de tipo a partir do esquema
export type DadosOferta = z.infer<typeof dadosOfertaSchema>;

/**
 * Esquema Zod para ParametrosBuscaOfertas
 * 
 * Define os parâmetros de busca e filtragem para consultar ofertas:
 * - Filtros de texto, preço, categoria, localização
 * - Opções de ordenação e paginação
 * - Configurações para inclusão de dados relacionados
 */
export const parametrosBuscaOfertasSchema = z.object({
  textoPesquisa: z.string().optional(),
  precoMax: z.number().optional(),
  precoMin: z.number().optional(),
  categorias: z.array(z.string()).optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  status: statusOfertaSchema.optional(),
  prestadorId: z.string().optional(),
  ordenarPor: z.enum(['preco', 'dataCriacao', 'avaliacao']).optional(),
  ordemClassificacao: z.enum(['asc', 'desc']).optional(),
  pagina: z.number().optional(),
  limite: z.number().optional(),
  incluirPrestador: z.boolean().optional(),
});

// Inferência de tipo a partir do esquema
export type ParametrosBuscaOfertas = z.infer<typeof parametrosBuscaOfertasSchema>;
