import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { Surface, List, Switch, Chip, Button } from 'react-native-paper';
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
  const { user, isLoading, error, setActiveRole, hasRole, handleUpdateRoles } = useUser();

  // Extrair os papéis e o papel ativo do usuário
  const userRoles = user?.roles || [];
  const activeRole = user?.activeRole;

  // Lista de papéis disponíveis para o usuário (excluindo admin)
  const availableRoles: UserRole[] = ['comprador', 'prestador', 'anunciante'];

  // Estado local para os papéis selecionados pelo usuário
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(userRoles);

  // Estado para controlar se houve mudanças nos papéis
  const [hasChanges, setHasChanges] = useState(false);

  // Atualiza o estado local quando os papéis do usuário mudam
  useEffect(() => {
    // Comparar os arrays antes de atualizar o estado para evitar loops infinitos
    if (JSON.stringify(selectedRoles.sort()) !== JSON.stringify(userRoles.sort())) {
      setSelectedRoles([...userRoles]); // Cria uma nova cópia do array para garantir que o estado seja atualizado
      setHasChanges(false);
    }
  }, [userRoles]);

  // Função para alternar um papel no estado local
  const toggleRole = (role: UserRole) => {
    let newSelectedRoles: UserRole[];

    if (selectedRoles.includes(role)) {
      // Não permite remover o último papel
      if (selectedRoles.length === 1) {
        Alert.alert(
          "Ação não permitida",
          "Você deve ter pelo menos um papel ativo."
        );
        return;
      }
      // Remove o papel da lista
      newSelectedRoles = selectedRoles.filter(r => r !== role);
    } else {
      // Adiciona o papel à lista
      newSelectedRoles = [...selectedRoles, role];
    }

    setSelectedRoles(newSelectedRoles);
    setHasChanges(true);
  };

  // Função para salvar as alterações
  const saveChanges = async () => {
    // Verifica se há pelo menos um papel selecionado
    if (selectedRoles.length === 0) {
      Alert.alert(
        "Ação não permitida",
        "Você deve selecionar pelo menos um papel."
      );
      return;
    }

    // Verifica se há mudanças para salvar
    if (!hasChanges) {
      Alert.alert(
        "Informação",
        "Não há alterações para salvar."
      );
      return;
    }

    // Cria uma referência ao alerta para poder fechá-lo posteriormente
    let alertRef: any = null;

    try {
      // Mostra um indicador de carregamento enquanto a operação está em andamento
      // Armazena a referência para poder fechá-lo depois
      alertRef = Alert.alert(
        "Processando",
        "Salvando suas alterações...",
        [],
        { cancelable: false }
      );

      // Chama a função do contexto para atualizar os papéis
      await handleUpdateRoles(selectedRoles);

      // Atualiza o estado local para refletir que não há mais mudanças pendentes
      setHasChanges(false);

      // Feedback de sucesso (já fornecido pelo handleUpdateRoles, mas mantido aqui para clareza)
      console.log("Papéis salvos com sucesso:", selectedRoles);

      // Mostra um alerta de sucesso após um pequeno delay para garantir que o alerta de processamento seja fechado
      setTimeout(() => {
        Alert.alert(
          "Sucesso",
          "Seus papéis foram atualizados com sucesso.",
          [{ text: "OK" }]
        );
      }, 300);
    } catch (error) {
      console.error("Erro ao salvar papéis:", error);

      // Feedback de erro adicional específico para este componente
      Alert.alert(
        "Erro ao Salvar",
        "Ocorreu um erro ao salvar seus papéis. Verifique sua conexão e tente novamente."
      );
    }
  };

  return (
    <Surface style={styles.container} elevation={1} testID={testID}>
      <Text style={[styles.title, styles.titleLarge]}>Gerenciar Papéis</Text>
      <Text style={[styles.description, styles.bodyMedium]}>
        Selecione seus papéis na plataforma e clique em "Salvar Alterações" para confirmar.
      </Text>

      {error && <Text style={[styles.errorText, styles.bodySmall]}>{error}</Text>}

      {availableRoles.map((role) => {
        const isSelected = selectedRoles.includes(role);
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
                    color={isSelected ? config.color : color} 
                  />
                )}
              />
            )}
            right={props => (
              <View style={styles.switchContainer}>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleRole(role)}
                  disabled={isLoading || (selectedRoles.length === 1 && isSelected)}
                  color={config.color}
                  testID={`role-toggle-${role}`}
                />
              </View>
            )}
            onPress={() => !isLoading && toggleRole(role)}
            style={[
              styles.roleItem,
              activeRole === role && { backgroundColor: config.color + '10' }
            ]}
            accessibilityRole="switch"
            accessibilityState={{ 
              checked: isSelected,
              disabled: isLoading || (selectedRoles.length === 1 && isSelected)
            }}
            accessibilityLabel={`${roleTitle} ${isSelected ? 'selecionado' : 'não selecionado'}`}
            accessibilityHint={`Toque para ${isSelected ? 'remover' : 'adicionar'} o papel de ${roleTitle}`}
          />
        );
      })}

      <View style={styles.activeRolesContainer}>
        <Text style={styles.labelLarge}>Papéis selecionados:</Text>
        <View style={styles.chipContainer}>
          {selectedRoles.map(role => (
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

      <Button
        mode="contained"
        onPress={saveChanges}
        disabled={isLoading || !hasChanges}
        loading={isLoading}
        style={styles.saveButton}
        testID="save-roles-button"
        accessibilityLabel="Salvar alterações nos papéis"
        accessibilityHint="Toque para salvar as alterações feitas nos papéis"
      >
        Salvar Alterações
      </Button>
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
  // Estilo para o botão de salvar alterações
  saveButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
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
