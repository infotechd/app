import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from "@/context/AuthContext";
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { UserRole } from "@/types/user";
import RoleSection from '@/components/RoleSection';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useDashboardState } from '@/hooks/useDashboardState';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, ROLE_CONFIG, SHADOWS, COMMON_STYLES } from '@/styles/theme';
import { handleApiError } from '@/components/ErrorHandling';

// Define o tipo das props da tela, incluindo navegação e parâmetros da rota
type UnifiedDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'UnifiedDashboard'>;

// Mapeamento entre os nomes de papéis usados na interface e as propriedades do objeto User
// Isso melhora a consistência e evita conversões manuais entre os diferentes formatos
const ROLES_MAP = {
  comprador: 'isComprador',
  prestador: 'isPrestador',
  anunciante: 'isAnunciante',
  admin: 'isAdmin'
} as const;

// Mapeamento inverso para converter de propriedade do User para UserRole
const ROLES_MAP_INVERSE = {
  isComprador: 'comprador',
  isPrestador: 'prestador',
  isAnunciante: 'anunciante',
  isAdmin: 'admin'
} as const;

// O componente RoleSection foi movido para um arquivo separado
// e agora é importado no topo do arquivo

/**
 * Tela de dashboard unificado que exibe seções para cada papel do usuário.
 * Substitui os dashboards separados para cada tipo de usuário.
 * Permite que o usuário visualize e gerencie seus diferentes papéis (comprador, prestador, anunciante)
 * em uma única interface, mostrando estatísticas e ações relevantes para cada papel.
 */
export default function UnifiedDashboardScreen({ navigation, route }: UnifiedDashboardScreenProps) {
  // Obter dados do usuário e função de atualização do contexto de autenticação
  const { user, updateUser } = useAuth();

  // Usar o hook personalizado para gerenciar papéis de usuário
  const { toggleUserRole, isLoading: isRoleLoading } = useUserRoles(user, updateUser);

  // Usar o hook personalizado para gerenciar o estado do dashboard
  const { 
    state: { activeRole, isLoading, stats },
    setActiveRole,
    setLoading,
    updateBuyerStats,
    updateProviderStats,
    updateAdvertiserStats
  } = useDashboardState({
    // Estado inicial personalizado
    activeRole: null,
    isLoading: true,
    stats: {
      buyer: {
        contratacoesPendentes: 3,
        contratacoesConcluidas: 12,
        avaliacoesRecebidas: 8,
      },
      provider: {
        ofertasAtivas: 5,
        solicitacoesPendentes: 2,
        avaliacaoMedia: 4.7,
      },
      advertiser: {
        treinamentosAtivos: 3,
        visualizacoesTotais: 245,
        inscricoesTotais: 18,
      }
    }
  });

  // Configurar o papel ativo inicial e carregar dados
  useEffect(() => {
    // Definir o papel ativo com base no parâmetro da rota ou no primeiro papel disponível
    if (route.params?.initialRole) {
      // Verifica se o papel especificado na rota é válido
      const initialRole = route.params.initialRole as UserRole;
      if (Object.keys(ROLES_MAP).includes(initialRole)) {
        // Verifica se o usuário tem esse papel ativo
        const roleProperty = ROLES_MAP[initialRole];
        if (user && user[roleProperty]) {
          setActiveRole(initialRole);
        }
      }
    } else if (user) {
      // Se não houver papel especificado na rota, seleciona o primeiro papel disponível

      // Se já existe um papel ativo, verifica se ele ainda é válido para o usuário atual
      if (activeRole) {
        const activeRoleProperty = ROLES_MAP[activeRole as UserRole];
        // Se o papel ativo atual não é mais válido para o usuário, selecionar outro
        if (!user[activeRoleProperty]) {
          setActiveRole(null); // Resetar o papel ativo
        }
        // Se o papel ativo atual ainda é válido, não precisamos fazer nada
      }

      // Se não há papel ativo definido, seleciona o primeiro disponível
      if (!activeRole) {
        for (const [roleName, roleProperty] of Object.entries(ROLES_MAP)) {
          if (user[roleProperty]) {
            setActiveRole(roleName as UserRole);
            break;
          }
        }
      }
    }

    // Simular carregamento de dados da API
    // Em um ambiente de produção, aqui seriam feitas chamadas reais para obter os dados
    const timer = setTimeout(() => {
      setLoading(false);

      // Aqui poderíamos fazer chamadas API para obter estatísticas reais
      // Por exemplo:
      // fetchBuyerStats().then(data => updateBuyerStats(data));
      // fetchProviderStats().then(data => updateProviderStats(data));
      // fetchAdvertiserStats().then(data => updateAdvertiserStats(data));
    }, 1000);

    // Função de limpeza para evitar vazamento de memória
    return () => clearTimeout(timer);
  }, [user, route.params, activeRole, setActiveRole, setLoading]);

  // Renderizar seção para o papel de comprador
  // Esta função cria e retorna o componente de UI para a seção de comprador,
  // exibindo estatísticas e ações relevantes para este papel
  const renderBuyerSection = useCallback(() => {
    // Se o usuário não tem o papel de comprador, não renderiza nada
    if (!user?.isComprador) return null;

    // Verifica se esta seção está expandida/ativa no momento
    const isActive = activeRole === 'comprador';

    // Estatísticas para o papel de comprador
    const buyerStatsArray = [
      { label: 'Pendentes', value: stats.buyer.contratacoesPendentes },
      { label: 'Concluídas', value: stats.buyer.contratacoesConcluidas },
      { label: 'Avaliações', value: stats.buyer.avaliacoesRecebidas }
    ];

    // Botões de ação para o papel de comprador
    const actionButtons = [
      { 
        text: 'Buscar Serviços', 
        onPress: () => navigation.navigate('BuscarOfertas') 
      },
      { 
        text: 'Ver Treinamentos', 
        onPress: () => navigation.navigate('TreinamentoList') 
      }
    ];

    // Usa o componente RoleSection para renderizar a seção
    return (
      <RoleSection
        role="comprador"
        isActive={isActive}
        isLoading={isLoading}
        stats={buyerStatsArray}
        actionButtons={actionButtons}
        onToggle={() => setActiveRole(isActive ? null : 'comprador')}
        testID="buyer-role-section"
      />
    );
  }, [user?.isComprador, activeRole, isLoading, stats.buyer, navigation, setActiveRole]);

  // Renderizar seção para o papel de prestador
  // Esta função cria e retorna o componente de UI para a seção de prestador de serviços,
  // mostrando estatísticas sobre ofertas, solicitações e avaliações, além de ações disponíveis
  const renderProviderSection = useCallback(() => {
    // Se o usuário não tem o papel de prestador, não renderiza nada
    if (!user?.isPrestador) return null;

    // Verifica se esta seção está expandida/ativa no momento
    const isActive = activeRole === 'prestador';

    // Estatísticas para o papel de prestador
    const providerStatsArray = [
      { label: 'Ofertas', value: stats.provider.ofertasAtivas },
      { label: 'Solicitações', value: stats.provider.solicitacoesPendentes },
      { label: 'Avaliação', value: stats.provider.avaliacaoMedia }
    ];

    // Botões de ação para o papel de prestador
    const actionButtons = [
      { 
        text: 'Minhas Ofertas', 
        onPress: () => navigation.navigate('OfertaServico', { offerId: '', mode: 'list' }) 
      },
      { 
        text: 'Minha Agenda', 
        onPress: () => navigation.navigate('Agenda') 
      }
    ];

    // Usa o componente RoleSection para renderizar a seção
    return (
      <RoleSection
        role="prestador"
        isActive={isActive}
        isLoading={isLoading}
        stats={providerStatsArray}
        actionButtons={actionButtons}
        onToggle={() => setActiveRole(isActive ? null : 'prestador')}
        testID="provider-role-section"
      />
    );
  }, [user?.isPrestador, activeRole, isLoading, stats.provider, navigation, setActiveRole]);

  // A função toggleUserRole foi movida para o hook useUserRoles
  // e agora é importada no topo do arquivo

  // Renderizar seção para gerenciar papéis do usuário
  // Esta função cria e retorna o componente de UI que permite ao usuário
  // ativar ou desativar seus diferentes papéis na plataforma (comprador, prestador, anunciante)
  const renderRoleSwitchSection = useCallback(() => {
    // Se não houver usuário logado, não renderiza nada
    if (!user) return null;

    // Lista de papéis disponíveis para o usuário (excluindo admin)
    const availableRoles: UserRole[] = ['comprador', 'prestador', 'anunciante'];

    return (
      <View 
        style={styles.roleSwitchSection}
        accessibilityLabel="Gerenciar papéis"
        accessibilityRole="none"
      >
        <Text style={styles.sectionTitle}>Gerenciar Papéis</Text>
        <Text style={styles.roleSwitchDescription}>
          Ative ou desative seus papéis na plataforma. Você deve ter pelo menos um papel ativo.
        </Text>

        <View 
          style={styles.roleToggleContainer}
          accessibilityLabel="Lista de papéis disponíveis"
        >
          {availableRoles.map((roleName) => {
            const roleProperty = ROLES_MAP[roleName];
            const isActive = user[roleProperty] === true;
            const config = ROLE_CONFIG[roleName];
            const roleTitle = roleName.charAt(0).toUpperCase() + roleName.slice(1);

            return (
              <TouchableOpacity 
                key={roleName}
                style={[
                  styles.roleToggleButton, 
                  isActive ? styles.roleToggleActive : styles.roleToggleInactive,
                  { borderColor: config.color }
                ]}
                onPress={() => toggleUserRole(roleProperty, !isActive)}
                accessibilityRole="switch"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={`${roleTitle} ${isActive ? 'ativo' : 'inativo'}`}
                accessibilityHint={`Toque para ${isActive ? 'desativar' : 'ativar'} o papel de ${roleTitle}`}
                testID={`role-toggle-${roleName}`}
              >
                <MaterialIcons 
                  name={config.icon as any} 
                  size={24} 
                  color={isActive ? config.color : COLORS.textDisabled} 
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
                <Text style={[
                  styles.roleToggleText, 
                  { color: isActive ? config.color : COLORS.textDisabled }
                ]}>
                  {roleTitle}
                </Text>
                <MaterialIcons 
                  name={isActive ? "check-circle" : "radio-button-unchecked"} 
                  size={20} 
                  color={isActive ? config.color : COLORS.textDisabled}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [user, toggleUserRole]);

  // Renderizar seção para o papel de anunciante
  // Esta função cria e retorna o componente de UI para a seção de anunciante,
  // mostrando estatísticas sobre treinamentos, visualizações e inscrições, além de ações disponíveis
  const renderAdvertiserSection = useCallback(() => {
    // Se o usuário não tem o papel de anunciante, não renderiza nada
    if (!user?.isAnunciante) return null;

    // Verifica se esta seção está expandida/ativa no momento
    const isActive = activeRole === 'anunciante';

    // Estatísticas para o papel de anunciante
    const advertiserStatsArray = [
      { label: 'Treinamentos', value: stats.advertiser.treinamentosAtivos },
      { label: 'Visualizações', value: stats.advertiser.visualizacoesTotais },
      { label: 'Inscrições', value: stats.advertiser.inscricoesTotais }
    ];

    // Botões de ação para o papel de anunciante
    const actionButtons = [
      { 
        text: 'Criar Treinamento', 
        onPress: () => navigation.navigate('TreinamentoCreate') 
      },
      { 
        text: 'Ver Relatórios', 
        onPress: () => navigation.navigate('Relatorio') 
      }
    ];

    // Usa o componente RoleSection para renderizar a seção
    return (
      <RoleSection
        role="anunciante"
        isActive={isActive}
        isLoading={isLoading}
        stats={advertiserStatsArray}
        actionButtons={actionButtons}
        onToggle={() => setActiveRole(isActive ? null : 'anunciante')}
        testID="advertiser-role-section"
      />
    );
  }, [user?.isAnunciante, activeRole, isLoading, stats.advertiser, navigation, setActiveRole]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Olá, {user?.nome || 'Usuário'}</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumo da Conta</Text>
        <Text style={styles.summaryText}>
          Você possui {[
            user?.isComprador ? 'comprador' : '',
            user?.isPrestador ? 'prestador' : '',
            user?.isAnunciante ? 'anunciante' : ''
          ].filter(Boolean).length} papéis ativos
        </Text>
      </View>

      {/* Seção para gerenciar papéis do usuário - permite ativar/desativar diferentes papéis */}
      {renderRoleSwitchSection()}

      {/* Seções para cada papel do usuário - cada uma mostra estatísticas e ações específicas */}
      {/* Seção de comprador - mostra contratos pendentes, concluídos e avaliações */}
      {renderBuyerSection()}
      {/* Seção de prestador - mostra ofertas ativas, solicitações e avaliação média */}
      {renderProviderSection()}
      {/* Seção de anunciante - mostra treinamentos ativos, visualizações e inscrições */}
      {renderAdvertiserSection()}

      {/* Botão para voltar à tela inicial - permite navegar de volta para a Home */}
      <TouchableOpacity 
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}>
        <MaterialIcons name="home" size={20} color="white" />
        <Text style={styles.homeButtonText}>Voltar para Início</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Estilos usando o sistema de temas
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  summarySection: {
    ...COMMON_STYLES.card,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  // Estilos para a seção de troca de papéis (gerenciamento de papéis)
  roleSwitchSection: {
    ...COMMON_STYLES.card,
  },
  roleSwitchDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  roleToggleContainer: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  roleToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  roleToggleActive: {
    backgroundColor: COLORS.background,
  },
  roleToggleInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.divider,
  },
  roleToggleText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  // Estilo para o botão de voltar para a tela inicial
  homeButton: {
    ...COMMON_STYLES.button.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  homeButtonText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});
