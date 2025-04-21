// src/types/training.ts

/**
 * Define os formatos possíveis para um treinamento.
 * Inferido de TreinamentoCreateScreen.tsx e Caso de Uso 26.
 */
export type TrainingFormat = 'video' | 'pdf' | 'webinar';

/**
 * Define os status possíveis para um treinamento.
 * Inferido de TreinamentoCreateScreen.tsx ('draft') e fluxo comum de publicação.
 */
export type TrainingStatus = 'draft' | 'published' | 'archived'; // Adicionado 'archived' como status comum

/**
 * Interface representando um objeto de Treinamento completo.
 * Contém todos os dados relevantes de um treinamento, como vindo da API.
 * Baseado no Diagrama de Classe, Caso de Uso 25/26 e telas Detail/List.
 */
export interface Training {
  _id: string; // Identificador único do treinamento (visto em TreinamentoListScreen keyExtractor)
  titulo: string;
  descricao: string;
  formato: TrainingFormat;
  preco: number; // 0 para gratuito
  status: TrainingStatus;
  /** Data/Hora para eventos ao vivo (webinars), formato string ISO 8601 ou null */
  dataHora: string | null;
  /** ID do Anunciante (usuário) que criou o treinamento */
  anuncianteId: string; // Assumindo que o backend associa ao ID do usuário Anunciante

  // Campos opcionais que podem ser úteis (adicionar se o backend fornecer)
  // dataCriacao?: string;
  // urlConteudo?: string; // Link para vídeo/pdf
  // autorNome?: string; // Nome do anunciante (para exibição)
}

/**
 * Interface para os dados necessários ao CRIAR um novo treinamento.
 * Baseado nos inputs de TreinamentoCreateScreen.tsx.
 */
export interface TrainingCreateData {
  titulo: string;
  descricao: string;
  formato: TrainingFormat;
  preco: number;
  dataHora?: string | null; // Opcional ao criar
  // Status pode ser definido no backend ou opcionalmente enviado ('draft' por padrão?)
  status?: TrainingStatus;
  // anuncianteId será inferido pelo backend a partir do token do usuário logado
}

/**
 * Interface para os dados necessários ao ATUALIZAR um treinamento existente.
 * Similar a CreateData, mas todos os campos são opcionais.
 */
export type TrainingUpdateData = Partial<TrainingCreateData>;
// Partial<T> torna todos os campos de T opcionais.

// --- Tipos para Respostas de API (opcional, mas bom para clareza em api.ts) ---

/** Resposta da API ao buscar a lista de treinamentos */
export interface FetchTrainingsResponse {
  trainings: Training[];
  // Pode incluir dados de paginação se houver
  // total?: number;
  // page?: number;
}

/** Resposta da API ao buscar detalhes de um treinamento */
export interface FetchTrainingDetailResponse {
  treinamento: Training;
  message?: string;
}

/** Resposta da API após criar/atualizar/deletar um treinamento */
export interface TrainingMutationResponse {
  message: string;
  treinamento?: Training; // Pode retornar o objeto modificado/criado
}