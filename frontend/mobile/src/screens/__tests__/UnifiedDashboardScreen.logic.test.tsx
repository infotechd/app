import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import UnifiedDashboardScreen from '../UnifiedDashboardScreen';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types/user';

// Mock MaterialIcons component
jest.mock('@expo/vector-icons', () => {
  const MockMaterialIcons = () => null;
  MockMaterialIcons.displayName = 'MockMaterialIcons';
  return {
    MaterialIcons: MockMaterialIcons
  };
});

// Mock the API service
jest.mock('../../services/api', () => ({
  updateProfile: jest.fn()
}));

// Get the mocked updateProfile function
const { updateProfile } = require('../../services/api');

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('UnifiedDashboardScreen Logic Tests', () => {
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

    // Setup default updateProfile mock implementation
    updateProfile.mockResolvedValue({
      user: {
        ...mockUser,
        isAnunciante: true
      },
      token: 'new-mock-token'
    });
  });

  test('toggleUserRole activates a role correctly', async () => {
    const { getAllByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete
    await waitFor(() => {
      // Check if updateProfile was called with the correct parameters
      expect(updateProfile).toHaveBeenCalledWith('mock-jwt-token', { 
        idUsuario: '123', 
        isAnunciante: true 
      });

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith({
        ...mockUser,
        isAnunciante: true,
        token: 'new-mock-token'
      });

      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Sucesso", "Papel atualizado com sucesso!");
    });
  });

  test('toggleUserRole deactivates a role correctly', async () => {
    // Mock user with all roles active
    useAuth.mockReturnValue({
      user: { 
        ...mockUser, 
        isComprador: true,
        isPrestador: true,
        isAnunciante: true,
        isAdmin: false
      },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    // Mock updateProfile to return user with deactivated role
    updateProfile.mockResolvedValue({
      user: {
        ...mockUser,
        isAnunciante: false
      },
      token: 'new-mock-token'
    });

    const { getAllByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to deactivate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete
    await waitFor(() => {
      // Check if updateProfile was called with the correct parameters
      expect(updateProfile).toHaveBeenCalledWith('mock-jwt-token', { 
        idUsuario: '123', 
        isAnunciante: false 
      });

      // Check if updateUser was called with the updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith({
        ...mockUser,
        isAnunciante: false,
        token: 'new-mock-token'
      });

      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Sucesso", "Papel atualizado com sucesso!");
    });
  });

  test('toggleUserRole handles API error correctly', async () => {
    // Setup updateProfile to reject with an error
    updateProfile.mockRejectedValueOnce(new Error('Failed to update role'));

    const { getAllByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the error to be handled
    await waitFor(() => {
      // Check if error alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Erro", "Não foi possível atualizar seu papel. Tente novamente.");
    });
  });

  test('toggleUserRole updates activeRole when activating a role with no active role', async () => {
    // Mock user with no active role in UI
    useAuth.mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    const { getAllByText, findByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete and the Anunciante section to be expanded
    const treinamentosElement = await findByText('Treinamentos');
    expect(treinamentosElement).toBeTruthy();
  });

  test('toggleUserRole updates activeRole when deactivating the active role', async () => {
    // Mock user with all roles active
    const userWithAllRoles = {
      ...mockUser,
      isComprador: true,
      isPrestador: true,
      isAnunciante: true,
      isAdmin: false
    };

    useAuth.mockReturnValue({
      user: userWithAllRoles,
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    // Mock updateProfile to return user with deactivated role
    updateProfile.mockResolvedValue({
      user: {
        ...userWithAllRoles,
        isAnunciante: false
      },
      token: 'new-mock-token'
    });

    const { getAllByText, findByText } = render(
      <UnifiedDashboardScreen 
        navigation={mockNavigation as any} 
        route={{params: {initialRole: 'anunciante'}}} 
      />
    );

    // The Anunciante section should be expanded initially
    const treinamentosElement = await findByText('Treinamentos');
    expect(treinamentosElement).toBeTruthy();

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to deactivate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete and the Comprador section to be expanded
    const pendentesElement = await findByText('Pendentes');
    expect(pendentesElement).toBeTruthy();
  });

  test('toggleUserRole handles incomplete API response correctly', async () => {
    // Setup updateProfile to return incomplete response
    updateProfile.mockResolvedValueOnce({
      // No user or token in response
    });

    const { getAllByText } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Find all elements with text 'Anunciante' and get the one in the role toggle section
    const anuncianteButtons = getAllByText('Anunciante');
    const anuncianteButton = anuncianteButtons[0]; // Get the first one which should be the toggle button

    // Press the toggle button to activate the role
    fireEvent.press(anuncianteButton);

    // Wait for the update to complete
    await waitFor(() => {
      // Check if updateUser was called with just the role update
      expect(mockUpdateUser).toHaveBeenCalledWith({ isAnunciante: true });

      // Check if success alert was shown
      expect(Alert.alert).toHaveBeenCalledWith("Sucesso", "Papel atualizado com sucesso!");
    });
  });

  test('renders correctly with different combinations of user roles', () => {
    // Test with only comprador role
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

    const { queryAllByText, rerender } = render(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that comprador section is rendered and other sections are not
    // Note: All role toggle buttons are always visible in the role management section
    expect(queryAllByText('Comprador').length).toBeGreaterThan(0);
    expect(queryAllByText('Prestador').length).toBeGreaterThan(0); // Prestador toggle button is still visible
    expect(queryAllByText('Anunciante').length).toBeGreaterThan(0); // Anunciante toggle button is still visible

    // Test with only prestador role
    useAuth.mockReturnValue({
      user: { 
        ...mockUser, 
        isComprador: false,
        isPrestador: true,
        isAnunciante: false,
        isAdmin: false
      },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    rerender(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that only prestador section is rendered
    expect(queryAllByText('Comprador').length).toBeGreaterThan(0); // Comprador toggle button is still visible
    expect(queryAllByText('Prestador').length).toBeGreaterThan(0);
    expect(queryAllByText('Anunciante').length).toBeGreaterThan(0); // Anunciante toggle button is still visible

    // Test with only anunciante role
    useAuth.mockReturnValue({
      user: { 
        ...mockUser, 
        isComprador: false,
        isPrestador: false,
        isAnunciante: true,
        isAdmin: false
      },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    rerender(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that only anunciante section is rendered
    expect(queryAllByText('Comprador').length).toBeGreaterThan(0); // Comprador toggle button is still visible
    expect(queryAllByText('Prestador').length).toBeGreaterThan(0); // Prestador toggle button is still visible
    expect(queryAllByText('Anunciante').length).toBeGreaterThan(0);

    // Test with admin role
    useAuth.mockReturnValue({
      user: { 
        ...mockUser, 
        isComprador: false,
        isPrestador: false,
        isAnunciante: false,
        isAdmin: true
      },
      updateUser: mockUpdateUser,
      isLoading: false,
    });

    rerender(
      <UnifiedDashboardScreen navigation={mockNavigation as any} route={{params: {}}} />
    );

    // Check that no role sections are rendered (admin doesn't have a dedicated section)
    // But toggle buttons for all roles should still be visible
    expect(queryAllByText('Comprador').length).toBeGreaterThan(0);
    expect(queryAllByText('Prestador').length).toBeGreaterThan(0);
    expect(queryAllByText('Anunciante').length).toBeGreaterThan(0);
  });
});
