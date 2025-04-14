import React, { createContext, useState, useEffect } from 'react';

/**
 * AuthContext – Armazena as informações do usuário autenticado,
 * incluindo token, tipoUsuario, e outras informações relevantes.
 *
 * As funções login e logout são disponibilizadas para gerenciar o estado de autenticação.
 */
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Ao montar, verifica se há informações do usuário armazenadas no localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('appUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  /**
   * Função para realizar login.
   * Recebe os dados do usuário e os armazena no estado e no localStorage.
   */
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('appUser', JSON.stringify(userData));
  };

  /**
   * Função para logout.
   * Remove as informações do usuário do estado e do localStorage.
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('appUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
