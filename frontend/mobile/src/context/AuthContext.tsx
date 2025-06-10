import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

// --- Definição de Tipos ---

// 2. Interface para o valor fornecido pelo Contexto
interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isLoading: boolean; // Adicionado para saber quando o utilizador está sendo carregado do storage
  isTokenValid: boolean; // Indica se o token do usuário é válido
  refreshToken: () => Promise<boolean>; // Função para atualizar o token
}

// 3. Interface para as Props do AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// --- Criação do Contexto ---

// Valor inicial para o contexto (pode ser undefined ou um objeto default)
// Usar um valor 'default' evita checagens de undefined nos componentes consumidores
const defaultAuthValue: AuthContextType = {
  user: null,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  isLoading: true, // Começa como true até tentarmos carregar o usuário
  isTokenValid: false, // Inicialmente, não há token válido
  refreshToken: async () => false, // Função vazia que retorna false por padrão
};

export const AuthContext = createContext<AuthContextType>(defaultAuthValue);

// --- Componente Provider ---

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado para controlar o carregamento inicial
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false); // Estado para controlar a validade do token

  // Removido a dependência do UserContext para evitar circular dependency

  // Função para verificar se o token é válido
  const checkTokenValidity = (token?: string): boolean => {
    if (!token || token.trim() === '') return false;

    try {
      // Verifica se o token tem um formato válido (pelo menos 10 caracteres e não contém apenas espaços)
      if (token.trim().length < 10) {
        console.warn('AuthProvider: Token inválido - muito curto ou contém apenas espaços');
        return false;
      }

      // Aqui você pode implementar uma lógica mais robusta para verificar a validade do token
      // Por exemplo, decodificar um JWT e verificar a data de expiração

      // Verificação básica de formato JWT (deve ter 3 partes separadas por ponto)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('AuthProvider: Token não parece ser um JWT válido (deve ter 3 partes)');
        return false;
      }

      // Verificação adicional: cada parte deve ser uma string não vazia
      if (parts.some(part => !part || part.trim() === '')) {
        console.warn('AuthProvider: Token JWT contém partes vazias');
        return false;
      }

      return true;
    } catch (error) {
      console.error('AuthProvider: Erro ao verificar validade do token:', error);
      return false;
    }
  };

  // Ao montar, busca os dados do usuário armazenados
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUserJson = await AsyncStorage.getItem('appUser');
        if (storedUserJson) {
          // Assume que o JSON armazenado corresponde à 'interface' User
          const storedUser = JSON.parse(storedUserJson) as User;

          // Verifica se o token é válido
          const tokenIsValid = checkTokenValidity(storedUser.token);
          setIsTokenValid(tokenIsValid);

          // Só define o usuário se o token for válido
          if (tokenIsValid) {
            setUser(storedUser);
          } else {
            // Se o token não for válido, limpa o usuário do storage
            console.warn('AuthProvider: Token inválido ou expirado, usuário será deslogado');
            await AsyncStorage.removeItem('appUser');
          }
        }
      } catch (error) {
        console.error('AuthProvider: Erro ao carregar usuário do AsyncStorage:', error);
        // Limpa o usuário em caso de erro
        setUser(null);
        setIsTokenValid(false);
        await AsyncStorage.removeItem('appUser');
      } finally {
        setIsLoading(false); // Marca que o carregamento terminou (com sucesso ou erro)
      }
    };
    loadUserFromStorage();
  }, []);

  /**
   * Realiza o login, armazenando os dados do usuário no estado e no AsyncStorage.
   * Também verifica a validade do token.
   */
  const login = async (userData: User): Promise<void> => {
    try {
      // Verifica se o token é válido
      const tokenIsValid = checkTokenValidity(userData.token);

      if (!tokenIsValid) {
        throw new Error('Token inválido ou ausente');
      }

      // Atualiza os estados
      setUser(userData);
      setIsTokenValid(true);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('appUser', JSON.stringify(userData));
    } catch (error) {
      console.error('AuthProvider: Erro ao realizar login:', error);
      // Limpa os estados em caso de erro
      setUser(null);
      setIsTokenValid(false);
      throw error; // Propaga o erro para que o componente que chamou possa tratar
    }
  };

  /**
   * Realiza o logout, removendo os dados do usuário do estado e do AsyncStorage.
   */
  const logout = async (): Promise<void> => {
    try {
      // Limpa os estados
      setUser(null);
      setIsTokenValid(false);

      // Remove do AsyncStorage
      await AsyncStorage.removeItem('appUser');
    } catch (error) {
      console.error('AuthProvider: Erro ao realizar logout:', error);
      // Mesmo com erro, garantimos que os estados locais foram limpos
      setUser(null);
      setIsTokenValid(false);
      throw error; // Propaga o erro para que o componente que chamou possa tratar
    }
  };

  /**
   * Atualiza os dados do usuário no estado e no AsyncStorage.
   * Útil para atualizar informações de perfil sem precisar fazer login novamente.
   */
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('Nenhum usuário logado para atualizar');
      }

      // Cria um novo objeto de usuário com os dados atualizados
      const updatedUser = { ...user, ...userData };

      // Garantir que pelo menos um dos campos de ID esteja presente
      updatedUser.idUsuario = updatedUser.idUsuario || updatedUser.id || updatedUser._id;

      // Se o token foi atualizado, verifica sua validade
      if (userData.token) {
        const tokenIsValid = checkTokenValidity(userData.token);
        if (!tokenIsValid) {
          throw new Error('Token atualizado é inválido');
        }
        setIsTokenValid(tokenIsValid);
      }

      // Atualiza o estado
      setUser(updatedUser);

      // Salva no AsyncStorage
      await AsyncStorage.setItem('appUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('AuthProvider: Erro ao atualizar dados do usuário:', error);
      throw error; // Propaga o erro para que o componente que chamou possa tratar
    }
  };

  /**
   * Tenta renovar o token de autenticação.
   * Esta função deve ser chamada quando o token expirar ou for invalidado.
   * 
   * Nota: A implementação real depende da API do seu backend.
   * Este é apenas um exemplo que simula uma renovação bem-sucedida.
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('Nenhum usuário logado para renovar o token');
      }

      // Aqui você deve implementar a chamada real à sua API para renovar o token
      // Exemplo:
      // const response = await api.post('/auth/refresh-token', { 
      //   refreshToken: user.refreshToken 
      // });
      // const newToken = response.data.token;

      // Simulação de um novo token (em produção, isso viria da API)
      const newToken = `new_token_${Date.now()}`;

      // Atualiza o usuário com o novo token
      await updateUser({ token: newToken });

      // Verifica e atualiza o estado de validade do token
      const tokenIsValid = checkTokenValidity(newToken);
      setIsTokenValid(tokenIsValid);

      return tokenIsValid;
    } catch (error) {
      console.error('AuthProvider: Erro ao renovar token:', error);
      // Em caso de erro na renovação, deslogamos o usuário
      await logout();
      return false;
    }
  };

  // Monta o valor que será fornecido pelo contexto
  const authContextValue: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    isLoading,
    isTokenValid,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook Customizado (Recomendado) ---

/**
 * Hook customizado para consumir o AuthContext de forma segura e tipada.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // A verificação de undefined não é mais estritamente necessária
  // se garantirmos que o AuthProvider sempre envolve a aplicação
  // e fornecemos um valor default no createContext. Mas pode ser mantida por segurança.
  if (context === undefined) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
