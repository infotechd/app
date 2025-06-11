import React, { createContext, useReducer, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { User, UserRole } from '@/types/user';
import { updateProfile, refreshUserToken, updateUserRoles } from '@/services/api';
import { booleanPropsToRoles, rolesToBooleanProps } from '@/utils/permissions';
import { 
  saveToken, 
  getToken, 
  saveUserData, 
  getUserData, 
  clearAllAuthData,
  saveRefreshToken,
  getRefreshToken
} from '@/utils/secureStorage';

// Define o estado do contexto do usuário
interface UserState {
  user: User | null;
  isLoading: boolean;
  isTokenValid: boolean;
  error: string | null;
}

// Define as ações que podem ser despachadas para o reducer
type UserAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TOKEN_VALID'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_ROLE'; payload: UserRole | undefined }
  | { type: 'ADD_ROLE'; payload: UserRole }
  | { type: 'REMOVE_ROLE'; payload: UserRole };

// Cria o reducer para gerenciar o estado
const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TOKEN_VALID':
      return { ...state, isTokenValid: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ACTIVE_ROLE':
      if (!state.user) return state;
      return { 
        ...state, 
        user: { 
          ...state.user, 
          activeRole: action.payload 
        } 
      };
    case 'ADD_ROLE':
      if (!state.user) return state;

      // Se o usuário já tem esse papel, não faz nada
      if (state.user.roles?.includes(action.payload)) {
        return state;
      }

      // Adiciona o papel ao array de papéis
      const newRoles = [...(state.user.roles || []), action.payload];

      // Atualiza também as flags booleanas para compatibilidade
      const booleanProps = rolesToBooleanProps(newRoles);

      return {
        ...state,
        user: {
          ...state.user,
          roles: newRoles,
          ...booleanProps
        }
      };
    case 'REMOVE_ROLE':
      if (!state.user) return state;

      // Se o usuário não tem esse papel, não faz nada
      if (!state.user.roles?.includes(action.payload)) {
        return state;
      }

      // Remove o papel do array de papéis
      const updatedRoles = state.user.roles.filter(role => role !== action.payload);

      // Atualiza também as flags booleanas para compatibilidade
      const updatedBooleanProps = rolesToBooleanProps(updatedRoles);

      // Se o papel ativo for removido, define como undefined
      const activeRole = state.user.activeRole === action.payload 
        ? undefined 
        : state.user.activeRole;

      return {
        ...state,
        user: {
          ...state.user,
          roles: updatedRoles,
          activeRole,
          ...updatedBooleanProps
        }
      };
    default:
      return state;
  }
};

// Define a interface do contexto
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isTokenValid: boolean;
  error: string | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  setActiveRole: (role: UserRole | undefined) => void;
  hasRole: (role: UserRole) => boolean;
  handleUpdateRoles: (newRoles: UserRole[]) => Promise<void>;
}

// Cria o contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// Props para o provedor
interface UserProviderProps {
  children: ReactNode;
}

// Componente provedor
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Inicializa o estado com o reducer
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    isLoading: true,
    isTokenValid: false,
    error: null
  });

  // Função para verificar se o token é válido
  const checkTokenValidity = (token?: string): boolean => {
    if (!token || token.trim() === '') return false;

    try {
      // Verifica se o token tem um formato válido
      if (token.trim().length < 10) {
        console.warn('UserContext: Token inválido - muito curto ou contém apenas espaços');
        return false;
      }

      // Verificação básica de formato JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('UserContext: Token não parece ser um JWT válido (deve ter 3 partes)');
        return false;
      }

      // Verificação adicional: cada parte deve ser uma string não vazia
      if (parts.some(part => !part || part.trim() === '')) {
        console.warn('UserContext: Token JWT contém partes vazias');
        return false;
      }

      return true;
    } catch (error) {
      console.error('UserContext: Erro ao verificar validade do token:', error);
      return false;
    }
  };

  // Carrega o usuário do SecureStore ao montar o componente
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        // Busca o token e os dados do usuário do armazenamento seguro
        const [token, userData] = await Promise.all([
          getToken(),
          getUserData()
        ]);

        if (token && userData) {
          // Verifica se o token é válido
          const tokenIsValid = checkTokenValidity(token);
          dispatch({ type: 'SET_TOKEN_VALID', payload: tokenIsValid });

          // Só define o usuário se o token for válido
          if (tokenIsValid) {
            // Reconstrói o objeto de usuário completo
            const storedUser = {
              ...userData,
              token
            } as User;

            // Garante que o usuário tenha o array de roles
            if (!storedUser.roles) {
              storedUser.roles = booleanPropsToRoles({
                isComprador: storedUser.isComprador,
                isPrestador: storedUser.isPrestador,
                isAnunciante: storedUser.isAnunciante,
                isAdmin: storedUser.isAdmin
              });
            }

            dispatch({ type: 'SET_USER', payload: storedUser });
          } else {
            // Se o token não for válido, tenta renovar o token
            const refreshToken = await getRefreshToken();
            if (refreshToken) {
              try {
                // Tenta renovar o token usando o refresh token
                const newToken = await refreshUserToken(refreshToken);
                if (newToken) {
                  // Se conseguiu renovar, salva o novo token e carrega o usuário
                  await saveToken(newToken);

                  // Reconstrói o objeto de usuário com o novo token
                  const storedUser = {
                    ...userData,
                    token: newToken
                  } as User;

                  dispatch({ type: 'SET_USER', payload: storedUser });
                  dispatch({ type: 'SET_TOKEN_VALID', payload: true });
                  return;
                }
              } catch (refreshError) {
                console.error('UserContext: Erro ao renovar token:', refreshError);
              }
            }

            // Se não conseguiu renovar o token, limpa os dados do usuário
            console.warn('UserContext: Token inválido ou expirado, usuário será deslogado');
            await clearAllAuthData();
          }
        }
      } catch (error) {
        console.error('UserContext: Erro ao carregar usuário do SecureStore:', error);
        // Limpa o usuário em caso de erro
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_TOKEN_VALID', payload: false });
        await clearAllAuthData();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    loadUserFromStorage();
  }, []);

  // Função para fazer login
  const login = async (userData: User): Promise<void> => {
    try {
      // Verifica se o token é válido
      const tokenIsValid = checkTokenValidity(userData.token);

      if (!tokenIsValid) {
        throw new Error('Token inválido ou ausente');
      }

      // Garante que o usuário tenha o array de roles
      if (!userData.roles) {
        userData.roles = booleanPropsToRoles({
          isComprador: userData.isComprador,
          isPrestador: userData.isPrestador,
          isAnunciante: userData.isAnunciante,
          isAdmin: userData.isAdmin
        });
      }

      // Verificação estrita de ID: o usuário deve ter um ID válido do backend
      if (!userData.idUsuario && !userData.id && !userData._id) {
        console.error("UserContext: API de login retornou um usuário sem ID.", userData);
        throw new Error('Falha na autenticação: dados do usuário incompletos recebidos do servidor.');
      }

      // Atualiza os estados
      dispatch({ type: 'SET_USER', payload: userData });
      dispatch({ type: 'SET_TOKEN_VALID', payload: true });

      // Salva no SecureStore (separando token e dados do usuário)
      await Promise.all([
        saveToken(userData.token!), // Non-null assertion porque já validamos o token anteriormente
        saveUserData(userData)
      ]);

      // Se houver refresh token, salva também
      if (userData.refreshToken) {
        await saveRefreshToken(userData.refreshToken);
      }
    } catch (error) {
      console.error('UserContext: Erro ao realizar login:', error);
      // Limpa os estados em caso de erro
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_TOKEN_VALID', payload: false });
      // Limpa qualquer dado que possa ter sido salvo parcialmente
      await clearAllAuthData();
      throw error;
    }
  };

  // Função para fazer logout
  const logout = async (): Promise<void> => {
    try {
      // Limpa os estados
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_TOKEN_VALID', payload: false });

      // Remove todos os dados de autenticação do SecureStore
      await clearAllAuthData();
    } catch (error) {
      console.error('UserContext: Erro ao realizar logout:', error);
      // Mesmo com erro, garantimos que os estados locais foram limpos
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_TOKEN_VALID', payload: false });

      // Tenta limpar o storage novamente
      try {
        await clearAllAuthData();
      } catch (clearError) {
        console.error('UserContext: Erro ao limpar dados de autenticação:', clearError);
      }

      throw error;
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!state.user) {
        throw new Error('Nenhum usuário logado para atualizar');
      }

      // Cria um novo objeto de usuário com os dados atualizados
      const updatedUser = { ...state.user, ...userData };

      // Garantir que pelo menos um dos campos de ID esteja presente
      updatedUser.idUsuario = updatedUser.idUsuario || updatedUser.id || updatedUser._id;

      // Se o token foi atualizado, verifica sua validade
      if (userData.token) {
        const tokenIsValid = checkTokenValidity(userData.token);
        if (!tokenIsValid) {
          throw new Error('Token atualizado é inválido');
        }
        dispatch({ type: 'SET_TOKEN_VALID', payload: tokenIsValid });
      }

      // Se os roles foram atualizados, atualiza também as flags booleanas
      if (userData.roles) {
        const booleanProps = rolesToBooleanProps(userData.roles);
        Object.assign(updatedUser, booleanProps);
      }

      // Atualiza o estado
      dispatch({ type: 'SET_USER', payload: updatedUser });

      // Salva no armazenamento seguro
      await saveUserData(updatedUser);
    } catch (error) {
      console.error('UserContext: Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  };

  // Função para renovar o token
  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!state.user) {
        throw new Error('Nenhum usuário logado para renovar o token');
      }

      // Obtém o refresh token do armazenamento seguro
      const refreshTokenValue = await getRefreshToken();

      if (!refreshTokenValue) {
        console.error('UserContext: Refresh token não encontrado');
        throw new Error('Refresh token não encontrado');
      }

      // Chama a API para renovar o token usando o refresh token
      const newToken = await refreshUserToken(refreshTokenValue);

      if (!newToken) {
        throw new Error('Falha ao renovar o token');
      }

      // Salva o novo token no armazenamento seguro
      await saveToken(newToken);

      // Atualiza o usuário com o novo token
      const updatedUser = { ...state.user, token: newToken };
      dispatch({ type: 'SET_USER', payload: updatedUser });

      // Verifica e atualiza o estado de validade do token
      const tokenIsValid = checkTokenValidity(newToken);
      dispatch({ type: 'SET_TOKEN_VALID', payload: tokenIsValid });

      return tokenIsValid;
    } catch (error) {
      console.error('UserContext: Erro ao renovar token:', error);
      // Em caso de erro na renovação, deslogamos o usuário
      await logout();
      return false;
    }
  };

  // Função para definir o papel ativo
  const setActiveRole = useCallback((role: UserRole | undefined) => {
    dispatch({ type: 'SET_ACTIVE_ROLE', payload: role });
  }, []);

  // Função para verificar se o usuário tem um papel específico
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!state.user) return false;

    // Se o usuário já tem o array de roles, usamos ele diretamente
    if (state.user.roles && Array.isArray(state.user.roles)) {
      return state.user.roles.includes(role);
    }

    // Caso contrário, verificamos as propriedades booleanas
    switch (role) {
      case 'comprador': return !!state.user.isComprador;
      case 'prestador': return !!state.user.isPrestador;
      case 'anunciante': return !!state.user.isAnunciante;
      case 'admin': return !!state.user.isAdmin;
      default: return false;
    }
  }, [state.user]);

  // Função para atualizar papéis do usuário
  const handleUpdateRoles = async (newRoles: UserRole[]): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Verifica se há pelo menos um papel selecionado
      if (!newRoles || newRoles.length === 0) {
        Alert.alert('Erro', 'Você deve selecionar pelo menos um papel.');
        return;
      }

      // Prepara o payload para a API
      const payload = { roles: newRoles };

      // Chama a API para atualizar os papéis
      const { user: updatedUser } = await updateUserRoles(payload);

      if (!updatedUser) {
        throw new Error('A API retornou um usuário nulo ou indefinido');
      }

      // Garante que o usuário tenha o array de roles
      if (!updatedUser.roles) {
        updatedUser.roles = newRoles;
      }

      // Atualiza também as flags booleanas para compatibilidade
      const booleanProps = rolesToBooleanProps(updatedUser.roles);
      Object.assign(updatedUser, booleanProps);

      // Se o papel ativo não estiver mais na lista de papéis, redefine-o
      if (state.user?.activeRole && !updatedUser.roles.includes(state.user.activeRole)) {
        updatedUser.activeRole = updatedUser.roles[0] || undefined;
      }

      // Atualiza o estado com a resposta da API
      dispatch({ type: 'SET_USER', payload: updatedUser });

      // Salva os dados atualizados no armazenamento seguro
      await saveUserData(updatedUser);

      // Não exibimos o alerta de sucesso aqui, pois o componente RoleManagement já o faz
    } catch (error) {
      console.error("UserContext: Erro ao atualizar papéis:", error);
      Alert.alert('Erro', 'Não foi possível atualizar seus papéis. Por favor, tente novamente.');
      throw error; // Propaga o erro para a UI, se necessário
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Monta o valor do contexto
  const contextValue: UserContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isTokenValid: state.isTokenValid,
    error: state.error,
    login,
    logout,
    updateUser,
    refreshToken,
    setActiveRole,
    hasRole,
    handleUpdateRoles
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Hook para usar o contexto
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser utilizado dentro de um UserProvider');
  }
  return context;
};
