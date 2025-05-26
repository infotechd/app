import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BuscarOfertasScreen from '../BuscarOfertasScreen';
import { 
  fetchPublicOffers as apiFetchPublicOffers,
  fetchAuthenticatedOffers as apiFetchAuthenticatedOffers
} from '../../services/api';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the API functions
jest.mock('../../services/api', () => ({
  fetchPublicOffers: jest.fn(),
  fetchAuthenticatedOffers: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Create a wrapper component that provides the AuthContext
const BuscarOfertasScreenWithAuth = ({ navigation }: any) => (
  <AuthProvider>
    <BuscarOfertasScreen navigation={navigation} />
  </AuthProvider>
);

describe('BuscarOfertasScreen Integration Tests', () => {
  // Setup common test variables
  const mockUser = { 
    id: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'test-token',
    tipoUsuario: 'comprador',
    idUsuario: '123'
  };

  const mockOffers = [
    { 
      _id: 'offer1', 
      descricao: 'Oferta 1', 
      preco: 100, 
      disponibilidade: 'Segunda a Sexta',
      prestadorId: 'prestador1',
      categorias: ['Limpeza']
    },
    { 
      _id: 'offer2', 
      descricao: 'Oferta 2', 
      preco: 200, 
      disponibilidade: { observacoes: 'Fins de semana' },
      prestadorId: 'prestador2',
      categorias: ['Jardinagem']
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    apiFetchPublicOffers.mockResolvedValue({ offers: [] });
    apiFetchAuthenticatedOffers.mockResolvedValue({ offers: [] });

    // Setup AsyncStorage to return null (no stored user)
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'appUser') {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
  });

  test('integrates with AuthContext and uses public API when not authenticated', async () => {
    // Setup API to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Check if the authentication status is displayed correctly
    expect(getByText('Modo: Visitante (não autenticado)')).toBeTruthy();

    // Press the "Ver Ofertas" button
    fireEvent.press(getByText('VER OFERTAS'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the public API function was called
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
      });

      // Check if offers are displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(getByText('Oferta 2')).toBeTruthy();
    });
  });

  test('integrates with AuthContext and uses authenticated API when authenticated', async () => {
    // Setup AsyncStorage to return a stored user
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'appUser') {
        return Promise.resolve(JSON.stringify({
          user: mockUser,
          token: mockUser.token,
          expiresAt: new Date(Date.now() + 3600000).toISOString() // Token expires in 1 hour
        }));
      }
      return Promise.resolve(null);
    });

    // Setup API to return offers
    apiFetchAuthenticatedOffers.mockResolvedValue({ offers: mockOffers });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Check if the authentication status is displayed correctly
    await waitFor(() => {
      expect(getByText('Modo: Autenticado ✓')).toBeTruthy();
    });

    // Press the "Ver Ofertas" button
    fireEvent.press(getByText('VER OFERTAS'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the authenticated API function was called with the token
      expect(apiFetchAuthenticatedOffers).toHaveBeenCalledWith(mockUser.token, {
        status: 'ready',
      });

      // Check if offers are displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(getByText('Oferta 2')).toBeTruthy();
    });
  });

  test('performs text search with integration to API', async () => {
    // Setup API to return filtered offers
    const filteredOffers = [mockOffers[0]]; // Only the first offer
    apiFetchPublicOffers.mockResolvedValue({ offers: filteredOffers });

    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Enter search text
    const searchInput = getByPlaceholderText('Digite um texto de pesquisa...');
    fireEvent.changeText(searchInput, 'Oferta 1');

    // Press the search button
    fireEvent.press(getByText('Buscar'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        textoPesquisa: 'oferta 1', // Should be lowercase
      });

      // Check if only the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(() => getByText('Oferta 2')).toThrow();
    });
  });

  test('performs price filtering with integration to API', async () => {
    // Setup API to return filtered offers
    const filteredOffers = [mockOffers[0]]; // Only the first offer (price 100)
    apiFetchPublicOffers.mockResolvedValue({ offers: filteredOffers });

    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Enter max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, '150');

    // Press the search button
    fireEvent.press(getByText('Buscar'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        precoMax: 150,
      });

      // Check if only the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(() => getByText('Oferta 2')).toThrow();
    });
  });

  test('performs category filtering with integration to API', async () => {
    // Setup API to return filtered offers
    const filteredOffers = [mockOffers[0]]; // Only the first offer (Limpeza)
    apiFetchPublicOffers.mockResolvedValue({ offers: filteredOffers });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Open the categories modal
    fireEvent.press(getByText('Selecione as categorias (opcional)'));

    // Select the "Limpeza" category
    fireEvent.press(getByText('Limpeza'));

    // Confirm the selection
    fireEvent.press(getByText('Confirmar'));

    // Press the search button
    fireEvent.press(getByText('Buscar'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        categorias: ['Limpeza'],
      });

      // Check if only the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(() => getByText('Oferta 2')).toThrow();
    });
  });

  test('performs location filtering with integration to API', async () => {
    // Setup API to return filtered offers
    const filteredOffers = [mockOffers[0]]; // Only the first offer
    apiFetchPublicOffers.mockResolvedValue({ offers: filteredOffers });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Open the states modal
    fireEvent.press(getByText('Estado (opcional)'));

    // Select "São Paulo" state
    fireEvent.press(getByText('São Paulo'));

    // Open the cities modal
    fireEvent.press(getByText('Cidade (opcional)'));

    // Select "SP_São Paulo" city
    fireEvent.press(getByText('SP_São Paulo'));

    // Press the search button
    fireEvent.press(getByText('Buscar'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        estado: 'São Paulo',
        cidade: 'SP_São Paulo',
      });

      // Check if only the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(() => getByText('Oferta 2')).toThrow();
    });
  });

  test('handles API errors with proper user feedback', async () => {
    // Setup API to throw an error
    const errorMessage = 'Failed to fetch offers';
    apiFetchPublicOffers.mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Press the "Ver Ofertas" button
    fireEvent.press(getByText('VER OFERTAS'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the alert was shown with the correct error message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro ao Buscar Ofertas',
        errorMessage
      );

      // Check if the error message is displayed in the UI
      expect(getByText(`Erro: ${errorMessage}`)).toBeTruthy();
    });
  });

  test('navigates to offer details with correct parameters', async () => {
    // Setup API to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Press the "Ver Ofertas" button
    fireEvent.press(getByText('VER OFERTAS'));

    // Wait for the offers to be displayed
    await waitFor(() => {
      expect(getByText('Oferta 1')).toBeTruthy();
    });

    // Press the first offer
    fireEvent.press(getByText('Oferta 1'));

    // Check if navigation to offer details happened with correct parameters
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OfferDetail', {
      offerId: 'offer1'
    });
  });

  test('handles empty search results with proper user feedback', async () => {
    // Setup API to return empty offers array
    apiFetchPublicOffers.mockResolvedValue({ offers: [] });

    const { getByText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Press the "Ver Ofertas" button
    fireEvent.press(getByText('VER OFERTAS'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the alert was shown
      expect(Alert.alert).toHaveBeenCalledWith(
        'Informação',
        'Nenhuma oferta encontrada com estes critérios.'
      );

      // Check if the empty message is displayed in the UI
      expect(getByText('Nenhuma oferta encontrada com estes critérios.')).toBeTruthy();
    });
  });

  test('combines multiple filters in a single search', async () => {
    // Setup API to return filtered offers
    const filteredOffers = [mockOffers[0]]; // Only the first offer
    apiFetchPublicOffers.mockResolvedValue({ offers: filteredOffers });

    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreenWithAuth navigation={mockNavigation} />
    );

    // Enter search text
    const searchInput = getByPlaceholderText('Digite um texto de pesquisa...');
    fireEvent.changeText(searchInput, 'Oferta');

    // Enter max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, '150');

    // Open the categories modal
    fireEvent.press(getByText('Selecione as categorias (opcional)'));

    // Select the "Limpeza" category
    fireEvent.press(getByText('Limpeza'));

    // Confirm the selection
    fireEvent.press(getByText('Confirmar'));

    // Press the search button
    fireEvent.press(getByText('Buscar'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        textoPesquisa: 'oferta',
        precoMax: 150,
        categorias: ['Limpeza'],
      });

      // Check if only the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(() => getByText('Oferta 2')).toThrow();
    });
  });
});
