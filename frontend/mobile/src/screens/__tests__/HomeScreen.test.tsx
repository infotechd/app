import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../HomeScreen';
import { useAuth } from '../../context/AuthContext';

// Mock the dependencies
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('HomeScreen', () => {
  // Setup common test variables
  const mockLogout = jest.fn();
  
  // Mock users with different types
  const mockBuyerUser = { 
    id: '123', 
    nome: 'Buyer User', 
    email: 'buyer@example.com',
    tipoUsuario: 'comprador'
  };
  
  const mockProviderUser = { 
    id: '456', 
    nome: 'Provider User', 
    email: 'provider@example.com',
    tipoUsuario: 'prestador'
  };
  
  const mockAdvertiserUser = { 
    id: '789', 
    nome: 'Advertiser User', 
    email: 'advertiser@example.com',
    tipoUsuario: 'anunciante'
  };
  
  const mockAdminUser = { 
    id: '101', 
    nome: 'Admin User', 
    email: 'admin@example.com',
    tipoUsuario: 'administrador'
  };
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation for useAuth
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
    });
  });
  
  test('renders correctly with no user', () => {
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if the welcome message is rendered with default text
    expect(getByText('Bem-vindo(a), Usuário!')).toBeTruthy();
  });
  
  test('renders correctly with user data', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if the welcome message includes the user's name
    expect(getByText(`Bem-vindo(a), ${mockBuyerUser.nome}!`)).toBeTruthy();
    
    // Check if user info is displayed
    expect(getByText(`Email: ${mockBuyerUser.email}`)).toBeTruthy();
    expect(getByText(`Tipo de Usuário: ${mockBuyerUser.tipoUsuario}`)).toBeTruthy();
  });
  
  test('redirects buyer user to BuyerDashboard', () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Fast-forward timers to trigger the useEffect
    jest.advanceTimersByTime(100);
    
    // Check if navigation to BuyerDashboard happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuyerDashboard');
  });
  
  test('redirects provider user to ProviderDashboard', () => {
    // Setup auth context with a provider user
    useAuth.mockReturnValue({
      user: mockProviderUser,
      logout: mockLogout,
    });
    
    render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Fast-forward timers to trigger the useEffect
    jest.advanceTimersByTime(100);
    
    // Check if navigation to ProviderDashboard happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ProviderDashboard');
  });
  
  test('redirects advertiser user to AdvertiserDashboard', () => {
    // Setup auth context with an advertiser user
    useAuth.mockReturnValue({
      user: mockAdvertiserUser,
      logout: mockLogout,
    });
    
    render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Fast-forward timers to trigger the useEffect
    jest.advanceTimersByTime(100);
    
    // Check if navigation to AdvertiserDashboard happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AdvertiserDashboard');
  });
  
  test('does not redirect admin user', () => {
    // Setup auth context with an admin user
    useAuth.mockReturnValue({
      user: mockAdminUser,
      logout: mockLogout,
    });
    
    render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Fast-forward timers to trigger the useEffect
    jest.advanceTimersByTime(100);
    
    // Check that navigation was not called
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
  
  test('logs warning for unknown user type', () => {
    // Mock console.warn
    const originalWarn = console.warn;
    console.warn = jest.fn();
    
    // Setup auth context with an unknown user type
    const unknownUser = { ...mockBuyerUser, tipoUsuario: 'unknown' };
    useAuth.mockReturnValue({
      user: unknownUser,
      logout: mockLogout,
    });
    
    render(<HomeScreen navigation={mockNavigation as any} />);
    
    // Fast-forward timers to trigger the useEffect
    jest.advanceTimersByTime(100);
    
    // Check if warning was logged
    expect(console.warn).toHaveBeenCalledWith(`Tipo de usuário desconhecido: ${unknownUser.tipoUsuario}`);
    
    // Restore console.warn
    console.warn = originalWarn;
  });
  
  test('renders buyer-specific buttons when user is a buyer', () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if buyer-specific buttons are rendered
    expect(getByText('Buscar Serviços')).toBeTruthy();
    expect(getByText('Meu Painel')).toBeTruthy();
    expect(getByText('Treinamentos')).toBeTruthy();
    expect(getByText('Comunidade')).toBeTruthy();
  });
  
  test('renders provider-specific buttons when user is a provider', () => {
    // Setup auth context with a provider user
    useAuth.mockReturnValue({
      user: mockProviderUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if provider-specific buttons are rendered
    expect(getByText('Minhas Ofertas')).toBeTruthy();
    expect(getByText('Meu Painel')).toBeTruthy();
    expect(getByText('Minha Agenda')).toBeTruthy();
    expect(getByText('Meu Currículo')).toBeTruthy();
  });
  
  test('renders advertiser-specific buttons when user is an advertiser', () => {
    // Setup auth context with an advertiser user
    useAuth.mockReturnValue({
      user: mockAdvertiserUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if advertiser-specific buttons are rendered
    expect(getByText('Criar Treinamento')).toBeTruthy();
    expect(getByText('Meu Painel')).toBeTruthy();
    expect(getByText('Relatórios')).toBeTruthy();
  });
  
  test('renders common buttons for all users', () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Check if common buttons are rendered
    expect(getByText('Notificações')).toBeTruthy();
    expect(getByText('Editar Perfil')).toBeTruthy();
    expect(getByText('Sair (Logout)')).toBeTruthy();
  });
  
  test('handles logout button press', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Press the logout button
    fireEvent.press(getByText('Sair (Logout)'));
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });
  
  test('navigates to BuscarOfertas when Buscar Serviços button is pressed', () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Press the Buscar Serviços button
    fireEvent.press(getByText('Buscar Serviços'));
    
    // Check if navigation happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuscarOfertas');
  });
  
  test('navigates to BuyerDashboard when Meu Painel button is pressed (buyer)', () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Press the Meu Painel button
    fireEvent.press(getByText('Meu Painel'));
    
    // Check if navigation happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuyerDashboard');
  });
  
  test('navigates to OfertaServico when Minhas Ofertas button is pressed', () => {
    // Setup auth context with a provider user
    useAuth.mockReturnValue({
      user: mockProviderUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Press the Minhas Ofertas button
    fireEvent.press(getByText('Minhas Ofertas'));
    
    // Check if navigation happened with correct params
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OfertaServico', { offerId: '', mode: 'list' });
  });
  
  test('navigates to EditProfile when Editar Perfil button is pressed', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { getByText } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Press the Editar Perfil button
    fireEvent.press(getByText('Editar Perfil'));
    
    // Check if navigation happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
  });
  
  test('cleans up timer on unmount', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
      logout: mockLogout,
    });
    
    const { unmount } = render(
      <HomeScreen navigation={mockNavigation as any} />
    );
    
    // Unmount the component
    unmount();
    
    // Check if clearTimeout was called
    expect(clearTimeout).toHaveBeenCalled();
  });
});