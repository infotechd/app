import { UserRole } from '@/types/user';

/**
 * Sistema de permissões baseado em capacidades
 * 
 * Este módulo implementa um sistema de permissões que mapeia papéis de usuário
 * para permissões específicas, permitindo um controle de acesso mais granular
 * e flexível do que verificações diretas de papel.
 */

// Define todas as permissões possíveis no sistema
export type Permission = 
  // Permissões de comprador
  | 'view_offers'
  | 'hire_services'
  | 'view_trainings'
  | 'rate_services'
  
  // Permissões de prestador
  | 'create_offers'
  | 'manage_agenda'
  | 'view_requests'
  | 'respond_to_requests'
  
  // Permissões de anunciante
  | 'create_trainings'
  | 'view_reports'
  | 'manage_ads'
  | 'view_analytics'
  
  // Permissões de administrador
  | 'manage_users'
  | 'view_all_data'
  | 'system_settings'
  | 'moderate_content';

// Mapeamento de papéis para permissões
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  comprador: [
    'view_offers',
    'hire_services',
    'view_trainings',
    'rate_services'
  ],
  prestador: [
    'create_offers',
    'manage_agenda',
    'view_requests',
    'respond_to_requests'
  ],
  anunciante: [
    'create_trainings',
    'view_reports',
    'manage_ads',
    'view_analytics'
  ],
  admin: [
    'manage_users',
    'view_all_data',
    'system_settings',
    'moderate_content',
    // Administradores também têm todas as outras permissões
    'view_offers',
    'hire_services',
    'view_trainings',
    'rate_services',
    'create_offers',
    'manage_agenda',
    'view_requests',
    'respond_to_requests',
    'create_trainings',
    'view_reports',
    'manage_ads',
    'view_analytics'
  ]
};

/**
 * Verifica se um conjunto de papéis tem uma permissão específica
 * 
 * @param roles - Array de papéis do usuário
 * @param permission - Permissão a ser verificada
 * @returns true se algum dos papéis tem a permissão, false caso contrário
 */
export function hasPermission(roles: UserRole[], permission: Permission): boolean {
  if (!roles || roles.length === 0) return false;
  
  return roles.some(role => 
    ROLE_PERMISSIONS[role]?.includes(permission)
  );
}

/**
 * Obtém todas as permissões para um conjunto de papéis
 * 
 * @param roles - Array de papéis do usuário
 * @returns Array de todas as permissões que o usuário tem
 */
export function getAllPermissions(roles: UserRole[]): Permission[] {
  if (!roles || roles.length === 0) return [];
  
  // Combina todas as permissões de todos os papéis e remove duplicatas
  const allPermissions = roles.flatMap(role => ROLE_PERMISSIONS[role] || []);
  return [...new Set(allPermissions)];
}

/**
 * Converte as propriedades booleanas de papel em um array de papéis
 * 
 * @param isComprador - Flag indicando se o usuário é comprador
 * @param isPrestador - Flag indicando se o usuário é prestador
 * @param isAnunciante - Flag indicando se o usuário é anunciante
 * @param isAdmin - Flag indicando se o usuário é administrador
 * @returns Array de papéis do usuário
 */
export function booleanPropsToRoles({
  isComprador,
  isPrestador,
  isAnunciante,
  isAdmin
}: {
  isComprador?: boolean;
  isPrestador?: boolean;
  isAnunciante?: boolean;
  isAdmin?: boolean;
}): UserRole[] {
  const roles: UserRole[] = [];
  
  if (isComprador) roles.push('comprador');
  if (isPrestador) roles.push('prestador');
  if (isAnunciante) roles.push('anunciante');
  if (isAdmin) roles.push('admin');
  
  return roles;
}

/**
 * Converte um array de papéis em propriedades booleanas
 * 
 * @param roles - Array de papéis do usuário
 * @returns Objeto com as propriedades booleanas correspondentes
 */
export function rolesToBooleanProps(roles: UserRole[] = []): {
  isComprador: boolean;
  isPrestador: boolean;
  isAnunciante: boolean;
  isAdmin: boolean;
} {
  return {
    isComprador: roles.includes('comprador'),
    isPrestador: roles.includes('prestador'),
    isAnunciante: roles.includes('anunciante'),
    isAdmin: roles.includes('admin')
  };
}