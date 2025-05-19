// src/types/offer.ts

// Importar User se precisar referenciar o objeto completo do prestador
// import { User } from './user';

/**
 * Define os status possíveis para uma Oferta de Serviço.
 * Baseado em OfertaServicoScreen.tsx ('draft', 'ready') e fluxo comum.
 */
export type OfferStatus = 'draft' | 'ready' | 'inactive' | 'archived';

/**
 * Categorias de serviços disponíveis
 */
export enum CategoriaServico {
  LIMPEZA = 'Limpeza',
  MANUTENCAO = 'Manutenção',
  REFORMAS = 'Reformas',
  ELETRICA = 'Elétrica',
  HIDRAULICA = 'Hidráulica',
  PINTURA = 'Pintura',
  JARDINAGEM = 'Jardinagem',
  INFORMATICA = 'Informática',
  DESIGN = 'Design',
  MARKETING = 'Marketing',
  TRADUCAO = 'Tradução',
  AULAS = 'Aulas',
  CONSULTORIA = 'Consultoria',
  SAUDE = 'Saúde',
  BELEZA = 'Beleza',
  EVENTOS = 'Eventos',
  TRANSPORTE = 'Transporte',
  OUTROS = 'Outros'
}

/**
 * Estados brasileiros
 */
export enum EstadoBrasil {
  AC = 'Acre',
  AL = 'Alagoas',
  AP = 'Amapá',
  AM = 'Amazonas',
  BA = 'Bahia',
  CE = 'Ceará',
  DF = 'Distrito Federal',
  ES = 'Espírito Santo',
  GO = 'Goiás',
  MA = 'Maranhão',
  MT = 'Mato Grosso',
  MS = 'Mato Grosso do Sul',
  MG = 'Minas Gerais',
  PA = 'Pará',
  PB = 'Paraíba',
  PR = 'Paraná',
  PE = 'Pernambuco',
  PI = 'Piauí',
  RJ = 'Rio de Janeiro',
  RN = 'Rio Grande do Norte',
  RS = 'Rio Grande do Sul',
  RO = 'Rondônia',
  RR = 'Roraima',
  SC = 'Santa Catarina',
  SP = 'São Paulo',
  SE = 'Sergipe',
  TO = 'Tocantins'
}

/**
 * Capitais brasileiras
 */
export enum CapitalBrasil {
  RIO_BRANCO = 'Rio Branco',
  MACEIO = 'Maceió',
  MACAPA = 'Macapá',
  MANAUS = 'Manaus',
  SALVADOR = 'Salvador',
  FORTALEZA = 'Fortaleza',
  BRASILIA = 'Brasília',
  VITORIA = 'Vitória',
  GOIANIA = 'Goiânia',
  SAO_LUIS = 'São Luís',
  CUIABA = 'Cuiabá',
  CAMPO_GRANDE = 'Campo Grande',
  BELO_HORIZONTE = 'Belo Horizonte',
  BELEM = 'Belém',
  JOAO_PESSOA = 'João Pessoa',
  CURITIBA = 'Curitiba',
  RECIFE = 'Recife',
  TERESINA = 'Teresina',
  RIO_DE_JANEIRO = 'Rio de Janeiro',
  NATAL = 'Natal',
  PORTO_ALEGRE = 'Porto Alegre',
  PORTO_VELHO = 'Porto Velho',
  BOA_VISTA = 'Boa Vista',
  FLORIANOPOLIS = 'Florianópolis',
  SAO_PAULO = 'São Paulo',
  ARACAJU = 'Aracaju',
  PALMAS = 'Palmas'
}

/**
 * Interface para localização
 */
export interface ILocalizacao {
  estado: EstadoBrasil | 'Acre' | 'Alagoas' | 'Amapá' | 'Amazonas' | 'Bahia' | 'Ceará' | 'Distrito Federal' |
  'Espírito Santo' | 'Goiás' | 'Maranhão' | 'Mato Grosso' | 'Mato Grosso do Sul' |
  'Minas Gerais' | 'Pará' | 'Paraíba' | 'Paraná' | 'Pernambuco' | 'Piauí' |
  'Rio de Janeiro' | 'Rio Grande do Norte' | 'Rio Grande do Sul' | 'Rondônia' |
  'Roraima' | 'Santa Catarina' | 'São Paulo' | 'Sergipe' | 'Tocantins';
  cidade?: string;
}

/**
 * Interface para horário disponível com hora de início e fim
 */
export interface IHorarioDisponivel {
  inicio: string; // Formato HH:MM
  fim: string; // Formato HH:MM
}

/**
 * Interface para recorrência semanal (dias da semana e horários)
 */
export interface IRecorrenciaSemanal {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horarios: IHorarioDisponivel[];
}

/**
 * Interface para o objeto de Disponibilidade estruturado
 * conforme esperado pelo backend
 */
export interface IDisponibilidade {
  recorrenciaSemanal?: IRecorrenciaSemanal[]; // Array opcional de dias/horários
  duracaoMediaMinutos?: number; // Duração média do serviço em minutos
  observacoes?: string; // Observações adicionais
}

/**
 * Interface representando um objeto de Oferta de Serviço completo.
 * Baseado no Diagrama de Classe, Casos de Uso 3/4, e telas relacionadas.
 */
export interface Offer {
  _id: string; // Identificador único da oferta
  descricao: string;
  preco: number;
  status: OfferStatus;
  /** Detalhes sobre a disponibilidade estruturados */
  disponibilidade: IDisponibilidade | string; // Aceita ambos formatos para compatibilidade
  /** ID do PrestadorServico (User) que criou a oferta */
  prestadorId: string;
  /** Categorias de serviços oferecidos */
  categorias: string[];
  /** Localização onde o serviço é oferecido */
  localizacao: ILocalizacao;

  // Campos opcionais que o backend pode fornecer ou que são úteis
  dataCriacao?: string; // ISO 8601
  dataAtualizacao?: string; // ISO 8601
  // Para exibição facilitada na busca, o backend pode incluir:
  // prestadorInfo?: Pick<User, 'idUsuario' | 'nome' | 'foto'>; // Info básica do prestador
  // avaliacaoMediaPrestador?: number;
  // numeroContratacoesPrestador?: number;
}

/**
 * Interface para os dados necessários ao CRIAR ou ATUALIZAR uma Oferta de Serviço.
 * Baseado nos inputs de OfertaServicoScreen.tsx.
 */
export interface OfferData {
  descricao: string;
  preco: number;
  status: OfferStatus;
  disponibilidade: IDisponibilidade; // Agora espera um objeto estruturado
  categorias: string[]; // Array de categorias de serviços
  localizacao: ILocalizacao; // Objeto de localização
  // prestadorId é inferido pelo backend via token
}

/**
 * Parâmetros de busca/filtragem para a API de listagem de ofertas.
 * Baseado em BuscarOfertasScreen.tsx.
 */
export interface FetchOffersParams {
  textoPesquisa?: string;
  precoMax?: number;
  precoMin?: number;
  categorias?: string[]; // Array de categorias para filtrar
  estado?: string; // Estado para filtrar
  cidade?: string; // Cidade para filtrar
  status?: OfferStatus; // Ex: buscar apenas 'ready'
  prestadorId?: string; // Para buscar ofertas de um prestador específico
  sortBy?: 'preco' | 'dataCriacao' | 'avaliacao'; // Exemplo
  sortOrder?: 'asc' | 'desc'; // Exemplo
  page?: number; // Para paginação
  limit?: number; // Para paginação
}
