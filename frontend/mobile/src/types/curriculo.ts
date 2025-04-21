// Exemplo: Criando src/types/curriculo.ts

/** Dados enviados para salvar/atualizar o currículo */
export interface CurriculoData {
  experiencia: string;
  habilidades: string;
  projetos: string;
  // prestadorId é inferido pelo backend via token
}

/** Resposta da API após salvar/atualizar o currículo */
export interface CurriculoResponse {
  message: string;
  // curriculo?: Curriculo; // Opcional: Pode retornar o objeto salvo/atualizado
}

/** Interface para um objeto Curriculo completo (se precisar buscar) */
export interface Curriculo extends CurriculoData {
  _id: string;
  prestadorId: string;
}