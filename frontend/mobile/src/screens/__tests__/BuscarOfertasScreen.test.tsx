import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Animated } from 'react-native';
import BuscarOfertasScreen from '../BuscarOfertasScreen';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchPublicOffers as apiFetchPublicOffers,
  fetchAuthenticatedOffers as apiFetchAuthenticatedOffers
} from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';

// Mock the dependencies
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  fetchPublicOffers: jest.fn(),
  fetchAuthenticatedOffers: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  isHighContrastEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock Alert
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Alert: {
      alert: jest.fn(),
    },
    Animated: {
      ...rn.Animated,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        stopAnimation: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(callback => callback && callback({ finished: true })),
      })),
    },
  };
});

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('BuscarOfertasScreen', () => {
  // Setup common test variables
  const mockUser = { 
    id: '123', 
    nome: 'Test User', 
    email: 'test@example.com',
    token: 'test-token',
    tipoUsuario: 'comprador'
  };

  const mockOffers = [
    { 
      _id: 'offer1', 
      descricao: 'Oferta 1', 
      preco: 100, 
      disponibilidade: 'Segunda a Sexta',
      prestadorId: 'prestador1'
    },
    { 
      _id: 'offer2', 
      descricao: 'Oferta 2', 
      preco: 200, 
      disponibilidade: { observacoes: 'Fins de semana' },
      prestadorId: 'prestador2'
    },
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementation for useAuth
    useAuth.mockReturnValue({
      user: null,
      isTokenValid: false,
    });

    // Setup default mock implementation for API functions
    apiFetchPublicOffers.mockResolvedValue({ offers: [] });
    apiFetchAuthenticatedOffers.mockResolvedValue({ offers: [] });
  });

  test('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Check if the title is rendered
    expect(getByText('Buscar Ofertas')).toBeTruthy();

    // Check if the search inputs are rendered
    expect(getByPlaceholderText('Digite um texto de pesquisa...')).toBeTruthy();
    expect(getByPlaceholderText('Preço Máximo (ex: 50.00)')).toBeTruthy();

    // Check if the buttons are rendered
    expect(getByText('VER OFERTAS')).toBeTruthy();
    expect(getByText('Buscar')).toBeTruthy();
  });

  test('displays authentication status correctly when not authenticated', () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Check if the authentication status is displayed correctly
    expect(getByText('Modo: Visitante (não autenticado)')).toBeTruthy();
  });

  test('displays authentication status correctly when authenticated', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockUser,
      isTokenValid: true,
    });

    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Check if the authentication status is displayed correctly
    expect(getByText('Modo: Autenticado ✓')).toBeTruthy();
  });

  test('handles search button press correctly', async () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Setup mock to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    // Enter search text
    const searchInput = getByPlaceholderText('Digite um texto de pesquisa...');
    fireEvent.changeText(searchInput, 'test search');

    // Enter max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, '150');

    // Press the search button
    const searchButton = getByText('Buscar');
    fireEvent.press(searchButton);

    // Wait for the search to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
        textoPesquisa: 'test search',
        precoMax: 150,
      });
    });
  });

  test('handles "Ver Ofertas" button press correctly', async () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Setup mock to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the search to complete
    await waitFor(() => {
      // Check if the API function was called with the correct parameters
      expect(apiFetchPublicOffers).toHaveBeenCalledWith({
        status: 'ready',
      });
    });
  });

  test('uses authenticated API when user is authenticated', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockUser,
      isTokenValid: true,
    });

    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Setup mock to return offers
    apiFetchAuthenticatedOffers.mockResolvedValue({ offers: mockOffers });

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the search to complete
    await waitFor(() => {
      // Check if the authenticated API function was called with the correct parameters
      expect(apiFetchAuthenticatedOffers).toHaveBeenCalledWith(mockUser.token, {
        status: 'ready',
      });
    });
  });

  test('displays offers correctly after search', async () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Setup mock to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the offers to be displayed
    await waitFor(() => {
      // Check if the offers are displayed
      expect(getByText('Oferta 1')).toBeTruthy();
      expect(getByText('Preço: R$ 100.00')).toBeTruthy();
      expect(getByText('Disponibilidade: Segunda a Sexta')).toBeTruthy();

      expect(getByText('Oferta 2')).toBeTruthy();
      expect(getByText('Preço: R$ 200.00')).toBeTruthy();
      expect(getByText('Disponibilidade: Fins de semana')).toBeTruthy();
    });
  });

  test('navigates to offer details when an offer is pressed', async () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Setup mock to return offers
    apiFetchPublicOffers.mockResolvedValue({ offers: mockOffers });

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the offers to be displayed
    await waitFor(() => {
      // Check if the first offer is displayed
      expect(getByText('Oferta 1')).toBeTruthy();
    });

    // Press the first offer
    fireEvent.press(getByText('Oferta 1'));

    // Check if navigation to offer details happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OfferDetail', {
      offerId: 'offer1'
    });
  });

  test('displays loading indicator during search', async () => {
    // Create a promise that never resolves to simulate a long-running request
    apiFetchPublicOffers.mockImplementation(() => new Promise(resolve => {}));

    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Check if the loading indicator is displayed
    await waitFor(() => {
      expect(getByText('Buscando...')).toBeTruthy();
    });
  });

  test('displays error message when search fails', async () => {
    // Setup mock to throw an error
    const errorMessage = 'Failed to fetch offers';
    apiFetchPublicOffers.mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the error to be displayed
    await waitFor(() => {
      // Check if Alert.alert was called with the error message
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro ao Buscar Ofertas',
        errorMessage
      );
    });
  });

  test('displays empty message when no offers found', async () => {
    // Setup mock to return empty offers array
    apiFetchPublicOffers.mockResolvedValue({ offers: [] });

    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the "Ver Ofertas" button
    const verOfertasButton = getByText('VER OFERTAS');
    fireEvent.press(verOfertasButton);

    // Wait for the empty message to be displayed
    await waitFor(() => {
      expect(getByText('Nenhuma oferta encontrada com estes critérios.')).toBeTruthy();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Informação',
        'Nenhuma oferta encontrada com estes critérios.'
      );
    });
  });

  test('handles invalid max price correctly', async () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Enter invalid max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, 'invalid');

    // Press the search button
    const searchButton = getByText('Buscar');
    fireEvent.press(searchButton);

    // Wait for the alert to be displayed
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Aviso',
        'Preço máximo inválido, buscando sem limite de preço.'
      );
    });

    // Check if the API function was called without precoMax
    expect(apiFetchPublicOffers).toHaveBeenCalledWith({
      status: 'ready',
    });
  });

  test('opens category modal when category selector is pressed', () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the category selector
    fireEvent.press(getByText('Selecione as categorias (opcional)'));

    // Check if the modal title is displayed
    expect(getByText('Selecione as Categorias')).toBeTruthy();
  });

  test('opens state modal when state selector is pressed', () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the state selector
    fireEvent.press(getByText('Estado (opcional)'));

    // Check if the modal title is displayed
    expect(getByText('Selecione o Estado')).toBeTruthy();
  });

  // Tests for recent searches management
  test('saves recent search when search is performed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Enter search text
    const searchInput = getByPlaceholderText('Digite um texto de pesquisa...');
    fireEvent.changeText(searchInput, 'test search');

    // Press the search button
    const searchButton = getByText('Buscar');
    fireEvent.press(searchButton);

    // Wait for the search to complete
    await waitFor(() => {
      // Check if AsyncStorage.setItem was called to save the recent search
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'recentSearches',
        expect.any(String)
      );
    });
  });

  test('loads recent searches on component mount', async () => {
    // Setup mock to return stored searches
    const mockRecentSearches = ['search1', 'search2', 'search3'];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'recentSearches') {
        return Promise.resolve(JSON.stringify(mockRecentSearches));
      }
      return Promise.resolve(null);
    });

    const { findByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Wait for the recent searches to be loaded and displayed
    await findByText('Buscas Recentes:');
    await findByText('search1');
    await findByText('search2');
    await findByText('search3');
  });

  // Tests for recent filters management
  test('saves recent filter when filter is applied', async () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Open the categories modal
    fireEvent.press(getByText('Selecione as categorias (opcional)'));

    // Select a category
    fireEvent.press(getByText('Limpeza'));

    // Confirm the selection
    fireEvent.press(getByText('Confirmar'));

    // Enter max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, '150');

    // Press the search button
    const searchButton = getByText('Buscar');
    fireEvent.press(searchButton);

    // Wait for the search to complete
    await waitFor(() => {
      // Check if AsyncStorage.setItem was called to save the recent filter
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'recentFilters',
        expect.any(String)
      );
    });
  });

  test('loads recent filters on component mount', async () => {
    // Setup mock to return stored filters
    const mockRecentFilters = [
      { categorias: ['Limpeza'], precoMax: '150' },
      { categorias: ['Jardinagem'], precoMax: '200' }
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'recentFilters') {
        return Promise.resolve(JSON.stringify(mockRecentFilters));
      }
      return Promise.resolve(null);
    });

    const { findByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Wait for the recent filters to be loaded and displayed
    await findByText('Filtros Recentes:');
    await findByText('Limpeza');
    await findByText('Jardinagem');
  });

  // Tests for accessibility features
  test('checks accessibility features on component mount', async () => {
    // Mock AccessibilityInfo to return true for screen reader and high contrast
    AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    AccessibilityInfo.isHighContrastEnabled.mockResolvedValue(true);

    const { getByTestId } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Wait for accessibility checks to complete
    await waitFor(() => {
      // Verify that AccessibilityInfo methods were called
      expect(AccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
      expect(AccessibilityInfo.isHighContrastEnabled).toHaveBeenCalled();
    });
  });

  // Tests for filter animations
  test('animates filter expansion when filter header is pressed', async () => {
    const { getByText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Press the categories filter header
    fireEvent.press(getByText('Categorias'));

    // Verify that Animated.timing was called for animation
    expect(Animated.timing).toHaveBeenCalled();
  });

  // Tests for clearing filters
  test('clears all filters when clear filters button is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <BuscarOfertasScreen navigation={mockNavigation as any} />
    );

    // Enter search text
    const searchInput = getByPlaceholderText('Digite um texto de pesquisa...');
    fireEvent.changeText(searchInput, 'test search');

    // Enter max price
    const priceInput = getByPlaceholderText('Preço Máximo (ex: 50.00)');
    fireEvent.changeText(priceInput, '150');

    // Open the categories modal
    fireEvent.press(getByText('Selecione as categorias (opcional)'));

    // Select a category
    fireEvent.press(getByText('Limpeza'));

    // Confirm the selection
    fireEvent.press(getByText('Confirmar'));

    // Press the clear filters button
    fireEvent.press(getByText('Limpar Filtros'));

    // Verify that the filters were cleared
    expect(getByPlaceholderText('Digite um texto de pesquisa...').props.value).toBe('');
    expect(getByPlaceholderText('Preço Máximo (ex: 50.00)').props.value).toBe('');
    expect(getByText('Selecione as categorias (opcional)')).toBeTruthy();
  });
});
