// src/types/training.ts

/**
 * Define os formatos possíveis para um treinamento.
 * Inferido de TreinamentoCreateScreen.tsx e Caso de Uso 26.
 * 
 * Esta é uma definição de tipo que especifica os três formatos permitidos para treinamentos:
 * - video: Treinamentos em formato de vídeo
 * - pdf: Treinamentos em formato de documento PDF
 * - webinar: Treinamentos ao vivo em formato de webinar
 */
export type TrainingFormat = 'video' | 'pdf' | 'webinar';

/**
 * Define os status possíveis para um treinamento.
 * Inferido de TreinamentoCreateScreen.tsx ('draft') e fluxo comum de publicação.
 * 
 * Esta é uma definição de tipo que especifica os três status possíveis para um treinamento:
 * - draft: Rascunho, treinamento ainda não publicado
 * - published: Publicado, treinamento disponível para visualização
 * - archived: Arquivado, treinamento não mais disponível
 */
export type TrainingStatus = 'draft' | 'published' | 'archived'; // Adicionado 'archived' como status comum

/**
 * Interface representando um objeto de Treinamento completo.
 * Contém todos os dados relevantes de um treinamento, como vindo da API.
 * Baseado no Diagrama de Classe, Caso de Uso 25/26 e telas Detail/List.
 * 
 * Esta interface define a estrutura completa de um objeto de treinamento
 * conforme retornado pela API, incluindo todos os campos necessários
 * para exibição e manipulação nas telas do aplicativo.
 */
export interface Training {
  _id: string; // Identificador único do treinamento (visto em TreinamentoListScreen keyExtractor)
  titulo: string; // Título do treinamento
  descricao: string; // Descrição detalhada do treinamento
  formato: TrainingFormat; // Formato do treinamento (video, pdf ou webinar)
  preco: number; // 0 para gratuito
  status: TrainingStatus; // Status atual do treinamento
  /** Data/Hora para eventos ao vivo (webinars), formato string ISO 8601 ou null */
  dataHora: string | null;
  /** ID do Anunciante (usuário) que criou o treinamento */
  anuncianteId: string; // Assumindo que o backend associa ao ID do usuário Anunciante

  // Campos opcionais que podem ser úteis (adicionar se o backend fornecer)
  // dataCriacao?: string; // Data de criação do treinamento
  // urlConteudo?: string; // Link para vídeo/pdf
  // autorNome?: string; // Nome do anunciante (para exibição)
}

/**
 * Interface para os dados necessários ao CRIAR um novo treinamento.
 * Baseado nos inputs de TreinamentoCreateScreen.tsx.
 * 
 * Esta interface define os campos obrigatórios e opcionais que devem ser
 * fornecidos ao criar um novo treinamento no sistema. Ela é utilizada
 * principalmente na tela de criação de treinamentos.
 */
export interface TrainingCreateData {
  titulo: string; // Título do treinamento
  descricao: string; // Descrição detalhada do treinamento
  formato: TrainingFormat; // Formato do treinamento (video, pdf ou webinar)
  preco: number; // Preço do treinamento (0 para gratuito)
  dataHora?: string | null; // Opcional ao criar - Data e hora para eventos ao vivo
  // Status pode ser definido no backend ou opcionalmente enviado ('draft' por padrão?)
  status?: TrainingStatus; // Status inicial do treinamento
  // anuncianteId será inferido pelo backend a partir do token do usuário logado
}

/**
 * Interface para os dados necessários ao ATUALIZAR um treinamento existente.
 * Similar a CreateData, mas todos os campos são opcionais.
 * 
 * Esta interface utiliza o tipo Partial do TypeScript para tornar todos os campos
 * da interface TrainingCreateData opcionais, permitindo que apenas os campos
 * que precisam ser atualizados sejam enviados na requisição.
 */
export type TrainingUpdateData = Partial<TrainingCreateData>;
// Partial<T> torna todos os campos de T opcionais.

// --- Tipos para Respostas de API (opcional, mas bom para clareza em api.ts) ---

/**
 * Resposta da API ao buscar a lista de treinamentos
 * 
 * Esta interface define a estrutura da resposta retornada pela API
 * quando uma requisição para listar treinamentos é feita.
 */
export interface FetchTrainingsResponse {
  trainings: Training[]; // Array de objetos de treinamento
  // Pode incluir dados de paginação se houver
  // total?: number; // Número total de treinamentos disponíveis
  // page?: number; // Página atual da listagem
}

/**
 * Resposta da API ao buscar detalhes de um treinamento
 * 
 * Esta interface define a estrutura da resposta retornada pela API
 * quando uma requisição para obter detalhes de um treinamento específico é feita.
 */
export interface FetchTrainingDetailResponse {
  treinamento: Training; // Objeto de treinamento completo
  message?: string; // Mensagem opcional da API (sucesso, informações adicionais, etc.)
}

/**
 * Resposta da API após criar/atualizar/deletar um treinamento
 * 
 * Esta interface define a estrutura da resposta retornada pela API
 * quando uma operação de criação, atualização ou exclusão de treinamento é realizada.
 */
export interface TrainingMutationResponse {
  message: string; // Mensagem de confirmação ou erro da operação
  treinamento?: Training; // Pode retornar o objeto modificado/criado
}
