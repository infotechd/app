import { User, UserRole } from '@/types/user';

/**
 * Interface para as propriedades booleanas de papéis do usuário
 */
export interface UserRoleBooleanProps {
  isComprador: boolean;
  isPrestador: boolean;
  isAnunciante: boolean;
  isAdmin: boolean;
}

/**
 * Converte um array de papéis em propriedades booleanas
 * @param roles Array de papéis do usuário
 * @returns Objeto com propriedades booleanas para cada papel
 */
export function rolesToBooleanProps(roles: UserRole[] = []): UserRoleBooleanProps {
  return {
    isComprador: roles.includes('comprador'),
    isPrestador: roles.includes('prestador'),
    isAnunciante: roles.includes('anunciante'),
    isAdmin: roles.includes('admin')
  };
}

/**
 * Converte propriedades booleanas em um array de papéis
 * @param props Objeto com propriedades booleanas para cada papel
 * @returns Array de papéis do usuário
 */
export function booleanPropsToRoles(props: Partial<UserRoleBooleanProps> = {}): UserRole[] {
  const roles: UserRole[] = [];

  if (props.isComprador) roles.push('comprador');
  if (props.isPrestador) roles.push('prestador');
  if (props.isAnunciante) roles.push('anunciante');
  if (props.isAdmin) roles.push('admin');

  return roles;
}

/**
 * Verifica se um usuário tem um papel específico
 * @param user Objeto do usuário
 * @param role Papel a ser verificado
 * @returns true se o usuário tem o papel, false caso contrário
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;

  // Se o usuário tem o array de roles, usamos ele diretamente
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }

  // Caso contrário, verificamos as propriedades booleanas
  switch (role) {
    case 'comprador': return !!user.isComprador;
    case 'prestador': return !!user.isPrestador;
    case 'anunciante': return !!user.isAnunciante;
    case 'admin': return !!user.isAdmin;
    default: return false;
  }
}

/**
 * Adiciona um papel ao array de papéis do usuário
 * @param user Objeto do usuário
 * @param role Papel a ser adicionado
 * @returns Novo objeto de usuário com o papel adicionado
 */
export function addRole(user: User, role: UserRole): User {
  // Se o usuário já tem esse papel, retorna o usuário sem alterações
  if (hasRole(user, role)) {
    return user;
  }

  // Garante que o usuário tenha um array de roles
  const currentRoles = user.roles || booleanPropsToRoles({
    isComprador: user.isComprador,
    isPrestador: user.isPrestador,
    isAnunciante: user.isAnunciante,
    isAdmin: user.isAdmin
  });

  // Adiciona o papel ao array
  const newRoles = [...currentRoles, role];

  // Atualiza também as flags booleanas para compatibilidade
  const booleanProps = rolesToBooleanProps(newRoles);

  // Retorna um novo objeto de usuário com o papel adicionado
  return {
    ...user,
    roles: newRoles,
    ...booleanProps
  };
}

/**
 * Remove um papel do array de papéis do usuário
 * @param user Objeto do usuário
 * @param role Papel a ser removido
 * @returns Novo objeto de usuário com o papel removido, ou null se a operação não for permitida
 */
export function removeRole(user: User, role: UserRole): User | null {
  // Se o usuário não tem esse papel, retorna o usuário sem alterações
  if (!hasRole(user, role)) {
    return user;
  }

  // Garante que o usuário tenha um array de roles
  const currentRoles = user.roles || booleanPropsToRoles({
    isComprador: user.isComprador,
    isPrestador: user.isPrestador,
    isAnunciante: user.isAnunciante,
    isAdmin: user.isAdmin
  });

  // Verifica se é o último papel
  if (currentRoles.length === 1 && currentRoles.includes(role)) {
    // Não permite remover o último papel
    return null;
  }

  // Remove o papel do array
  const newRoles = currentRoles.filter(r => r !== role);

  // Atualiza também as flags booleanas para compatibilidade
  const booleanProps = rolesToBooleanProps(newRoles);

  // Retorna um novo objeto de usuário com o papel removido
  return {
    ...user,
    roles: newRoles,
    ...booleanProps
  };
}

/**
 * Cria um objeto de atualização para o backend com o formato correto
 * @param user Objeto do usuário
 * @param roles Array de papéis atualizado
 * @returns Objeto de atualização no formato esperado pelo backend
 */
export function createRoleUpdatePayload(user: User, roles: UserRole[]): any {
  // Atualiza também as flags booleanas para compatibilidade
  const booleanProps = rolesToBooleanProps(roles);

  // Cria o objeto de atualização no formato esperado pelo backend
  return {
    user: {
      ...user,
      roles,
      ...booleanProps,
      // Garantir que pelo menos um dos campos de ID esteja presente
      idUsuario: user.idUsuario || user.id || user._id
    }
  };
}
