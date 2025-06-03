/**
 * Sistema de design com temas e variáveis de estilo
 * Centraliza cores, espaçamentos e tipografia para manter consistência no aplicativo
 */

// Cores principais do aplicativo
export const COLORS = {
  // Cores primárias
  primary: '#4A90E2',
  primaryLight: '#E3F2FD',
  primaryDark: '#1A5AA0',

  // Cores secundárias
  secondary: '#50C878', // Verde
  secondaryLight: '#E8F5E9',
  secondaryDark: '#2E7D32',

  // Cores de destaque
  accent: '#9C27B0', // Roxo
  accentLight: '#F3E5F5',
  accentDark: '#6A1B9A',

  // Cores de alerta
  warning: '#FF8C00', // Laranja
  warningLight: '#FFF3E0',
  warningDark: '#E65100',

  error: '#F44336', // Vermelho
  errorLight: '#FFEBEE',
  errorDark: '#B71C1C',

  success: '#4CAF50', // Verde
  successLight: '#E8F5E9',
  successDark: '#2E7D32',

  // Cores neutras
  background: '#f8f8f8',
  surface: '#FFFFFF',
  divider: '#f0f0f0',

  // Cores de texto
  textPrimary: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',
  textInverted: '#FFFFFF',
};

// Espaçamentos consistentes
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Raios de borda
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999, // Para elementos circulares
};

// Tipografia
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

// Sombras
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
};

// Configuração de papéis de usuário
export const ROLE_CONFIG = {
  comprador: {
    icon: 'shopping-cart',
    color: COLORS.primary,
    bgColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  prestador: {
    icon: 'build',
    color: COLORS.secondary,
    bgColor: COLORS.secondaryLight,
    borderColor: COLORS.secondary,
  },
  anunciante: {
    icon: 'campaign',
    color: COLORS.warning,
    bgColor: COLORS.warningLight,
    borderColor: COLORS.warning,
  },
  admin: {
    icon: 'admin-panel-settings',
    color: COLORS.accent,
    bgColor: COLORS.accentLight,
    borderColor: COLORS.accent,
  },
};

// Estilos comuns reutilizáveis
export const COMMON_STYLES = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  button: {
    primary: {
      backgroundColor: COLORS.primary,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
      alignItems: 'center' as const,
    },
    secondary: {
      backgroundColor: COLORS.background,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
      borderWidth: 1,
      borderColor: COLORS.primary,
      alignItems: 'center' as const,
    },
  },
  buttonText: {
    primary: {
      color: COLORS.textInverted,
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: '600',
    },
    secondary: {
      color: COLORS.primary,
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: '600',
    },
  },
};
