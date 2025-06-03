import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UnifiedDashboardScreen from '../UnifiedDashboardScreen';
import { useAuth } from '../../context/AuthContext';
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

// Mock the dependencies
jest.mock('../../services/api', () => ({
  updateProfile: jest.fn().mockResolvedValue({
    user: {
      idUsuario: '123',
      nome: 'Test User',
      email: 'test@example.com',
      isComprador: true,
      isPrestador: true,
      isAnunciante: false,
      isAdmin: false
    },
    token: 'new-mock-token'
  })
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {}
};

describe('UnifiedDashboardScreen', () => {
  // Setup common test variables
  const mockUser: User = { 
    idUsuario: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'mock-jwt-token',
    isComprador: true,
    isPrestador: true,
    isAnunciante: false,
    isAdmin: false
  };

  const mockUpdateUser = jest.fn();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      isLoading: false,
    });
  });

  test('renders correctly with user data', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Check if the welcome message is rendered with the user's name
    expect(getByText(`Olá, ${mockUser.nome}`)).toBeTruthy();

    // Check if role management section is rendered
    expect(getByText('Gerenciar Papéis')).toBeTruthy();

    // Check if active roles count is displayed correctly
    expect(getByText('Você possui 2 papéis ativos')).toBeTruthy();
  });

  test('renders buyer section when user is a buyer', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Check if buyer section is rendered
    expect(getByText('Comprador')).toBeTruthy();
  });

  test('renders provider section when user is a provider', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Check if provider section is rendered
    expect(getByText('Prestador')).toBeTruthy();
  });

  test('does not render advertiser section when user is not an advertiser', () => {
    const { queryByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Check that advertiser section is not rendered
    expect(queryByText('Anunciante')).toBeNull();
  });

  test('renders advertiser section when user is an advertiser', () => {
    // Mock user with advertiser role
    useAuth.mockReturnValue({
      user: { ...mockUser, isAnunciante: true },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Check if advertiser section is rendered
    expect(getByText('Anunciante')).toBeTruthy();
  });

  test('expands role section when header is clicked', () => {
    const { getByText, queryByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
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
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Find the Anunciante toggle button
    const anuncianteButton = getByText('Anunciante');

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete
    await waitFor(() => {
      // Check if updateProfile was called with the correct parameters
      const { updateProfile } = require('../../services/api');
      expect(updateProfile).toHaveBeenCalledWith('mock-jwt-token', { 
        idUsuario: '123', 
        isAnunciante: true 
      });

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalled();

      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Sucesso", "Papel atualizado com sucesso!");
    });
  });

  test('prevents deactivating the last active role', async () => {
    // Mock user with only one active role
    useAuth.mockReturnValue({
      user: { 
        ...mockUser, 
        isComprador: true,
        isPrestador: false,
        isAnunciante: false,
        isAdmin: false
      },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
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
    const { updateProfile } = require('../../services/api');
    expect(updateProfile).not.toHaveBeenCalled();
  });

  test('navigates to correct screen when action button is pressed', async () => {
    // Mock user with advertiser role and set activeRole to 'anunciante'
    useAuth.mockReturnValue({
      user: { ...mockUser, isAnunciante: true },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Click on the advertiser section header to expand it
    fireEvent.press(getByText('Anunciante'));

    // Find and press the "Criar Treinamento" button
    const criarTreinamentoButton = getByText('Criar Treinamento');
    fireEvent.press(criarTreinamentoButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TreinamentoCreate');
  });

  test('navigates to home screen when home button is pressed', () => {
    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    // Find and press the "Voltar para Início" button
    const homeButton = getByText('Voltar para Início');
    fireEvent.press(homeButton);

    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Home');
  });

  test('sets initial active role from route params', () => {
    // Mock route with initialRole parameter
    const routeWithParams = {
      params: { initialRole: 'prestador' }
    };

    const { getByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={routeWithParams as any} />
    );

    // Click on the provider section header (it should be expanded by default)
    fireEvent.press(getByText('Prestador'));

    // Check if the provider section content is visible
    expect(getByText('Ofertas')).toBeTruthy();
    expect(getByText('Solicitações')).toBeTruthy();
    expect(getByText('Avaliação')).toBeTruthy();
  });
});
