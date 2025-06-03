// src/types/offer.ts
// Arquivo que define os tipos e interfaces relacionados às ofertas de serviços

// Importar User se precisar referenciar o objeto completo do prestador
// import { User } from './user';

// Type aliases for English names (compatibility with existing code)
export type Offer = Oferta;
export type FetchOffersParams = ParametrosBuscaOfertas;
export type OfferData = DadosOferta;
export type OfferStatus = StatusOferta;
export type IDisponibilidade = Disponibilidade;
export type IRecorrenciaSemanal = RecorrenciaSemanal;
export type IHorarioDisponivel = HorarioDisponivel;
export type ILocalizacao = Localizacao;

/**
 * Define os status possíveis para uma Oferta de Serviço.
 * Baseado em OfertaServicoScreen.tsx e fluxo comum.
 * 
 * 'draft' (rascunho) - Oferta em criação, não visível para clientes
 * 'ready' (pronta) - Oferta publicada e visível para busca
 * 'inactive' (inativa) - Oferta temporariamente indisponível
 * 'archived' (arquivada) - Oferta não disponível permanentemente
 */
export type StatusOferta = 'draft' | 'ready' | 'inactive' | 'archived';

/**
 * Categorias de serviços disponíveis
 * 
 * Este enum define todas as categorias de serviços que podem ser oferecidas
 * pelos prestadores na plataforma. Cada categoria representa um tipo específico
 * de serviço que pode ser filtrado na busca.
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
 * 
 * Este enum contém todos os estados do Brasil com suas siglas como chaves
 * e nomes completos como valores. Utilizado para padronizar a seleção de
 * estados na localização das ofertas de serviços.
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
 * 
 * Este enum contém todas as capitais dos estados brasileiros.
 * Utilizado para facilitar a seleção de cidades importantes na
 * localização das ofertas de serviços.
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
 * 
 * Define a estrutura de dados para armazenar informações de localização
 * geográfica de uma oferta de serviço. Contém o estado (obrigatório) e
 * a cidade (opcional) onde o serviço é oferecido.
 */
export interface Localizacao {
  estado: EstadoBrasil | "Acre" | "Alagoas" | "Amapá" | "Amazonas" | "Bahia" | "Ceará" | "Distrito Federal" | 
    "Espírito Santo" | "Goiás" | "Maranhão" | "Mato Grosso" | "Mato Grosso do Sul" | "Minas Gerais" | 
    "Pará" | "Paraíba" | "Paraná" | "Pernambuco" | "Piauí" | "Rio de Janeiro" | "Rio Grande do Norte" | 
    "Rio Grande do Sul" | "Rondônia" | "Roraima" | "Santa Catarina" | "São Paulo" | "Sergipe" | "Tocantins";
  cidade?: string;
}

/**
 * Interface para horário disponível com hora de início e fim
 * 
 * Define a estrutura de dados para armazenar um intervalo de horário
 * em que o prestador está disponível para realizar o serviço.
 * Utiliza o formato de 24 horas (HH:MM).
 */
export interface HorarioDisponivel {
  inicio: string; // Formato HH:MM (ex: "08:00")
  fim: string; // Formato HH:MM (ex: "17:00")
}

/**
 * Interface para recorrência semanal (dias da semana e horários)
 * 
 * Define a estrutura de dados para armazenar a disponibilidade do prestador
 * em um dia específico da semana, incluindo os horários disponíveis nesse dia.
 * Permite configurar diferentes horários para cada dia da semana.
 */
export interface RecorrenciaSemanal {
  diaSemana: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  horarios: HorarioDisponivel[]; // Lista de intervalos de horários disponíveis neste dia
}

/**
 * Interface para o objeto de Disponibilidade estruturado
 * 
 * Define a estrutura completa de disponibilidade do prestador de serviços,
 * incluindo os dias e horários recorrentes, duração média do serviço e
 * observações adicionais. Esta estrutura é utilizada pelo backend para
 * gerenciar a agenda do prestador.
 */
export interface Disponibilidade {
  recorrenciaSemanal?: RecorrenciaSemanal[]; // Array opcional de dias/horários semanais
  duracaoMediaMinutos?: number; // Duração média do serviço em minutos (ex: 60 para 1 hora)
  observacoes?: string; // Observações adicionais sobre disponibilidade
}

/**
 * Interface para representar informações básicas do prestador
 * 
 * Define a estrutura de dados simplificada com informações essenciais
 * do prestador de serviços. Utilizada quando não é necessário carregar
 * todos os dados do prestador, apenas as informações para exibição básica.
 */
export interface InfoPrestador {
  _id: string; // Identificador único do prestador
  nome?: string; // Nome do prestador (opcional)
  foto?: string; // URL da foto de perfil do prestador (opcional)
}

/**
 * Interface representando um objeto de Oferta de Serviço completo.
 * 
 * Define a estrutura completa de uma oferta de serviço, incluindo todos os dados
 * necessários para exibição, busca e gerenciamento. Esta interface é baseada no
 * Diagrama de Classe, Casos de Uso 3/4, e telas relacionadas do sistema.
 * 
 * Contém tanto os campos obrigatórios quanto os opcionais que podem ser
 * fornecidos pelo backend em diferentes contextos.
 */
export interface Oferta {
  _id: string; // Identificador único da oferta
  descricao: string; // Descrição detalhada do serviço oferecido
  preco: number; // Valor do serviço em reais
  status: StatusOferta; // Status atual da oferta (rascunho, pronta, etc.)

  /** Detalhes sobre a disponibilidade do prestador para realizar o serviço */
  disponibilidade: Disponibilidade | string; // Aceita objeto estruturado ou string para compatibilidade

  /** Identificação do prestador que criou a oferta */
  prestadorId: string | InfoPrestador; // Pode ser apenas o ID ou o objeto com informações básicas

  /** Categorias de serviços oferecidos nesta oferta */
  categorias: string[]; // Lista de categorias aplicáveis a esta oferta

  /** Localização onde o serviço é oferecido */
  localizacao: Localizacao; // Estado e cidade onde o serviço está disponível

  // Campos opcionais que o backend pode fornecer ou que são úteis para a interface
  dataCriacao?: string; // Data de criação no formato ISO 8601
  dataAtualizacao?: string; // Data da última atualização no formato ISO 8601

  // Campos para exibição facilitada de informações do prestador
  nomePrestador?: string; // Nome do prestador (alternativa)
  prestadorNome?: string; // Nome do prestador (alternativa)
  prestadorInfo?: { nome?: string; }; // Informações básicas do prestador
  prestador?: { nome?: string; } | string; // Objeto prestador ou ID

  // Campos comentados que podem ser implementados no futuro
  // avaliacaoMediaPrestador?: number; // Média das avaliações do prestador
  // numeroContratacoesPrestador?: number; // Quantidade de contratações realizadas
}

/**
 * Interface para os dados necessários ao CRIAR ou ATUALIZAR uma Oferta de Serviço.
 * 
 * Define a estrutura de dados que deve ser enviada ao backend quando um prestador
 * está criando uma nova oferta ou atualizando uma oferta existente. Esta interface
 * é baseada nos campos de entrada disponíveis na tela OfertaServicoScreen.tsx.
 * 
 * Diferente da interface Oferta, esta não inclui campos gerados pelo servidor como
 * IDs ou datas de criação/atualização.
 */
export interface DadosOferta {
  descricao: string; // Descrição detalhada do serviço oferecido
  preco: number; // Valor do serviço em reais
  status: StatusOferta; // Status desejado para a oferta
  disponibilidade: Disponibilidade; // Objeto estruturado com a disponibilidade do prestador
  categorias: string[]; // Lista de categorias selecionadas para esta oferta
  localizacao: Localizacao; // Estado e cidade onde o serviço será oferecido
  // O ID do prestador é inferido pelo backend através do token de autenticação
}

/**
 * Parâmetros de busca/filtragem para a API de listagem de ofertas.
 * 
 * Define todos os possíveis parâmetros que podem ser utilizados para filtrar,
 * ordenar e paginar a busca de ofertas de serviços. Esta interface é baseada
 * nos filtros disponíveis na tela BuscarOfertasScreen.tsx e nas funcionalidades
 * de busca implementadas no backend.
 * 
 * Todos os campos são opcionais, permitindo buscas com diferentes combinações
 * de filtros.
 */
export interface ParametrosBuscaOfertas {
  textoPesquisa?: string; // Texto livre para busca em descrições e títulos
  precoMax?: number; // Valor máximo em reais para filtrar ofertas
  precoMin?: number; // Valor mínimo em reais para filtrar ofertas
  categorias?: string[]; // Lista de categorias para filtrar ofertas
  estado?: string; // Estado brasileiro para filtrar por localização
  cidade?: string; // Cidade para filtrar por localização
  status?: StatusOferta; // Status da oferta (ex: buscar apenas ofertas 'pronta')
  prestadorId?: string; // ID do prestador para buscar ofertas de um prestador específico

  // Campos para ordenação dos resultados
  ordenarPor?: 'preco' | 'dataCriacao' | 'avaliacao'; // Campo usado para ordenação
  ordemClassificacao?: 'asc' | 'desc'; // Ordem ascendente ou descendente

  // Campos para paginação dos resultados
  pagina?: number; // Número da página para paginação (começa em 1)
  limite?: number; // Quantidade de itens por página

  // Opções adicionais
  incluirPrestador?: boolean; // Indica se deve incluir informações detalhadas do prestador na resposta
}
