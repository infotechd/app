// src/types/negociacao.ts

/**
 * Define os status possíveis durante o processo de negociação de ajustes.
 * Baseado na lógica da tela NegociacaoScreen.tsx.
 */
export type NegociacaoStatus =
  | 'pendente'         // Iniciada pelo Comprador, aguardando resposta do Prestador
  | 'contraproposta'   // Prestador respondeu com ajustes
  | 'confirmada'       // Comprador aceitou/confirmou a proposta/contraproposta
  | 'rejeitada'        // Uma das partes rejeitou (implícito ou explícito)
  | 'cancelada';       // Processo cancelado

/**
 * Interface para representar os ajustes propostos (preço, prazo, observações).
 * Usado tanto na proposta inicial quanto na resposta do prestador.
 */
export interface PropostaAjuste {
  novoPreco: number;
  /** Novo prazo proposto (pode ser uma data ISO, ou uma descrição textual como "5 dias úteis") */
  novoPrazo: string;
  observacoes?: string; // Comentários adicionais
}

/**
 * Interface representando o objeto completo de uma Negociação.
 * Contém as propostas e o estado atual do processo.
 */
export interface Negociacao {
  _id: string;             // ID único da negociação
  contratacaoId: string;   // ID da Contratacao original que está sendo negociada
  compradorId: string;     // ID do User Comprador
  prestadorId: string;    // ID do User Prestador
  propostaInicial: PropostaAjuste; // Proposta feita pelo comprador
  respostaProvider?: PropostaAjuste; // Contraproposta feita pelo prestador (opcional)
  status: NegociacaoStatus; // Status atual da negociação
  dataCriacao?: string;    // Data de criação (ISO 8601 string)
  dataUltimaAtualizacao?: string; // Data da última modificação (ISO 8601 string)
}


// --- Tipos para Payloads de API ---

/** Dados enviados pelo Comprador para INICIAR uma negociação */
export interface NegociacaoInitiateData {
  contratacaoId: string;
  providerId: string; // ID do prestador (enviado pela tela original)
  propostaInicial: PropostaAjuste;
  // compradorId é inferido pelo backend via token
}

/** Dados enviados pelo Prestador para RESPONDER a uma negociação */
export interface NegociacaoRespondData {
  respostaProvider: PropostaAjuste;
  // Status é definido como 'contraproposta' pela API ou pela lógica da tela
  // status: 'contraproposta'; // Geralmente definido na lógica da chamada API
}

// A ação de CONFIRMAR do Comprador pode não precisar de body, apenas a chamada no endpoint correto


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---

/** Resposta genérica para ações de negociação (iniciar, responder, confirmar) */
export interface NegociacaoResponse {
  message: string;
  negociacao?: Negociacao; // A API pode retornar o estado atualizado da negociação
}