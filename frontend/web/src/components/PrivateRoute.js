import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * PrivateRoute – Componente para proteger rotas.
 *
 * Se o usuário não estiver logado, redireciona para a página de login.
 * Se for exigida uma role específica via prop "requiredRole", verifica se o usuário possui a role correta.
 */
export default function PrivateRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);

  // Se não houver usuário autenticado, redireciona para o login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se for exigida uma role específica e o usuário não corresponder, exibe mensagem de acesso negado
  if (requiredRole && user.tipoUsuario !== requiredRole) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Acesso Negado</h2>
        <p>Esta página é restrita para usuários do tipo {requiredRole}.</p>
      </div>
    );
  }

  // Se as verificações passarem, renderiza a rota
  return children;
}
