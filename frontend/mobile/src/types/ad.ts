// Arquivo: src/types/ad.ts
// Este arquivo contém as definições de tipos relacionados aos anúncios na aplicação

/**
 * AdStatus - Define os status possíveis para um Anúncio
 * 
 * draft: Rascunho - Anúncio ainda em edição pelo anunciante
 * pending_approval: Aprovação Pendente - Anúncio enviado para revisão
 * active: Ativo - Anúncio aprovado e visível para os usuários
 * inactive: Inativo - Anúncio temporariamente desativado
 * rejected: Rejeitado - Anúncio que não foi aprovado na revisão
 */
export type AdStatus = 'draft' | 'pending_approval' | 'active' | 'inactive' | 'rejected';

/**
 * Interface Ad - Representa a estrutura completa de um objeto de Anúncio
 * 
 * Esta interface define todos os campos necessários para representar
 * um anúncio no sistema, incluindo seus metadados e estatísticas.
 */
export interface Ad {
  _id: string;                // Identificador único do anúncio no banco de dados
  title: string;              // Título do anúncio mostrado aos usuários
  description: string;        // Descrição detalhada do conteúdo do anúncio
  advertiserId: string;       // ID do Anunciante (referência ao usuário que criou)
  status: AdStatus;           // Status atual do anúncio conforme definido em AdStatus

  // Campos de estatísticas de desempenho do anúncio
  views?: number;             // Número de visualizações que o anúncio recebeu
  clicks?: number;            // Número de cliques que o anúncio recebeu

  // Outros campos possíveis que podem ser implementados: imageUrl, targetUrl, etc.
}

/**
 * Interface AdData - Contém os dados necessários para criar ou atualizar um Anúncio
 * 
 * Esta interface é utilizada em formulários e requisições para a API
 * quando um usuário está criando ou editando um anúncio.
 */
export interface AdData {
  title: string;              // Título do anúncio
  description: string;        // Descrição detalhada do anúncio
  // Outros campos que podem ser adicionados conforme necessidade...
}

/**
 * Interface FetchAdsResponse - Estrutura da resposta da API ao buscar anúncios
 * 
 * Esta interface define o formato dos dados retornados pela API
 * quando se faz uma requisição para listar anúncios, incluindo
 * informações para paginação.
 */
export interface FetchAdsResponse {
  ads: Ad[];                  // Array contendo os anúncios retornados
  total?: number;             // Número total de anúncios disponíveis (para paginação)
  page?: number;              // Página atual dos resultados (para paginação)
}
