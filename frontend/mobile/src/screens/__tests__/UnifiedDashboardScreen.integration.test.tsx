import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UnifiedDashboardScreen from '../UnifiedDashboardScreen';
import { AuthProvider } from '../../context/AuthContext';
import { User } from '../../types/user';

// Mock MaterialIcons component
jest.mock('@expo/vector-icons', () => {
  // Create a mock component that renders nothing
  const MockMaterialIcons = () => null;

  // Make it a proper React component
  MockMaterialIcons.displayName = 'MockMaterialIcons';

  return {
    MaterialIcons: MockMaterialIcons
  };
});

// Mock the API functions
jest.mock('../../services/api', () => ({
  updateProfile: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
};

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock the custom hooks
jest.mock('../../hooks/useUserRoles', () => ({
  useUserRoles: jest.fn(),
}));

jest.mock('../../hooks/useDashboardState', () => ({
  useDashboardState: jest.fn(),
}));

// Mock the RoleSection component
jest.mock('../../components/RoleSection', () => {
  return jest.fn(({ role, isActive, onToggle, stats, actionButtons, testID }) => (
    <div data-testid={testID || `role-section-${role}`}>
      <button data-testid={`toggle-${role}`} onClick={onToggle}>Toggle {role}</button>
      {isActive && (
        <div data-testid={`content-${role}`}>
          {stats.map((stat, index) => (
            <div key={index} data-testid={`stat-${stat.label}`}>
              {stat.value} {stat.label}
            </div>
          ))}
          {actionButtons.map((button, index) => (
            <button key={index} data-testid={`action-${button.text}`} onClick={button.onPress}>
              {button.text}
            </button>
          ))}
        </div>
      )}
    </div>
  ));
});

// Get the mocked functions
const { useAuth } = require('../../context/AuthContext');
const { useUserRoles } = require('../../hooks/useUserRoles');
const { useDashboardState } = require('../../hooks/useDashboardState');
const { updateProfile } = require('../../services/api');

// Create a wrapper component for the tests
const UnifiedDashboardWithAuth = ({ navigation, route, initialUser }: any) => {
  // Setup the mock implementation for useAuth
  useAuth.mockReturnValue({
    user: initialUser,
    updateUser: jest.fn().mockImplementation(userData => Promise.resolve(userData)),
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
    isTokenValid: true,
    refreshToken: jest.fn().mockResolvedValue(true),
  });

  // Setup the mock implementation for useUserRoles
  useUserRoles.mockReturnValue({
    toggleUserRole: jest.fn().mockImplementation((role, newValue) => {
      // If trying to deactivate the last active role, return failure
      if (initialUser && 
          ((initialUser.isComprador ? 1 : 0) + 
           (initialUser.isPrestador ? 1 : 0) + 
           (initialUser.isAnunciante ? 1 : 0) + 
           (initialUser.isAdmin ? 1 : 0)) === 1 && 
          initialUser[role] === true && 
          newValue === false) {

        Alert.alert(
          "Ação não permitida",
          "Você deve ter pelo menos um papel ativo. Ative outro papel antes de desativar este.",
          [{ text: "OK" }]
        );
        return Promise.resolve({ success: false });
      }

      // Otherwise, call the real updateProfile function
      return updateProfile(initialUser?.token || '', { 
        idUsuario: initialUser?.idUsuario || initialUser?.id, 
        [role]: newValue 
      })
        .then(() => {
          Alert.alert("Sucesso", "Papel atualizado com sucesso!");
          return { success: true, updatedUser: { ...initialUser, [role]: newValue } };
        })
        .catch(error => {
          Alert.alert("Erro", "Não foi possível atualizar seu papel. Tente novamente.");
          return { success: false };
        });
    }),
    getActiveRolesCount: jest.fn().mockImplementation(() => {
      if (!initialUser) return 0;
      return (initialUser.isComprador ? 1 : 0) + 
             (initialUser.isPrestador ? 1 : 0) + 
             (initialUser.isAnunciante ? 1 : 0) + 
             (initialUser.isAdmin ? 1 : 0);
    }),
    isLoading: false,
  });

  // Setup the mock implementation for useDashboardState
  useDashboardState.mockReturnValue({
    state: {
      activeRole: route.params?.initialRole || 
                 (initialUser?.isComprador ? 'comprador' : 
                  initialUser?.isPrestador ? 'prestador' : 
                  initialUser?.isAnunciante ? 'anunciante' : null),
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
    setActiveRole: jest.fn(),
    setLoading: jest.fn(),
    updateBuyerStats: jest.fn(),
    updateProviderStats: jest.fn(),
    updateAdvertiserStats: jest.fn(),
    resetStats: jest.fn(),
  });

  return <UnifiedDashboardScreen navigation={navigation} route={route} />;
};

describe('UnifiedDashboardScreen Integration Tests', () => {
  // Setup common test variables
  const mockUser: User = { 
    idUsuario: '123', 
    id: '123',
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'mock-jwt-token',
    isComprador: true,
    isPrestador: true,
    isAnunciante: false,
    isAdmin: false
  };

  // Mock route
  const mockRoute = {
    params: {}
  };

  // Get the mocked updateProfile function
  const { updateProfile } = require('../../services/api');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    updateProfile.mockResolvedValue({
      user: {
        ...mockUser,
        isAnunciante: true
      },
      token: 'new-mock-token'
    });
  });

  test('renders correctly with user data from AuthContext', async () => {
    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Check if the welcome message is rendered with the user's name
    expect(getByText(`Olá, ${mockUser.nome}`)).toBeTruthy();

    // Check if role management section is rendered
    expect(getByText('Gerenciar Papéis')).toBeTruthy();

    // Check if active roles count is displayed correctly
    expect(getByText('Você possui 2 papéis ativos')).toBeTruthy();
  });

  test('renders all role sections based on user roles', async () => {
    const { getByText, queryByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Check if buyer and provider sections are rendered
    expect(getByText('Comprador')).toBeTruthy();
    expect(getByText('Prestador')).toBeTruthy();

    // Check that advertiser section is not rendered (user is not an advertiser)
    expect(queryByText('Anunciante')).toBeNull();

    // Now render with a user who has all roles
    const userWithAllRoles = {
      ...mockUser,
      isAnunciante: true
    };

    const { getByText: getByTextAllRoles } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={userWithAllRoles} 
      />
    );

    // Check if all sections are rendered
    expect(getByTextAllRoles('Comprador')).toBeTruthy();
    expect(getByTextAllRoles('Prestador')).toBeTruthy();
    expect(getByTextAllRoles('Anunciante')).toBeTruthy();
  });

  test('expands role section when header is clicked', async () => {
    const { getByText, queryByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Initially, the buyer section content should not be visible
    expect(queryByText('Pendentes')).toBeNull();

    // Click on the buyer section header
    fireEvent.press(getByText('Comprador'));

    // Now the buyer section content should be visible
    expect(getByText('Pendentes')).toBeTruthy();
    expect(getByText('Concluídas')).toBeTruthy();
    expect(getByText('Avaliações')).toBeTruthy();
  });

  test('toggles user role when role toggle button is pressed', async () => {
    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Find the Anunciante toggle button
    const anuncianteButton = getByText('Anunciante');

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete
    await waitFor(() => {
      // Check if updateProfile was called with the correct parameters
      expect(updateProfile).toHaveBeenCalledWith('mock-jwt-token', { 
        idUsuario: '123', 
        isAnunciante: true 
      });

      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Sucesso", "Papel atualizado com sucesso!");
    });
  });

  test('prevents deactivating the last active role', async () => {
    // User with only one active role
    const userWithOneRole = {
      ...mockUser,
      isComprador: true,
      isPrestador: false,
      isAnunciante: false,
      isAdmin: false
    };

    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={userWithOneRole} 
      />
    );

    // Find the Comprador toggle button
    const compradorButton = getByText('Comprador');

    // Press the toggle button to try to deactivate the role
    fireEvent.press(compradorButton);

    // Check if error alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      "Ação não permitida",
      "Você deve ter pelo menos um papel ativo. Ative outro papel antes de desativar este.",
      [{ text: "OK" }]
    );

    // Check that updateProfile was not called
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test('navigates to correct screen when action button is pressed', async () => {
    // User with advertiser role
    const userWithAdvertiserRole = {
      ...mockUser,
      isAnunciante: true
    };

    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={userWithAdvertiserRole} 
      />
    );

    // Click on the advertiser section header to expand it
    fireEvent.press(getByText('Anunciante'));

    // Find and press the "Criar Treinamento" button
    const criarTreinamentoButton = getByText('Criar Treinamento');
    fireEvent.press(criarTreinamentoButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TreinamentoCreate');
  });

  test('navigates to home screen when home button is pressed', async () => {
    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Find and press the "Voltar para Início" button
    const homeButton = getByText('Voltar para Início');
    fireEvent.press(homeButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
  });

  test('sets initial active role from route params', async () => {
    // Mock route with initialRole parameter
    const routeWithParams = {
      params: { initialRole: 'prestador' }
    };

    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={routeWithParams} 
        initialUser={mockUser} 
      />
    );

    // Click on the provider section header (it should be expanded by default)
    fireEvent.press(getByText('Prestador'));

    // Check if the provider section content is visible
    expect(getByText('Ofertas')).toBeTruthy();
    expect(getByText('Solicitações')).toBeTruthy();
    expect(getByText('Avaliação')).toBeTruthy();
  });

  test('handles API error when toggling user role', async () => {
    // Setup updateProfile to reject with an error
    updateProfile.mockRejectedValueOnce(new Error('Failed to update role'));

    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={mockUser} 
      />
    );

    // Find the Anunciante toggle button
    const anuncianteButton = getByText('Anunciante');

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the error to be handled
    await waitFor(() => {
      // Check if error alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Erro", "Não foi possível atualizar seu papel. Tente novamente.");
    });
  });

  test('handles missing user data', async () => {
    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={null} 
      />
    );

    // Check if a fallback user name is displayed
    expect(getByText('Olá, Usuário')).toBeTruthy();
  });

  test('integrates with multiple role sections', async () => {
    // User with all roles
    const userWithAllRoles = {
      ...mockUser,
      isComprador: true,
      isPrestador: true,
      isAnunciante: true,
      isAdmin: false
    };

    const { getByText } = render(
      <UnifiedDashboardWithAuth 
        navigation={mockNavigation} 
        route={mockRoute} 
        initialUser={userWithAllRoles} 
      />
    );

    // Expand all sections one by one and check their content

    // Buyer section
    fireEvent.press(getByText('Comprador'));
    expect(getByText('Pendentes')).toBeTruthy();
    expect(getByText('Buscar Serviços')).toBeTruthy();

    // Provider section
    fireEvent.press(getByText('Prestador'));
    expect(getByText('Ofertas')).toBeTruthy();
    expect(getByText('Minhas Ofertas')).toBeTruthy();

    // Advertiser section
    fireEvent.press(getByText('Anunciante'));
    expect(getByText('Treinamentos')).toBeTruthy();
    expect(getByText('Criar Treinamento')).toBeTruthy();
  });
});
