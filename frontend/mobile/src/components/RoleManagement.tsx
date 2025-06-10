import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Surface, List, Switch, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { UserRole } from '@/types/user';
import { useUser } from '@/context/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, ROLE_CONFIG } from '@/styles/theme';

interface RoleManagementProps {
  testID?: string;
}

/**
 * Componente moderno para gerenciamento de papéis do usuário
 * Substitui a função renderRoleSwitchSection no UnifiedDashboardScreen
 */
const RoleManagement: React.FC<RoleManagementProps> = ({ testID = 'role-management' }) => {
  const { user, isLoading, error, addRole, removeRole, setActiveRole, hasRole, updateRoles } = useUser();

  // Extrair os papéis e o papel ativo do usuário
  const roles = user?.roles || [];
  const activeRole = user?.activeRole;

  // Lista de papéis disponíveis para o usuário (excluindo admin)
  const availableRoles: UserRole[] = ['comprador', 'prestador', 'anunciante'];

  return (
    <Surface style={styles.container} elevation={1} testID={testID}>
      <Text style={[styles.title, styles.titleLarge]}>Gerenciar Papéis</Text>
      <Text style={[styles.description, styles.bodyMedium]}>
        Ative ou desative seus papéis na plataforma. Você deve ter pelo menos um papel ativo.
      </Text>

      {error && <Text style={[styles.errorText, styles.bodySmall]}>{error}</Text>}

      {availableRoles.map((role) => {
        const isActive = hasRole(role);
        const config = ROLE_CONFIG[role];
        const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

        return (
          <List.Item
            key={role}
            title={props => <Text>{roleTitle}</Text>}
            description={props => <Text>{config.description || `Papel de ${roleTitle}`}</Text>}
            left={props => (
              <List.Icon 
                {...props} 
                icon={({size, color}) => (
                  <MaterialIcons 
                    name={config.icon as any} 
                    size={size * 0.85} // Reduzido para 85% do tamanho original
                    color={isActive ? config.color : color} 
                  />
                )}
              />
            )}
            right={props => (
              <View style={styles.switchContainer}>
                {isLoading && activeRole === role ? (
                  <ActivityIndicator size={20} color={config.color} />
                ) : (
                  <Switch
                    value={isActive}
                    onValueChange={() => {
                      try {
                        // Usar uma abordagem mais simples e direta
                        const updatedRoles = isActive 
                          ? roles.filter(r => r !== role) 
                          : [...roles, role];

                        // Verificar se está tentando remover o último papel
                        if (updatedRoles.length === 0) {
                          console.warn("Não é possível remover o último papel");
                          return;
                        }

                        // Atualizar diretamente o estado do usuário com os novos papéis
                        updateRoles(updatedRoles);
                      } catch (error) {
                        console.error(`Erro ao ${isActive ? 'remover' : 'adicionar'} papel:`, error);
                      }
                    }}
                    disabled={roles.length === 1 && isActive}
                    color={config.color}
                    testID={`role-toggle-${role}`}
                  />
                )}
              </View>
            )}
            onPress={() => setActiveRole(isActive ? role : null)}
            style={[
              styles.roleItem,
              activeRole === role && { backgroundColor: config.color + '10' }
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: isActive }}
            accessibilityLabel={`${roleTitle} ${isActive ? 'ativo' : 'inativo'}`}
            accessibilityHint={`Toque para ${isActive ? 'desativar' : 'ativar'} o papel de ${roleTitle}`}
          />
        );
      })}

      <View style={styles.activeRolesContainer}>
        <Text style={styles.labelLarge}>Papéis ativos:</Text>
        <View style={styles.chipContainer}>
          {roles.map(role => (
            <Chip
              key={role}
              icon={({size, color}) => (
                <MaterialIcons 
                  name={ROLE_CONFIG[role].icon as any} 
                  size={size * 0.85} // Reduzido para 85% do tamanho original
                  color={ROLE_CONFIG[role].color} 
                />
              )}
              style={{ backgroundColor: ROLE_CONFIG[role].color + '20' }}
              textStyle={{ color: ROLE_CONFIG[role].color }}
              onPress={() => setActiveRole(role)}
              selected={activeRole === role}
              testID={`role-chip-${role}`}
            >
              <Text style={{ color: ROLE_CONFIG[role].color }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </Chip>
          ))}
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm, // Reduzido de md para sm
    borderRadius: 8,
    marginVertical: SPACING.sm,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  description: {
    marginBottom: SPACING.sm, // Reduzido de md para sm
    opacity: 0.7,
  },
  roleItem: {
    borderRadius: 6, // Reduzido de 8 para 6
    marginVertical: 2, // Reduzido de 4 para 2
  },
  switchContainer: {
    width: 40, // Reduzido de 50 para 40
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRolesContainer: {
    marginTop: SPACING.sm, // Reduzido de md para sm
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
    gap: 6, // Reduzido de 8 para 6
  },
  errorText: {
    color: 'red',
    marginBottom: SPACING.sm,
  },
  // Text variant styles
  titleLarge: {
    fontSize: TYPOGRAPHY.fontSize.lg, // Reduzido de xl para lg
    fontWeight: '700',
  },
  bodyMedium: {
    fontSize: TYPOGRAPHY.fontSize.sm, // Reduzido de md para sm
  },
  bodySmall: {
    fontSize: TYPOGRAPHY.fontSize.xs, // Reduzido de sm para xs
  },
  labelLarge: {
    fontSize: TYPOGRAPHY.fontSize.sm, // Reduzido de md para sm
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
});

export default RoleManagement;
