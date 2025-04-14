import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';

/**
 * PrivateScreen – Componente de proteção para telas.
 * Verifica se o usuário está autenticado e se possui a role requerida.
 *
 * Props:
 * - requiredRole: (opcional) a role necessária para acessar a tela.
 * - children: os componentes a serem renderizados se a verificação for bem-sucedida.
 */
export default function PrivateScreen({ requiredRole, children }) {
  const { user } = useContext(AuthContext);

  // Se não houver usuário, exibe mensagem ou redireciona para a tela de login
  if (!user) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text>Usuário não autenticado. Por favor, faça login.</Text>
      </View>
    );
  }

  // Se for exigida uma role específica e o usuário não corresponder, exibe mensagem de acesso negado
  if (requiredRole && user.tipoUsuario !== requiredRole) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text>Acesso Negado. Esta tela é restrita para usuários do tipo {requiredRole}.</Text>
      </View>
    );
  }

  // Se as verificações passarem, renderiza o conteúdo da tela
  return children;
}
