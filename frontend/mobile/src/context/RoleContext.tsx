import React, { createContext, useReducer, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { User, UserRole } from '@/types/user';
import { useAuth } from './AuthContext';
import { updateProfile } from '@/services/api';

// Define a estrutura de estado para o contexto de papéis
// Este contexto gerencia os diferentes papéis que um usuário pode ter no sistema
interface RoleState {
  roles: UserRole[];         // Lista de papéis do usuário
  activeRole: UserRole | null; // Papel atualmente ativo
  isLoading: boolean;        // Indica se há uma operação em andamento
  error: string | null;      // Armazena mensagens de erro, se houver
}

// Define as ações que podem ser despachadas para o reducer
// Estas ações controlam as mudanças de estado no contexto de papéis
type RoleAction = 
  | { type: 'SET_ROLES'; payload: UserRole[] }         // Define todos os papéis do usuário
  | { type: 'SET_ACTIVE_ROLE'; payload: UserRole | null } // Define o papel ativo
  | { type: 'ADD_ROLE'; payload: UserRole }            // Adiciona um novo papel
  | { type: 'REMOVE_ROLE'; payload: UserRole }         // Remove um papel existente
  | { type: 'SET_LOADING'; payload: boolean }          // Define o estado de carregamento
  | { type: 'SET_ERROR'; payload: string | null };     // Define uma mensagem de erro

// Funções utilitárias para converter entre propriedades booleanas e arrays de papéis
// Estas funções facilitam a conversão entre diferentes representações dos papéis do usuário
export const booleanPropsToRoles = (user: User | null): UserRole[] => {
  // Se não houver usuário, retorna um array vazio
  if (!user) return [];

  // Cria um array de papéis com base nas propriedades booleanas do usuário
  const roles: UserRole[] = [];
  if (user.isComprador) roles.push('comprador');
  if (user.isPrestador) roles.push('prestador');
  if (user.isAnunciante) roles.push('anunciante');
  if (user.isAdmin) roles.push('admin');

  return roles;
};

export const rolesToBooleanProps = (roles: UserRole[]): Partial<User> => {
  // Converte um array de papéis em propriedades booleanas para o objeto de usuário
  // Esta função é o inverso de booleanPropsToRoles
  return {
    isComprador: roles.includes('comprador'),    // Verifica se o papel 'comprador' está presente
    isPrestador: roles.includes('prestador'),    // Verifica se o papel 'prestador' está presente
    isAnunciante: roles.includes('anunciante'),  // Verifica se o papel 'anunciante' está presente
    isAdmin: roles.includes('admin')             // Verifica se o papel 'admin' está presente
  };
};

// Cria a função reducer
// Esta função gerencia todas as mudanças de estado com base nas ações despachadas
const roleReducer = (state: RoleState, action: RoleAction): RoleState => {
  switch (action.type) {
    case 'SET_ROLES':
      // Atualiza a lista completa de papéis
      return { ...state, roles: action.payload };
    case 'SET_ACTIVE_ROLE':
      // Define qual papel está atualmente ativo
      return { ...state, activeRole: action.payload };
    case 'ADD_ROLE':
      // Adiciona um novo papel, evitando duplicatas
      if (state.roles.includes(action.payload)) {
        return state;
      }
      return { ...state, roles: [...state.roles, action.payload] };
    case 'REMOVE_ROLE':
      // Remove um papel e limpa o papel ativo se necessário
      return { 
        ...state, 
        roles: state.roles.filter(role => role !== action.payload),
        activeRole: state.activeRole === action.payload ? null : state.activeRole
      };
    case 'SET_LOADING':
      // Atualiza o estado de carregamento
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      // Define uma mensagem de erro
      return { ...state, error: action.payload };
    default:
      // Retorna o estado atual se a ação não for reconhecida
      return state;
  }
};

// Cria o contexto
// Define a interface que será exposta para os componentes que consomem este contexto
interface RoleContextType {
  state: RoleState;                                // Estado atual dos papéis
  setActiveRole: (role: UserRole | null) => void;  // Função para definir o papel ativo
  toggleRole: (role: UserRole) => Promise<boolean>; // Função para ativar/desativar um papel
  hasRole: (role: UserRole) => boolean;            // Função para verificar se um papel está ativo
}

// Cria a instância do contexto com valor inicial undefined
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Cria o componente provedor
// Este componente envolve a aplicação e fornece o contexto de papéis para todos os componentes filhos
export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtém o usuário atual e a função para atualizá-lo do contexto de autenticação
  const { user, updateUser } = useAuth();

  // Inicializa o estado usando o reducer
  const [state, dispatch] = useReducer(roleReducer, {
    roles: booleanPropsToRoles(user),  // Converte as propriedades booleanas do usuário em array de papéis
    activeRole: null,                  // Inicialmente nenhum papel está ativo
    isLoading: false,                  // Inicialmente não está carregando
    error: null                        // Inicialmente não há erro
  });

  // Atualiza os papéis quando o usuário muda
  // Este efeito garante que os papéis sejam sincronizados com o usuário atual
  useEffect(() => {
    dispatch({ type: 'SET_ROLES', payload: booleanPropsToRoles(user) });
  }, [user]);

  // Define o papel ativo
  // Esta função permite que os componentes alterem qual papel está ativo no momento
  const setActiveRole = useCallback((role: UserRole | null) => {
    dispatch({ type: 'SET_ACTIVE_ROLE', payload: role });
  }, []);

  // Verifica se o usuário possui um papel específico
  // Esta função facilita a verificação de permissões baseadas em papéis
  const hasRole = useCallback((role: UserRole): boolean => {
    return state.roles.includes(role);
  }, [state.roles]);

  // Alterna um papel (adiciona ou remove)
  // Esta função permite que o usuário ative ou desative um papel específico
  const toggleRole = useCallback(async (role: UserRole): Promise<boolean> => {
    // Verifica se existe um usuário logado
    if (!user) return false;

    // Determina se estamos adicionando ou removendo o papel
    const newRoleState = !state.roles.includes(role);

    // Impede a remoção do último papel
    // O usuário deve ter pelo menos um papel ativo
    if (!newRoleState && state.roles.length === 1 && state.roles.includes(role)) {
      Alert.alert(
        "Ação não permitida",
        "Você deve ter pelo menos um papel ativo. Ative outro papel antes de desativar este.",
        [{ text: "OK" }]
      );
      return false;
    }

    // Atualiza o estado para indicar que está carregando e limpa erros anteriores
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Converte o papel para o nome da propriedade booleana correspondente
      const roleProperty = role === 'comprador' ? 'isComprador' : 
                           role === 'prestador' ? 'isPrestador' : 
                           role === 'anunciante' ? 'isAnunciante' : 'isAdmin';

      // Cria a atualização do usuário com todos os papéis atuais
      const updatedRoles = newRoleState 
        ? [...state.roles, role]  // Adiciona o novo papel
        : state.roles.filter(r => r !== role);  // Remove o papel

      // Verifica se o usuário possui pelo menos um campo de ID
      if (!user.idUsuario && !user.id && !user._id) {
        throw new Error('Erro de validação: Usuário não possui identificador válido (idUsuario, id ou _id)');
      }

      // Garante que idUsuario, id ou _id esteja presente na atualização
      const userUpdate = {
        user: {
          ...user,
          // Preserva os campos de ID existentes sem modificação
          idUsuario: user.idUsuario,
          id: user.id,
          _id: user._id,
          ...rolesToBooleanProps(updatedRoles)  // Converte os papéis atualizados em propriedades booleanas
        }
      };

      // Atualiza o usuário no backend
      // Envia a requisição para atualizar o perfil do usuário com os novos papéis
      const response = await updateProfile(user.token || '', userUpdate);

      // Atualiza o estado local
      // Adiciona ou remove o papel do estado local dependendo da ação
      if (newRoleState) {
        dispatch({ type: 'ADD_ROLE', payload: role });
      } else {
        dispatch({ type: 'REMOVE_ROLE', payload: role });
      }

      // Atualiza o usuário no contexto de autenticação
      // Se a resposta contiver um usuário e token atualizados, usa esses valores
      // Caso contrário, usa o objeto de atualização local
      if (response && response.user && response.token) {
        await updateUser({ 
          ...response.user,
          token: response.token 
        });
      } else {
        await updateUser(userUpdate.user);
      }

      return true;
    } catch (error) {
      // Trata erros que ocorrem durante a atualização do papel
      console.error("Erro ao atualizar papel:", error);

      // Extrai a mensagem de erro
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Atualiza o estado com a mensagem de erro
      dispatch({ type: 'SET_ERROR', payload: errorMessage });

      // Verifica se o erro está relacionado à autenticação
      if (errorMessage.includes('Token inválido') || 
          errorMessage.includes('Token expirado') || 
          errorMessage.includes('não autorizado')) {
        // Mostra alerta de sessão expirada
        Alert.alert(
          "Sessão expirada",
          "Sua sessão expirou. Por favor, faça login novamente."
        );
      } else {
        // Mostra alerta genérico para outros tipos de erro
        Alert.alert("Erro", "Não foi possível atualizar seu papel. Tente novamente.");
      }

      return false;
    } finally {
      // Sempre define o estado de carregamento como falso, independentemente do resultado
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, state.roles, updateUser]);

  // Cria o objeto de valor do contexto que será fornecido aos componentes
  const contextValue: RoleContextType = {
    state,           // Estado atual dos papéis
    setActiveRole,   // Função para definir o papel ativo
    toggleRole,      // Função para ativar/desativar um papel
    hasRole          // Função para verificar se um papel está ativo
  };

  // Retorna o provedor de contexto com o valor atual
  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

// Cria um hook para usar o contexto de papéis
// Este hook facilita o acesso ao contexto em componentes funcionais
export const useRoles = (): RoleContextType => {
  // Obtém o contexto atual
  const context = useContext(RoleContext);
  // Verifica se o hook está sendo usado dentro de um RoleProvider
  if (!context) {
    throw new Error('useRoles deve ser usado dentro de um RoleProvider');
  }
  // Retorna o contexto para uso no componente
  return context;
};
