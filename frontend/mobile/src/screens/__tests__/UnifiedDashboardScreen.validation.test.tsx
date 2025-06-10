import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UnifiedDashboardScreen from '../UnifiedDashboardScreen';
import { useUser } from '../../context/UserContext';
import { User, UserRole } from '../../types/user';
import { useDashboardState } from '../../hooks/useDashboardState';

// Mock MaterialIcons component
jest.mock('@expo/vector-icons', () => {
  const MockMaterialIcons = () => null;
  MockMaterialIcons.displayName = 'MockMaterialIcons';
  return {
    MaterialIcons: MockMaterialIcons
  };
});

// Mock the dependencies
jest.mock('../../context/UserContext', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../hooks/useDashboardState', () => ({
  useDashboardState: jest.fn(),
}));

// Mock components
jest.mock('../../components/RoleSection', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return jest.fn(({ role, isActive, onToggle, stats, actionButtons, testID }) => (
    <View testID={testID || `role-section-${role}`}>
      <TouchableOpacity testID={`toggle-${role}`} onPress={onToggle}>
        <Text>Toggle {role}</Text>
      </TouchableOpacity>
      {isActive && (
        <View testID={`content-${role}`}>
          {stats && stats.map((stat, index) => (
            <View key={index} testID={`stat-${stat.label}`}>
              <Text>{stat.value} {stat.label}</Text>
            </View>
          ))}
          {actionButtons && actionButtons.map((button, index) => (
            <TouchableOpacity key={index} testID={`action-${button.text}`} onPress={button.onPress}>
              <Text>{button.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  ));
});

jest.mock('../../components/RoleManagement', () => {
  const { View, Text } = require('react-native');
  return jest.fn(({ testID }) => (
    <View testID={testID || 'role-management'}>
      <Text>Gerenciar Papéis</Text>
    </View>
  ));
});

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('UnifiedDashboardScreen Validation Tests', () => {
  // Setup common test variables
  const mockUser: User = { 
    idUsuario: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'mock-jwt-token',
    roles: ['comprador', 'prestador']
  };

  const mockSetActiveRole = jest.fn();
  const mockSetActiveRoleContext = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useUser.mockReturnValue({
      user: mockUser,
      hasRole: (role: UserRole) => mockUser.roles?.includes(role) || false,
      setActiveRole: mockSetActiveRoleContext,
    });

    useDashboardState.mockReturnValue({
      state: {
        activeRole: null,
        isLoading: false,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });
  });

  test('validates user object structure', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if the welcome message is rendered with the user's name
    expect(getByText(`Olá, ${mockUser.nome}`)).toBeTruthy();
  });

  test('validates handling of null user object', () => {
    // Mock null user
    useUser.mockReturnValue({
      user: null,
      hasRole: () => false,
      setActiveRole: mockSetActiveRoleContext,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if the welcome message is rendered with fallback text
    expect(getByText('Olá, Usuário')).toBeTruthy();
  });

  test('validates handling of user without roles array', () => {
    // Mock user without roles array
    const userWithoutRoles = { ...mockUser, roles: undefined };
    useUser.mockReturnValue({
      user: userWithoutRoles,
      hasRole: () => false,
      setActiveRole: mockSetActiveRoleContext,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if the active roles count is displayed correctly
    expect(getByText('Você possui 0 papéis ativos')).toBeTruthy();
  });

  test('validates handling of user with empty roles array', () => {
    // Mock user with empty roles array
    const userWithEmptyRoles = { ...mockUser, roles: [] };
    useUser.mockReturnValue({
      user: userWithEmptyRoles,
      hasRole: () => false,
      setActiveRole: mockSetActiveRoleContext,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if the active roles count is displayed correctly
    expect(getByText('Você possui 0 papéis ativos')).toBeTruthy();
  });

  test('validates route params initialRole with valid role', () => {
    // Mock route with valid initialRole
    const routeWithValidRole = {
      params: { initialRole: 'prestador' }
    };

    render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={routeWithValidRole as any} />
    );

    // Check if setActiveRole was called with the correct role
    expect(mockSetActiveRole).toHaveBeenCalledWith('prestador');
    expect(mockSetActiveRoleContext).toHaveBeenCalledWith('prestador');
  });

  test('validates route params initialRole with invalid role', () => {
    // Mock route with invalid initialRole
    const routeWithInvalidRole = {
      params: { initialRole: 'invalid_role' }
    };

    render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={routeWithInvalidRole as any} />
    );

    // Check that setActiveRole was not called with the invalid role
    expect(mockSetActiveRole).not.toHaveBeenCalledWith('invalid_role');
    expect(mockSetActiveRoleContext).not.toHaveBeenCalledWith('invalid_role');
  });

  test('validates stats data structure for buyer role', async () => {
    // Set active role to comprador
    useDashboardState.mockReturnValue({
      state: {
        activeRole: 'comprador',
        isLoading: false,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if buyer section content is rendered with correct stats
    expect(getByTestId('content-comprador')).toBeTruthy();
  });

  test('validates stats data structure for provider role', async () => {
    // Set active role to prestador
    useDashboardState.mockReturnValue({
      state: {
        activeRole: 'prestador',
        isLoading: false,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if provider section content is rendered with correct stats
    expect(getByTestId('content-prestador')).toBeTruthy();
  });

  test('validates stats data structure for advertiser role', async () => {
    // Mock user with advertiser role
    useUser.mockReturnValue({
      user: { ...mockUser, roles: ['comprador', 'prestador', 'anunciante'] },
      hasRole: (role: UserRole) => ['comprador', 'prestador', 'anunciante'].includes(role),
      setActiveRole: mockSetActiveRoleContext,
    });

    // Set active role to anunciante
    useDashboardState.mockReturnValue({
      state: {
        activeRole: 'anunciante',
        isLoading: false,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if advertiser section content is rendered with correct stats
    expect(getByTestId('content-anunciante')).toBeTruthy();
  });

  test('validates handling of missing stats data', async () => {
    // Set active role to comprador with empty stats object
    useDashboardState.mockReturnValue({
      state: {
        activeRole: 'comprador',
        isLoading: false,
        stats: {
          buyer: {
            contratacoesPendentes: 0,
            contratacoesConcluidas: 0,
            avaliacoesRecebidas: 0,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    // This should not throw an error
    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check if buyer section is still rendered
    expect(getByTestId('buyer-role-section')).toBeTruthy();
  });

  test('validates role section rendering based on user roles', () => {
    // Mock user with specific roles
    useUser.mockReturnValue({
      user: { ...mockUser, roles: ['comprador', 'anunciante'] },
      hasRole: (role: UserRole) => ['comprador', 'anunciante'].includes(role),
      setActiveRole: mockSetActiveRoleContext,
    });

    const { getByTestId, queryByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that comprador and anunciante sections are rendered
    expect(getByTestId('buyer-role-section')).toBeTruthy();
    expect(getByTestId('advertiser-role-section')).toBeTruthy();

    // Check that prestador section is not rendered
    expect(queryByTestId('provider-role-section')).toBeNull();
  });

  test('validates navigation to correct screens from action buttons', async () => {
    // Set active role to comprador
    useDashboardState.mockReturnValue({
      state: {
        activeRole: 'comprador',
        isLoading: false,
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find and press the "Buscar Serviços" button
    const buscarServicosButton = getByTestId('action-Buscar Serviços');
    fireEvent.press(buscarServicosButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuscarOfertas');
  });

  test('validates home button navigation', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find and press the "Voltar para Início" button
    const homeButton = getByText('Voltar para Início');
    fireEvent.press(homeButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
  });

  test('validates handling of loading state', () => {
    // Set loading state to true
    useDashboardState.mockReturnValue({
      state: {
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
      },
      setActiveRole: mockSetActiveRole,
      setLoading: jest.fn(),
    });

    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that role sections are rendered with loading state
    expect(getByTestId('buyer-role-section')).toBeTruthy();
  });

  test('validates role section toggle behavior', () => {
    const { getByTestId } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find and press the toggle button for comprador section
    const compradorToggle = getByTestId('toggle-comprador');
    fireEvent.press(compradorToggle);

    // Check if setActiveRole was called with the correct role
    expect(mockSetActiveRole).toHaveBeenCalledWith('comprador');
  });
});
