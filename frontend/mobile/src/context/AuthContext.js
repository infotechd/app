import React, { createContext, useState, useEffect } from 'react';
import { AsyncStorage } from 'react-native'; // ou @react-native-async-storage/async-storage

/**
 * AuthContext – Armazena informações do usuário autenticado,
 * incluindo token, tipoUsuario, etc.
 * As funções login e logout gerenciam o estado de autenticação.
 */
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Ao montar, busca os dados do usuário armazenados (pode usar AsyncStorage ou outra solução)
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('appUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    loadUser();
  }, []);

  /**
   * Realiza o login, armazenando os dados do usuário.
   */
  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('appUser', JSON.stringify(userData));
  };

  /**
   * Realiza o logout, removendo os dados do usuário.
   */
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('appUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
