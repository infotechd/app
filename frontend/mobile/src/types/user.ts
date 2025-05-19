// src/types/user.ts

/**
 * Define os papéis possíveis que um usuário pode ter na aplicação.
 * Baseado na documentação (Diagrama de Classe, Casos de Uso) e
 * nos valores usados em RegistrationScreen.
 * 
 * Alinhado com o backend TipoUsuarioEnum
 */
export type UserRole = 'comprador' | 'prestador' | 'anunciante' | 'admin';

/**
 * Enum para os tipos de usuário
 * Mantém compatibilidade com o backend
 */
export enum TipoUsuarioEnum {
  COMPRADOR = 'comprador',
  PRESTADOR = 'prestador',
  ANUNCIANTE = 'anunciante',
  ADMIN = 'admin'
}

/**
 * Representa a estrutura do objeto de um usuário autenticado ou de perfil.
 * Esta interface será usada no AuthContext, nas respostas da API,
 * e em vários componentes e telas.
 *
 * Baseado no Diagrama de Classe (Usuario), campos da RegistrationScreen,
 * e no padrão comum de autenticação com token.
 * 
 * Alinhado com o modelo de backend (models/User.ts)
 */
export interface User {
  // Identificadores - pelo menos um deve estar presente
  idUsuario?: string; // Identificador único (ex: ID do banco de dados)
  id?: string;      // Identificador alternativo que pode vir da API (_id do MongoDB)

  // Campos obrigatórios
  nome: string;
  email: string;
  tipoUsuario: TipoUsuarioEnum;

  // O token é frequentemente incluído no objeto do usuário gerenciado pelo AuthContext
  // ou retornado junto com o usuário no login. Essencial para chamadas API autenticadas.
  // Marcado como opcional para permitir atualizações parciais do perfil
  token?: string;

  // Campos opcionais que podem ou não estar presentes dependendo do contexto
  // ou se o perfil foi completamente preenchido.
  telefone?: string;
  cpfCnpj?: string;   // Coletado no registro
  endereco?: string; // Coletado no registro e editável no perfil
  foto?: string;     // URL para a foto do perfil
  dataNascimento?: string | Date; // Data de nascimento do usuário
  genero?: 'Feminino' | 'Masculino' | 'Prefiro não dizer'; // Gênero do usuário

  // Timestamps do MongoDB (opcionais no frontend)
  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Observação: A 'senha' não é armazenada no objeto do usuário no frontend
  // após a autenticação por razões de segurança. O 'token' é usado para sessões.
}

// Você pode adicionar outras interfaces ou tipos relacionados ao usuário aqui se necessário no futuro.
// Exemplo: Interface para dados de perfil público, etc.
