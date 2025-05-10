import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OfferDetailScreen from '../OfferDetailScreen';
import { useAuth } from '@/context/AuthContext';
import { fetchPublicOfferById, fetchMyOfferById } from '@/services/api';
import { TipoUsuarioEnum } from '@/types/user';

// Mock the dependencies
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  fetchPublicOfferById: jest.fn(),
  fetchMyOfferById: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    offerId: '123',
  },
};

describe('OfferDetailScreen', () => {
  // Setup common test variables
  const mockToken = 'mock-token';
  
  // Mock users with different types
  const mockBuyerUser = { 
    idUsuario: '123', 
    nome: 'Buyer User', 
    email: 'buyer@example.com',
    tipoUsuario: TipoUsuarioEnum.COMPRADOR,
    token: mockToken
  };
  
  const mockProviderUser = { 
    idUsuario: '456', 
    nome: 'Provider User', 
    email: 'provider@example.com',
    tipoUsuario: TipoUsuarioEnum.PRESTADOR,
    token: mockToken
  };

  // Mock offer data
  const mockOffer = {
    id: '123',
    descricao: 'Test Offer',
    preco: 100.0,
    prestadorId: '456',
    status: 'ready',
    disponibilidade: {
      duracaoMediaMinutos: 60,
      observacoes: 'Test observations',
      recorrenciaSemanal: [
        {
          diaSemana: 1, // Monday
          horarios: [
            { inicio: '09:00', fim: '10:00' },
            { inicio: '14:00', fim: '15:00' },
          ],
        },
      ],
    },
    dataCriacao: '2023-01-01T00:00:00.000Z',
    dataAtualizacao: '2023-01-02T00:00:00.000Z',
  };

  // Mock offer owned by the buyer (for testing non-owner view)
  const mockOfferOwnedByOther = {
    ...mockOffer,
    prestadorId: '789', // Different from both mock users
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation for useAuth
    useAuth.mockReturnValue({
      user: null,
    });

    // Setup default mock implementations for API functions
    fetchPublicOfferById.mockResolvedValue({ offer: null });
    fetchMyOfferById.mockResolvedValue({ offer: null });
  });

  test('renders loading state correctly', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    const { getByText, getByTestId } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Check if loading indicator and text are displayed
    expect(getByText('Carregando detalhes da oferta...')).toBeTruthy();
  });

  test('renders error state correctly when API call fails', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an error
    fetchPublicOfferById.mockRejectedValue(new Error('API Error'));

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the error state to be rendered
    const errorTitle = await findByText('Erro ao carregar oferta');
    expect(errorTitle).toBeTruthy();
    expect(getByText('API Error')).toBeTruthy();
    
    // Check if retry button is displayed
    const retryButton = getByText('Tentar novamente');
    expect(retryButton).toBeTruthy();
    
    // Test retry functionality
    fetchPublicOfferById.mockResolvedValue({ offer: mockOffer });
    fireEvent.press(retryButton);
    
    // Verify API was called again
    expect(fetchPublicOfferById).toHaveBeenCalledTimes(2);
  });

  test('renders not found state correctly when offer is null', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return null offer
    fetchPublicOfferById.mockResolvedValue({ offer: null });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the not found state to be rendered
    const notFoundTitle = await findByText('Oferta não encontrada');
    expect(notFoundTitle).toBeTruthy();
    expect(getByText('A oferta solicitada não existe ou não está disponível.')).toBeTruthy();
    
    // Check if back button is displayed
    const backButton = getByText('Voltar');
    expect(backButton).toBeTruthy();
    
    // Test back button functionality
    fireEvent.press(backButton);
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test('renders offer details correctly for a buyer (non-owner)', async () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer not owned by the user
    fetchPublicOfferById.mockResolvedValue({ offer: mockOfferOwnedByOther });

    const { getByText, findByText, queryByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const offerTitle = await findByText(mockOfferOwnedByOther.descricao);
    expect(offerTitle).toBeTruthy();
    
    // Check if price is displayed correctly
    expect(getByText('R$ 100,00')).toBeTruthy();
    
    // Check if status is displayed correctly
    expect(getByText('Disponível')).toBeTruthy();
    
    // Check if provider info is displayed
    expect(getByText(`ID do Prestador: ${mockOfferOwnedByOther.prestadorId}`)).toBeTruthy();
    
    // Check if availability info is displayed
    expect(getByText('Duração média:')).toBeTruthy();
    expect(getByText('60 minutos')).toBeTruthy();
    expect(getByText('Observações:')).toBeTruthy();
    expect(getByText('Test observations')).toBeTruthy();
    expect(getByText('Disponibilidade semanal:')).toBeTruthy();
    expect(getByText('Segunda:')).toBeTruthy();
    expect(getByText('09:00 - 10:00')).toBeTruthy();
    expect(getByText('14:00 - 15:00')).toBeTruthy();
    
    // Check if dates are displayed
    expect(getByText('Criado em: 01/01/2023')).toBeTruthy();
    expect(getByText('Atualizado em: 02/01/2023')).toBeTruthy();
    
    // Check if contract button is displayed (for buyer)
    expect(getByText('Contratar Serviço')).toBeTruthy();
    
    // Check that edit and delete buttons are NOT displayed (for non-owner)
    expect(queryByText('Editar Oferta')).toBeNull();
    expect(queryByText('Excluir Oferta')).toBeNull();
  });

  test('renders offer details correctly for a provider (owner)', async () => {
    // Setup auth context with a provider user who owns the offer
    useAuth.mockReturnValue({
      user: mockProviderUser,
    });

    // Mock API to return an offer owned by the user
    fetchMyOfferById.mockResolvedValue({ offer: mockOffer });

    const { getByText, findByText, queryByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const offerTitle = await findByText(mockOffer.descricao);
    expect(offerTitle).toBeTruthy();
    
    // Check if edit and delete buttons are displayed (for owner)
    expect(getByText('Editar Oferta')).toBeTruthy();
    expect(getByText('Excluir Oferta')).toBeTruthy();
    
    // Check that contract button is NOT displayed (for owner)
    expect(queryByText('Contratar Serviço')).toBeNull();
  });

  test('handles contract button press correctly for unauthenticated user', async () => {
    // Setup auth context with no user
    useAuth.mockReturnValue({
      user: null,
    });

    // Mock API to return an offer
    fetchPublicOfferById.mockResolvedValue({ offer: mockOffer });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const contractButton = await findByText('Contratar Serviço');
    
    // Press the contract button
    fireEvent.press(contractButton);
    
    // Check if Alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Autenticação necessária',
      'Você precisa estar logado para contratar um serviço.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar' }),
        expect.objectContaining({ text: 'Fazer login' })
      ])
    );
    
    // Simulate pressing the "Fazer login" button
    const loginAction = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    loginAction();
    
    // Check if navigation to Login happened
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  test('handles contract button press correctly for authenticated user', async () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer
    fetchPublicOfferById.mockResolvedValue({ offer: mockOfferOwnedByOther });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const contractButton = await findByText('Contratar Serviço');
    
    // Press the contract button
    fireEvent.press(contractButton);
    
    // Check if navigation to Contratacao happened with correct params
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Contratacao', { ofertaId: '123' });
  });

  test('handles edit button press correctly', async () => {
    // Setup auth context with a provider user who owns the offer
    useAuth.mockReturnValue({
      user: mockProviderUser,
    });

    // Mock API to return an offer owned by the user
    fetchMyOfferById.mockResolvedValue({ offer: mockOffer });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const editButton = await findByText('Editar Oferta');
    
    // Press the edit button
    fireEvent.press(editButton);
    
    // Check if navigation to OfertaServico happened with correct params
    expect(mockNavigation.navigate).toHaveBeenCalledWith('OfertaServico', { offerId: '123', mode: 'edit' });
  });

  test('handles delete button press correctly', async () => {
    // Setup auth context with a provider user who owns the offer
    useAuth.mockReturnValue({
      user: mockProviderUser,
    });

    // Mock API to return an offer owned by the user
    fetchMyOfferById.mockResolvedValue({ offer: mockOffer });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    const deleteButton = await findByText('Excluir Oferta');
    
    // Press the delete button
    fireEvent.press(deleteButton);
    
    // Check if confirmation Alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta oferta? Esta ação não pode ser desfeita.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar' }),
        expect.objectContaining({ text: 'Excluir' })
      ])
    );
    
    // Simulate pressing the "Excluir" button
    const deleteAction = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
    deleteAction();
    
    // Check if implementation message was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Funcionalidade em implementação',
      'A exclusão de ofertas será implementada em breve.'
    );
  });

  test('formats price correctly', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer with a specific price
    const offerWithPrice = {
      ...mockOffer,
      preco: 1234.56,
    };
    fetchPublicOfferById.mockResolvedValue({ offer: offerWithPrice });

    const { findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the price to be rendered and check if it's formatted correctly
    const formattedPrice = await findByText('R$ 1.234,56');
    expect(formattedPrice).toBeTruthy();
  });

  test('formats string disponibilidade correctly', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer with string disponibilidade
    const offerWithStringDisp = {
      ...mockOffer,
      disponibilidade: 'Disponível de segunda a sexta',
    };
    fetchPublicOfferById.mockResolvedValue({ offer: offerWithStringDisp });

    const { findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the disponibilidade to be rendered and check if it's displayed correctly
    const disponibilidade = await findByText('Disponível de segunda a sexta');
    expect(disponibilidade).toBeTruthy();
  });

  test('handles missing offerId correctly', () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock route with no offerId
    const routeWithoutOfferId = {
      params: {},
    };

    const { getByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={routeWithoutOfferId as any} />
    );
    
    // Check if error message is displayed
    expect(getByText('Erro ao carregar oferta')).toBeTruthy();
    expect(getByText('ID da oferta não fornecido')).toBeTruthy();
  });

  test('handles refresh correctly', async () => {
    // Setup auth context with a user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer
    fetchPublicOfferById.mockResolvedValue({ offer: mockOffer });

    const { UNSAFE_getByType } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for initial render to complete
    await waitFor(() => {
      expect(fetchPublicOfferById).toHaveBeenCalledTimes(1);
    });
    
    // Clear the mock to track new calls
    fetchPublicOfferById.mockClear();
    
    // Find the RefreshControl and trigger a refresh
    const refreshControl = UNSAFE_getByType('RCTRefreshControl');
    fireEvent(refreshControl, 'refresh');
    
    // Check if API was called again
    expect(fetchPublicOfferById).toHaveBeenCalledTimes(1);
  });

  test('tries fetchMyOfferById first for provider users', async () => {
    // Setup auth context with a provider user
    useAuth.mockReturnValue({
      user: mockProviderUser,
    });

    // Mock API calls
    fetchMyOfferById.mockResolvedValue({ offer: null });
    fetchPublicOfferById.mockResolvedValue({ offer: mockOffer });

    render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(fetchMyOfferById).toHaveBeenCalledWith(mockToken, '123');
      expect(fetchPublicOfferById).toHaveBeenCalledWith('123');
    });
  });

  test('does not try fetchMyOfferById for non-provider users', async () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API calls
    fetchPublicOfferById.mockResolvedValue({ offer: mockOffer });

    render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for API calls to complete
    await waitFor(() => {
      expect(fetchMyOfferById).not.toHaveBeenCalled();
      expect(fetchPublicOfferById).toHaveBeenCalledWith('123');
    });
  });

  test('disables contract button when offer status is not ready', async () => {
    // Setup auth context with a buyer user
    useAuth.mockReturnValue({
      user: mockBuyerUser,
    });

    // Mock API to return an offer with inactive status
    const inactiveOffer = {
      ...mockOfferOwnedByOther,
      status: 'inactive',
    };
    fetchPublicOfferById.mockResolvedValue({ offer: inactiveOffer });

    const { getByText, findByText } = render(
      <OfferDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    // Wait for the offer details to be rendered
    await findByText(inactiveOffer.descricao);
    
    // Check if status is displayed correctly
    expect(getByText('Inativa')).toBeTruthy();
    
    // Find the contract button
    const contractButton = getByText('Contratar Serviço');
    
    // Check if it's disabled (this is a bit tricky in RNTL, we'd need to check the props)
    // For now, we'll just verify it exists
    expect(contractButton).toBeTruthy();
    
    // Press the button and check that navigation doesn't happen
    fireEvent.press(contractButton);
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});