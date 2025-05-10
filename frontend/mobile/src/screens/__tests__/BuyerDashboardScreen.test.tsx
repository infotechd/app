import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BuyerDashboardScreen from '../BuyerDashboardScreen';
import { 
  fetchPublicOffers as apiFetchPublicOffers,
  fetchMyHiredContratacoes as apiFetchMyHiredContratacoes
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Offer } from '../../types/offer';
import { Contratacao } from '../../types/contratacao';

// Mock the dependencies
jest.mock('../../services/api', () => ({
  fetchPublicOffers: jest.fn(),
  fetchMyHiredContratacoes: jest.fn(),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('BuyerDashboardScreen', () => {
  // Setup common test variables
  const mockUser = { 
    id: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'mock-jwt-token'
  };
  
  const mockOffers: Offer[] = [
    {
      _id: 'offer1',
      descricao: 'Test Offer 1',
      preco: 100,
      status: 'ready',
      disponibilidade: 'Imediata',
      prestadorId: 'provider1',
      dataCriacao: '2023-01-01T00:00:00.000Z'
    },
    {
      _id: 'offer2',
      descricao: 'Test Offer 2',
      preco: 200,
      status: 'ready',
      disponibilidade: 'Agendada',
      prestadorId: 'provider2',
      dataCriacao: '2023-01-02T00:00:00.000Z'
    }
  ];
  
  const mockContracts: Contratacao[] = [
    {
      _id: 'contract1',
      ofertaId: 'offer1',
      compradorId: '123',
      prestadorId: 'provider1',
      status: 'accepted',
      precoContratado: 100,
      dataContratacao: '2023-01-03T00:00:00.000Z'
    },
    {
      _id: 'contract2',
      ofertaId: 'offer2',
      compradorId: '123',
      prestadorId: 'provider2',
      status: 'in_progress',
      precoContratado: 200,
      dataContratacao: '2023-01-04T00:00:00.000Z'
    }
  ];
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    useAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });
    apiFetchMyHiredContratacoes.mockResolvedValue({ contratacoes: mockContracts });
  });
  
  test('renders correctly with data', async () => {
    const { getByText, getAllByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the data to load
    await waitFor(() => {
      // Check if the welcome message is rendered with the user's name
      expect(getByText('Bem-vindo, Test User!')).toBeTruthy();
      
      // Check if section titles are rendered
      expect(getByText('Ofertas Disponíveis')).toBeTruthy();
      expect(getByText('Minhas Contratações')).toBeTruthy();
      
      // Check if offers are rendered
      expect(getByText('Test Offer 1')).toBeTruthy();
      expect(getByText('R$ 100.00')).toBeTruthy();
      expect(getByText('Test Offer 2')).toBeTruthy();
      expect(getByText('R$ 200.00')).toBeTruthy();
      
      // Check if contracts are rendered
      expect(getByText('Contrato: contract1')).toBeTruthy();
      expect(getByText('Status: accepted')).toBeTruthy();
      expect(getByText('Contrato: contract2')).toBeTruthy();
      expect(getByText('Status: in_progress')).toBeTruthy();
      
      // Check if action buttons are rendered
      expect(getByText('Buscar Novos Serviços')).toBeTruthy();
      expect(getByText('Ver Treinamentos Disponíveis')).toBeTruthy();
      expect(getByText('Acessar Comunidade')).toBeTruthy();
    });
    
    // Verify that the API functions were called
    expect(apiFetchPublicOffers).toHaveBeenCalledWith({ status: 'ready', limit: 10 });
    expect(apiFetchMyHiredContratacoes).toHaveBeenCalledWith(mockUser.token);
  });
  
  test('renders loading state', () => {
    // Mock the loading state
    apiFetchPublicOffers.mockImplementation(() => new Promise(resolve => {})); // Never resolves
    apiFetchMyHiredContratacoes.mockImplementation(() => new Promise(resolve => {})); // Never resolves
    
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Check if loading indicator is shown
    expect(getByText('Carregando dados...')).toBeTruthy();
  });
  
  test('renders error state', async () => {
    // Mock API error
    const errorMessage = 'Failed to fetch data';
    apiFetchPublicOffers.mockRejectedValue(new Error(errorMessage));
    apiFetchMyHiredContratacoes.mockRejectedValue(new Error(errorMessage));
    
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(getByText(errorMessage)).toBeTruthy();
      expect(getByText('Tentar novamente')).toBeTruthy();
    });
  });
  
  test('navigates to offer detail when offer is pressed', async () => {
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(getByText('Test Offer 1')).toBeTruthy();
    });
    
    // Press the first offer
    fireEvent.press(getByText('Test Offer 1'));
    
    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OfferDetail', { offerId: 'offer1' });
  });
  
  test('navigates to contract detail when contract is pressed', async () => {
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(getByText('Contrato: contract1')).toBeTruthy();
    });
    
    // Press the first contract
    fireEvent.press(getByText('Contrato: contract1'));
    
    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ContratacaoDetalhe', { contratacaoId: 'contract1' });
  });
  
  test('navigates to search offers screen when action button is pressed', async () => {
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(getByText('Buscar Novos Serviços')).toBeTruthy();
    });
    
    // Press the action button
    fireEvent.press(getByText('Buscar Novos Serviços'));
    
    // Check if navigation was called with the correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BuscarOfertas');
  });
  
  test('refreshes data when pull-to-refresh is triggered', async () => {
    const { getByText, UNSAFE_getByType } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(getByText('Bem-vindo, Test User!')).toBeTruthy();
    });
    
    // Clear the API call counts
    apiFetchPublicOffers.mockClear();
    apiFetchMyHiredContratacoes.mockClear();
    
    // Trigger refresh
    const refreshControl = UNSAFE_getByType('RCTRefreshControl');
    fireEvent(refreshControl, 'refresh');
    
    // Verify that the API functions were called again with the refresh flag
    expect(apiFetchPublicOffers).toHaveBeenCalledWith({ status: 'ready', limit: 10 });
    expect(apiFetchMyHiredContratacoes).toHaveBeenCalledWith(mockUser.token);
  });
  
  test('handles retry when error occurs', async () => {
    // Mock API error for the first call, then success for the retry
    apiFetchPublicOffers.mockRejectedValueOnce(new Error('Failed to fetch data'));
    apiFetchMyHiredContratacoes.mockRejectedValueOnce(new Error('Failed to fetch data'));
    
    // Setup success response for retry
    apiFetchPublicOffers.mockResolvedValueOnce({ offers: mockOffers });
    apiFetchMyHiredContratacoes.mockResolvedValueOnce({ contratacoes: mockContracts });
    
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(getByText('Failed to fetch data')).toBeTruthy();
      expect(getByText('Tentar novamente')).toBeTruthy();
    });
    
    // Clear the API call counts
    apiFetchPublicOffers.mockClear();
    apiFetchMyHiredContratacoes.mockClear();
    
    // Press the retry button
    fireEvent.press(getByText('Tentar novamente'));
    
    // Verify that the API functions were called again
    expect(apiFetchPublicOffers).toHaveBeenCalledWith({ status: 'ready', limit: 10 });
    expect(apiFetchMyHiredContratacoes).toHaveBeenCalledWith(mockUser.token);
    
    // Wait for the data to load after retry
    await waitFor(() => {
      expect(getByText('Bem-vindo, Test User!')).toBeTruthy();
    });
  });
  
  test('handles case when user has no token', async () => {
    // Mock user with no token
    useAuth.mockReturnValue({
      user: { ...mockUser, token: undefined },
      isLoading: false,
    });
    
    const { getByText } = render(
      <BuyerDashboardScreen navigation={mockNavigation as any} />
    );
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(getByText('Autenticação necessária.')).toBeTruthy();
    });
    
    // Verify that only fetchPublicOffers was called, not fetchMyHiredContratacoes
    expect(apiFetchPublicOffers).not.toHaveBeenCalled();
    expect(apiFetchMyHiredContratacoes).not.toHaveBeenCalled();
  });
});