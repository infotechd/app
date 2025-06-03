import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserRole } from '@/types/user';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, ROLE_CONFIG, SHADOWS } from '@/styles/theme';

// Interface para as props do componente RoleSection
interface RoleSectionProps {
  role: UserRole;
  isActive: boolean;
  isLoading: boolean;
  stats: Array<{ label: string; value: string | number }>;
  actionButtons: Array<{ text: string; onPress: () => void }>;
  onToggle: () => void;
  testID?: string;
}

/**
 * Componente genérico para renderizar uma seção de papel do usuário
 * Otimizado com React.memo para evitar re-renderizações desnecessárias
 * Inclui atributos de acessibilidade para melhor suporte a leitores de tela
 */
const RoleSection: React.FC<RoleSectionProps> = ({ 
  role, 
  isActive, 
  isLoading, 
  stats, 
  actionButtons, 
  onToggle,
  testID
}) => {
  const config = ROLE_CONFIG[role];
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  // Determinar o estado para leitores de tela
  const expandedState = isActive ? 'expandido' : 'recolhido';
  const accessibilityLabel = `Seção de ${roleTitle}, ${expandedState}. Toque para ${isActive ? 'recolher' : 'expandir'}.`;

  return (
    <View 
      style={[
        styles.roleSection, 
        isActive ? { 
          borderLeftWidth: 4, 
          borderLeftColor: config.borderColor 
        } : null
      ]}
      testID={testID || `role-section-${role}`}
      accessibilityRole="header"
    >
      <TouchableOpacity 
        style={styles.roleSectionHeader}
        onPress={onToggle}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: isActive }}
        accessibilityHint={`Toque para ${isActive ? 'recolher' : 'expandir'} a seção de ${roleTitle}`}
      >
        <View style={styles.roleTitleContainer}>
          <View 
            style={[styles.roleIconContainer, { backgroundColor: config.bgColor }]}
            accessibilityRole="image"
            accessibilityLabel={`Ícone de ${roleTitle}`}
          >
            <MaterialIcons name={config.icon as any} size={24} color={config.color} />
          </View>
          <Text style={styles.roleSectionTitle}>{roleTitle}</Text>
        </View>
        <MaterialIcons 
          name={isActive ? "expand-less" : "expand-more"} 
          size={24} 
          color="#555" 
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      {isActive && (
        <View 
          style={styles.roleSectionContent}
          accessibilityRole="none"
          accessibilityLabel={`Conteúdo da seção de ${roleTitle}`}
        >
          {isLoading ? (
            <ActivityIndicator 
              size="small" 
              color={config.color} 
              accessibilityLabel="Carregando dados"
            />
          ) : (
            <>
              <View 
                style={styles.statsContainer}
                accessibilityLabel={`Estatísticas de ${roleTitle}`}
              >
                {stats.map((stat, index) => (
                  <View 
                    key={index} 
                    style={styles.statItem}
                    accessibilityLabel={`${stat.value} ${stat.label}`}
                  >
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionButtonsContainer}>
                {actionButtons.map((button, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.actionButton}
                    onPress={button.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={button.text}
                    accessibilityHint={`Navegar para ${button.text}`}
                  >
                    <Text style={styles.actionButtonText}>{button.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

// Estilos para o componente
const styles = StyleSheet.create({
  roleSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  roleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  roleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  roleSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleSectionContent: {
    padding: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    width: '48%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
});

// Exportar o componente memoizado para evitar re-renderizações desnecessárias
export default memo(RoleSection);
