// src/types/negociacao.ts
// Este arquivo define os tipos e interfaces relacionados ao processo de negociação entre compradores e prestadores de serviço

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
  compradorId: string;     // ID do Usuário Comprador
  prestadorId: string;    // ID do Usuário Prestador
  propostaInicial: PropostaAjuste; // Proposta feita pelo comprador
  respostaProvider?: PropostaAjuste; // Contraproposta feita pelo prestador (opcional)
  status: NegociacaoStatus; // Status atual da negociação
  dataCriacao?: string;    // Data de criação (string no formato ISO 8601)
  dataUltimaAtualizacao?: string; // Data da última modificação (string no formato ISO 8601)
}


// --- Tipos para Cargas de API ---
// Esta seção define os tipos de dados que são enviados nas requisições para a API

/** Dados enviados pelo Comprador para INICIAR uma negociação */
export interface DadosInicioNegociacao {
  contratacaoId: string;
  prestadorId: string; // ID do prestador (enviado pela tela original)
  propostaInicial: PropostaAjuste;
  // compradorId é inferido pelo backend via token
}

/** Dados enviados pelo Prestador para RESPONDER a uma negociação */
export interface DadosRespostaNegociacao {
  respostaPrestador: PropostaAjuste; // Resposta do prestador
  // Status é definido como 'contraproposta' pela API ou pela lógica da tela
  // status: 'contraproposta'; // Geralmente definido na lógica da chamada API
}

/** Alias para DadosInicioNegociacao usado na tela NegociacaoScreen */
export interface NegociacaoInitiateData {
  contratacaoId: string;
  providerId: string; // ID do prestador (enviado pela tela original)
  propostaInicial: PropostaAjuste;
}

/** Alias para DadosRespostaNegociacao usado na tela NegociacaoScreen */
export interface NegociacaoRespondData {
  respostaProvider: PropostaAjuste; // Resposta do prestador
}

// A ação de CONFIRMAR do Comprador pode não precisar de corpo na requisição, apenas a chamada no ponto de extremidade correto


// --- Tipos para Respostas de API (podem ir em src/types/api.ts) ---
// Esta seção define os tipos de dados que são recebidos como resposta da API

/** Resposta genérica para ações de negociação (iniciar, responder, confirmar) */
export interface RespostaNegociacao {
  message: string;
  negociacao?: Negociacao; // A API pode retornar o estado atualizado da negociação
}

/** Alias para RespostaNegociacao usado na API */
export type NegociacaoResponse = RespostaNegociacao;
