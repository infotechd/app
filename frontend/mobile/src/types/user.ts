// src/types/user.ts

/**
 * Define os papéis possíveis que um usuário pode ter na aplicação.
 * Baseado na documentação (Diagrama de Classe, Casos de Uso) e
 * nos valores usados em RegistrationScreen.
 * 
 * Este tipo define as quatro funções que um usuário pode desempenhar no sistema:
 * - comprador: usuário que pode contratar serviços
 * - prestador: usuário que pode oferecer serviços
 * - anunciante: usuário que pode criar anúncios e treinamentos
 * - admin: usuário com privilégios administrativos
 * 
 * Alinhado com o backend TipoUsuarioEnum
 */
export type UserRole = 'comprador' | 'prestador' | 'anunciante' | 'admin';

/**
 * Enum para os tipos de usuário
 * Mantém compatibilidade com o backend
 * 
 * Este enum define os tipos de usuário reconhecidos pelo sistema.
 * Atualmente, apenas o tipo ADMIN é mantido como um enum específico,
 * enquanto os outros tipos (comprador, prestador, anunciante) foram
 * convertidos para flags booleanas na interface User.
 * 
 * Nota: Os tipos de usuário foram unificados no backend, agora usando flags booleanas
 * (isComprador, isPrestador, isAnunciante) em vez de enum values.
 * Apenas ADMIN permanece como um tipo de usuário específico.
 * 
 * Este enum é utilizado principalmente para verificações de autorização
 * e controle de acesso em áreas administrativas do sistema.
 */
export enum TipoUsuarioEnum {
  ADMIN = 'admin' // Valor que identifica um usuário como administrador
}

/**
 * Representa a estrutura do objeto de um usuário autenticado ou de perfil.
 * Esta interface será usada no AuthContext, nas respostas da API,
 * e em vários componentes e telas.
 *
 * Esta interface define todos os dados que podem estar associados a um usuário
 * no sistema, desde informações básicas como nome e email até dados específicos
 * como capacidades de usuário e informações de perfil.
 * 
 * Baseado no Diagrama de Classe (Usuario), campos da RegistrationScreen,
 * e no padrão comum de autenticação com token.
 * 
 * Alinhado com o modelo de backend (models/User.ts)
 */
export interface User {
  // Identificadores - pelo menos um deve estar presente
  idUsuario?: string; // Identificador único (ex: ID do banco de dados) usado internamente pelo sistema
  id?: string;      // Identificador alternativo que pode vir da API (_id do MongoDB) para compatibilidade com diferentes fontes de dados
  _id?: string;     // MongoDB ObjectId direto (para compatibilidade com algumas respostas da API) quando o objeto vem diretamente do MongoDB

  // Campos obrigatórios - informações essenciais do usuário
  nome: string;     // Nome completo do usuário, usado para exibição e identificação
  email: string;    // Endereço de email do usuário, usado para login e comunicações

  // Papéis do usuário (substituindo as flags booleanas)
  // Array de papéis que o usuário possui no sistema
  roles?: UserRole[];  // Lista de papéis que o usuário possui (comprador, prestador, anunciante, admin)
  activeRole?: UserRole; // Papel ativo atual do usuário

  // Mantendo as flags booleanas para compatibilidade com código existente
  // Estas serão derivadas do array de roles
  isComprador?: boolean;  // Indica se o usuário pode contratar serviços e fazer compras
  isPrestador?: boolean;  // Indica se o usuário pode oferecer serviços como prestador
  isAnunciante?: boolean; // Indica se o usuário pode criar anúncios e treinamentos
  isAdmin?: boolean;      // Indica se o usuário tem privilégios administrativos no sistema

  // O token é frequentemente incluído no objeto do usuário gerenciado pelo AuthContext
  // ou retornado junto com o usuário no login. Essencial para chamadas API autenticadas.
  // Marcado como opcional para permitir atualizações parciais do perfil
  token?: string;    // Token JWT ou similar usado para autenticação nas chamadas à API
  refreshToken?: string; // Token de atualização usado para renovar o token de acesso quando expirado

  // Campos opcionais que podem ou não estar presentes dependendo do contexto
  // ou se o perfil foi completamente preenchido.
  telefone?: string;    // Número de telefone do usuário para contato
  cpfCnpj?: string;     // CPF (pessoa física) ou CNPJ (pessoa jurídica) do usuário, coletado no registro
  endereco?: string;    // Endereço completo do usuário, coletado no registro e editável no perfil
  foto?: string;        // URL para a foto do perfil do usuário, usada em avatares e perfil
  dataNascimento?: string | Date; // Data de nascimento do usuário, usada para verificação de idade e estatísticas
  genero?: 'Feminino' | 'Masculino' | 'Prefiro não dizer'; // Gênero do usuário, usado para personalização e estatísticas

  // Timestamps do MongoDB (opcionais no frontend)
  // Estes campos são gerenciados automaticamente pelo MongoDB
  createdAt?: string | Date; // Data e hora de criação do registro do usuário
  updatedAt?: string | Date; // Data e hora da última atualização do registro do usuário

  // Observação: A 'senha' não é armazenada no objeto do usuário no frontend
  // após a autenticação por razões de segurança. O 'token' é usado para sessões.
}

/**
 * Extensões futuras para o módulo de usuário
 * 
 * Este arquivo pode ser expandido no futuro para incluir outras interfaces e tipos
 * relacionados ao usuário, conforme a aplicação evolui. Alguns exemplos de possíveis
 * adições futuras incluem:
 * 
 * - Interface para dados de perfil público (visíveis para outros usuários)
 * - Interface para preferências e configurações do usuário
 * - Interface para histórico de atividades do usuário
 * - Tipos para diferentes níveis de permissões administrativas
 * - Interfaces para gerenciamento de notificações do usuário
 */
