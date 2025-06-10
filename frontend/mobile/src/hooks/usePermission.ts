import { useAuth } from '@/context/AuthContext';
import { Permission, hasPermission, booleanPropsToRoles, ROLE_PERMISSIONS } from '@/utils/permissions';

/**
 * Hook para verificar se o usuário atual tem uma permissão específica
 * 
 * Este hook simplifica a verificação de permissões em componentes,
 * abstraindo a lógica de verificação e permitindo um controle de acesso
 * baseado em capacidades em vez de papéis diretos.
 * 
 * @param permission - A permissão a ser verificada
 * @returns true se o usuário tem a permissão, false caso contrário
 * 
 * @example
 * // Verificar se o usuário pode criar ofertas
 * const canCreateOffers = usePermission('create_offers');
 * 
 * // Usar em renderização condicional
 * {canCreateOffers && <Button title="Criar Oferta" onPress={handleCreateOffer} />}
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();

  if (!user) return false;

  // Se o usuário já tem o array de roles, usamos ele diretamente
  if (user.roles && Array.isArray(user.roles)) {
    return hasPermission(user.roles, permission);
  }

  // Caso contrário, convertemos as propriedades booleanas para roles
  const roles = booleanPropsToRoles({
    isComprador: user.isComprador,
    isPrestador: user.isPrestador,
    isAnunciante: user.isAnunciante,
    isAdmin: user.isAdmin
  });

  return hasPermission(roles, permission);
}

/**
 * Hook para obter todas as permissões do usuário atual
 * 
 * @returns Array de permissões que o usuário possui
 */
export function useAllPermissions(): Permission[] {
  const { user } = useAuth();

  if (!user) return [];

  // Se o usuário já tem o array de roles, usamos ele diretamente
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.flatMap(role => 
      ROLE_PERMISSIONS[role] || []
    );
  }

  // Caso contrário, convertemos as propriedades booleanas para roles
  const roles = booleanPropsToRoles({
    isComprador: user.isComprador,
    isPrestador: user.isPrestador,
    isAnunciante: user.isAnunciante,
    isAdmin: user.isAdmin
  });

  return roles.flatMap(role => 
    ROLE_PERMISSIONS[role] || []
  );
}
