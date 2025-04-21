import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
// Import recomendado para AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, UserRole} from '../types/user';

// --- Definição de Tipos ---

// 1. Interface para o objeto do usuário autenticado
// Baseado na Classe Usuario (docs) e campos usados em Login/Registro
// OBS: Adapte conforme a estrutura exata retornada pelo seu backend no login
//type UserRole = 'comprador' | 'prestador' | 'anunciante' | 'administrador';
/*
interface User {
  idUsuario: string; // Ou number, dependendo do seu backend
  nome: string;
  email: string;
  telefone?: string; // Opcional, como visto na tela de registro
  tipoUsuario: UserRole;
  cpfCnpj?: string;   // Visto na tela de registro
  endereco?: string; // Visto na tela de registro
  foto?: string;     // Visto na tela de registro
  token: string; // Essencial para autenticação em chamadas API
}
*/

// 2. Interface para o valor fornecido pelo Contexto
interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean; // Adicionado para saber quando o usuário está sendo carregado do storage
}

// 3. Interface para as Props do AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// --- Criação do Contexto ---

// Valor inicial para o contexto (pode ser undefined ou um objeto default)
// Usar um valor default evita checagens de undefined nos componentes consumidores
const defaultAuthValue: AuthContextType = {
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true, // Começa como true até tentarmos carregar o usuário
};

export const AuthContext = createContext<AuthContextType>(defaultAuthValue);

// --- Componente Provider ---

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado para controlar o carregamento inicial

  // Ao montar, busca os dados do usuário armazenados
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUserJson = await AsyncStorage.getItem('appUser');
        if (storedUserJson) {
          // Assume que o JSON armazenado corresponde à interface User
          const storedUser = JSON.parse(storedUserJson) as User;
          setUser(storedUser);
        }
      } catch (error) {
        console.error('AuthProvider: Erro ao carregar usuário do AsyncStorage:', error);
        // Considerar limpar o usuário em caso de erro de parsing?
        setUser(null);
        await AsyncStorage.removeItem('appUser');
      } finally {
        setIsLoading(false); // Marca que o carregamento terminou (com sucesso ou erro)
      }
    };
    loadUserFromStorage();
  }, []);

  /**
   * Realiza o login, armazenando os dados do usuário no estado e no AsyncStorage.
   */
  const login = async (userData: User): Promise<void> => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('appUser', JSON.stringify(userData));
    } catch (error) {
      console.error('AuthProvider: Erro ao salvar usuário no AsyncStorage:', error);
      // Lidar com erro ao salvar, talvez deslogando?
      setUser(null);
    }
  };

  /**
   * Realiza o logout, removendo os dados do usuário do estado e do AsyncStorage.
   */
  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('appUser');
    } catch (error) {
      console.error('AuthProvider: Erro ao remover usuário do AsyncStorage:', error);
      // Mesmo com erro, o estado local foi limpo.
    }
  };

  // Monta o valor que será fornecido pelo contexto
  const authContextValue: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
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