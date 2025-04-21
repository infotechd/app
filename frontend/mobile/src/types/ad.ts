// Exemplo: Criando src/types/ad.ts


/** Status possíveis para um Anúncio */
export type AdStatus = 'draft' | 'pending_approval' | 'active' | 'inactive' | 'rejected';

/** Interface representando um objeto de Anúncio */
export interface Ad {
  _id: string;
  title: string; // Título visto no código original
  description: string; // Descrição vista no código original (ou 'conteudo'?)
  advertiserId: string; // ID do Anunciante (User)
  status: AdStatus;

  // Estatísticas vistas no código original (podem vir da API ou ser calculadas)
  views?: number;
  clicks?: number;

  // Outros campos possíveis: imageUrl, targetUrl, etc.
}

/** Dados para criar/atualizar um Anúncio */
export interface AdData {
  title: string;
  description: string;
  // outros campos...
}


export interface FetchAdsResponse {
  ads: Ad[];
  total?: number;
  page?: number;
}

