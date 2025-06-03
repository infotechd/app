// Exemplo: Criando src/types/curriculo.ts
// Este arquivo define as interfaces relacionadas ao currículo do prestador de serviços

/**
 * Interface que define os dados enviados para salvar ou atualizar o currículo
 * Contém informações sobre experiência profissional, habilidades técnicas e projetos realizados
 */
export interface CurriculoData {
  experiencia: string; // Experiências profissionais do prestador
  habilidades: string; // Habilidades técnicas e competências do prestador
  projetos: string;    // Projetos realizados pelo prestador
  // prestadorId é inferido pelo backend via token
}

/**
 * Interface que define a resposta da API após operações de salvar ou atualizar o currículo
 * Contém uma mensagem de confirmação e opcionalmente pode retornar o objeto atualizado
 */
export interface CurriculoResponse {
  message: string; // Mensagem de confirmação da operação
  // curriculo?: Curriculo; // Opcional: Pode retornar o objeto salvo/atualizado
}

/**
 * Interface que representa um objeto Currículo completo
 * Estende CurriculoData e adiciona campos de identificação
 * Utilizada quando é necessário buscar um currículo existente
 */
export interface Curriculo extends CurriculoData {
  _id: string;        // Identificador único do currículo no banco de dados
  prestadorId: string; // Identificador do prestador de serviço associado ao currículo
}
