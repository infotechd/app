import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from "@/navigation/types";
import { UserRole } from "@/types/user";
import RoleSection from '@/components/RoleSection';
import RoleManagement from '@/components/RoleManagement';
import { useUser } from '@/context/UserContext';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useUserRoles } from '@/hooks/useUserRoles';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS,  COMMON_STYLES } from '@/styles/theme';

// Define as roles válidas baseadas no tipo UserRole
const VALID_USER_ROLES: UserRole[] = ['comprador', 'prestador', 'anunciante', 'admin'];

// Define o tipo das props da tela, incluindo navegação e parâmetros da rota
type UnifiedDashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'UnifiedDashboard'>;

// Os mapeamentos entre papéis e propriedades booleanas foram movidos para o módulo de permissões
// Agora usamos o array de roles diretamente do objeto User

// O componente RoleSection foi movido para um arquivo separado
// e agora é importado no topo do arquivo

/**
 * Tela de dashboard unificado que exibe seções para cada papel do usuário.
 * Substitui os dashboards separados para cada tipo de usuário.
 * Permite que o usuário visualize e gerencie seus diferentes papéis (comprador, prestador, anunciante)
 * em uma única interface, mostrando estatísticas e ações relevantes para cada papel.
 */
export default function UnifiedDashboardScreen({ navigation, route }: UnifiedDashboardScreenProps) {
  // Usar o hook unificado para gerenciar usuário e papéis
  const { user, hasRole, setActiveRole: setActiveRoleContext, updateUser } = useUser();

  // Usar o hook useUserRoles para gerenciar papéis do usuário
  const { toggleUserRole } = useUserRoles(user, updateUser);

  // Usar o hook personalizado para gerenciar o estado do dashboard
  const { 
    state: { activeRole, isLoading, stats },
    setActiveRole,
    setLoading,
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
      // Verifica se o papel especificado na rota é um UserRole válido
      const roleParam = route.params.initialRole;
      // Verifica se o valor da string está entre os valores válidos de UserRole
      const isValidRole = VALID_USER_ROLES.includes(roleParam as any);

      if (isValidRole) {
        // Agora é seguro fazer o cast para UserRole
        const initialRole = roleParam as UserRole;
        if (user?.roles?.includes(initialRole)) {
          setActiveRole(initialRole);
          setActiveRoleContext(initialRole);
        }
      }
    } else if (user) {
      // Se não houver papel especificado na rota, seleciona o primeiro papel disponível

      // Se já existe um papel ativo, verifica se ele ainda é válido para o usuário atual
      if (activeRole) {
        // Se o papel ativo atual não é mais válido para o usuário, selecionar outro
        if (!user.roles?.includes(activeRole)) {
          setActiveRole(null); // Resetar o papel ativo
          setActiveRoleContext(null);
        }
        // Se o papel ativo atual ainda é válido, não precisamos fazer nada
      }

      // Se não há papel ativo definido, seleciona o primeiro disponível
      if (!activeRole && user?.roles && user.roles.length > 0) {
        setActiveRole(user.roles[0]);
        setActiveRoleContext(user.roles[0]);
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
  }, [user, route.params, setActiveRole, setActiveRoleContext, setLoading]);

  // Renderizar seção para o papel de comprador
  // Esta função cria e retorna o componente de UI para a seção de comprador,
  // exibindo estatísticas e ações relevantes para este papel
  const renderBuyerSection = useCallback(() => {
    // Se o usuário não tem o papel de comprador, não renderiza nada
    if (!user?.roles?.includes('comprador')) return null;

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
  }, [user?.roles, activeRole, isLoading, stats.buyer, navigation, setActiveRole]);

  // Renderizar seção para o papel de prestador
  // Esta função cria e retorna o componente de UI para a seção de prestador de serviços,
  // mostrando estatísticas sobre ofertas, solicitações e avaliações, além de ações disponíveis
  const renderProviderSection = useCallback(() => {
    // Se o usuário não tem o papel de prestador, não renderiza nada
    if (!user?.roles?.includes('prestador')) return null;

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
  }, [user?.roles, activeRole, isLoading, stats.provider, navigation, setActiveRole]);

  // A função toggleUserRole foi movida para o hook useUserRoles
  // e agora é importada no topo do arquivo

  // A seção para gerenciar papéis do usuário foi substituída pelo componente RoleManagement

  // Renderizar seção para o papel de anunciante
  // Esta função cria e retorna o componente de UI para a seção de anunciante,
  // mostrando estatísticas sobre treinamentos, visualizações e inscrições, além de ações disponíveis
  const renderAdvertiserSection = useCallback(() => {
    // Se o usuário não tem o papel de anunciante, não renderiza nada
    if (!user?.roles?.includes('anunciante')) return null;

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
  }, [user?.roles, activeRole, isLoading, stats.advertiser, navigation, setActiveRole]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Olá, {user?.nome || 'Usuário'}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        {/* Botão para voltar à tela inicial - movido para o topo */}
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="home" size={18} color="white" />
          <Text style={styles.homeButtonText}>Voltar para Início</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumo da Conta</Text>
        <Text style={styles.summaryText}>
          Você possui {user?.roles?.length || 0} papéis ativos
        </Text>
      </View>

      {/* Seção para gerenciar papéis do usuário - permite ativar/desativar diferentes papéis */}
      <RoleManagement testID="role-management-section" />

      {/* Seções para cada papel do usuário - cada uma mostra estatísticas e ações específicas */}
      {/* Seção de comprador - mostra contratos pendentes, concluídos e avaliações */}
      {renderBuyerSection()}
      {/* Seção de prestador - mostra ofertas ativas, solicitações e avaliação média */}
      {renderProviderSection()}
      {/* Seção de anunciante - mostra treinamentos ativos, visualizações e inscrições */}
      {renderAdvertiserSection()}
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
  // Estilo para a barra superior que contém o cabeçalho e o botão de voltar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  // Estilo para a parte esquerda do cabeçalho (nome e data)
  headerLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.xl, // Reduzido de xxl para xl
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.xs, // Reduzido de sm para xs
    color: COLORS.textSecondary,
  },
  summarySection: {
    ...COMMON_STYLES.card,
    marginBottom: SPACING.md, // Adicionado para garantir espaçamento consistente
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md, // Reduzido de lg para md
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.fontSize.sm, // Reduzido de md para sm
    color: COLORS.textSecondary,
  },
  // Estilo para o botão de voltar para a tela inicial (agora no topo)
  homeButton: {
    ...COMMON_STYLES.button.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xs, // Reduzido para um botão menor
    paddingHorizontal: SPACING.sm, // Reduzido para um botão menor
  },
  homeButtonText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.fontSize.sm, // Reduzido de md para sm
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
});
