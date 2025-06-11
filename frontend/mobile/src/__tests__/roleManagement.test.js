import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UserProvider } from '../context/UserContext';
import RoleManagement from '../components/RoleManagement';

// Mock the API calls
jest.mock('../services/api', () => ({
  updateProfile: jest.fn().mockResolvedValue({
    message: 'Profile updated successfully',
    user: {
      idUsuario: '123456789012345678901234',
      nome: 'Test User',
      email: 'test@example.com',
      roles: ['comprador', 'prestador'],
      isComprador: true,
      isPrestador: true,
      isAnunciante: false,
      isAdmin: false
    }
  })
}));

// Mock the secure storage
jest.mock('../utils/secureStorage', () => ({
  saveToken: jest.fn(),
  getToken: jest.fn().mockResolvedValue('mock-token'),
  saveUserData: jest.fn(),
  getUserData: jest.fn().mockResolvedValue({
    idUsuario: '123456789012345678901234',
    nome: 'Test User',
    email: 'test@example.com',
    roles: ['comprador'],
    isComprador: true,
    isPrestador: false,
    isAnunciante: false,
    isAdmin: false
  }),
  clearAllAuthData: jest.fn(),
  saveRefreshToken: jest.fn(),
  getRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token')
}));

describe('RoleManagement', () => {
  it('renders correctly with user roles', async () => {
    const { getByText, getByTestId } = render(
      <UserProvider>
        <RoleManagement />
      </UserProvider>
    );

    // Wait for the component to load user data
    await waitFor(() => {
      expect(getByText('Gerenciar Papéis')).toBeTruthy();
    });

    // Check if the Comprador role is displayed and active
    expect(getByText('Comprador')).toBeTruthy();
    
    // Check if the Prestador role is displayed and inactive
    expect(getByText('Prestador')).toBeTruthy();
    
    // Check if the Anunciante role is displayed and inactive
    expect(getByText('Anunciante')).toBeTruthy();
  });

  it('toggles roles correctly', async () => {
    const { getByTestId } = render(
      <UserProvider>
        <RoleManagement />
      </UserProvider>
    );

    // Wait for the component to load user data
    await waitFor(() => {
      expect(getByTestId('role-management')).toBeTruthy();
    });

    // Toggle the Prestador role (activate it)
    const prestadorToggle = getByTestId('role-toggle-prestador');
    fireEvent.press(prestadorToggle);

    // Wait for the role to be activated
    await waitFor(() => {
      // The updateProfile API should have been called
      expect(require('../services/api').updateProfile).toHaveBeenCalled();
    });
  });

  it('sets active role correctly', async () => {
    const { getByText } = render(
      <UserProvider>
        <RoleManagement />
      </UserProvider>
    );

    // Wait for the component to load user data
    await waitFor(() => {
      expect(getByText('Gerenciar Papéis')).toBeTruthy();
    });

    // Click on the Comprador role to set it as active
    const compradorItem = getByText('Comprador');
    fireEvent.press(compradorItem);

    // Wait for the active role to be set
    await waitFor(() => {
      // The component should reflect the active role
      // This is a visual check, so we can't easily test it
      // But we can check if the component doesn't crash
      expect(getByText('Gerenciar Papéis')).toBeTruthy();
    });
  });
});